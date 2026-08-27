import { 
  DatabaseSnapshot, 
  DataGridRecord, 
  ProjectProfile, 
  RollbackExecutionResult, 
  SnapshotComparisonReport, 
  SnapshotFieldDiff, 
  SnapshotRecordDiff 
} from '../../types';
import { DB_STORES, IndexedDbStore } from '../storage/indexedDbStore';
import { DataGridEngine } from '../data-grid/dataGridEngine';

export class SnapshotEngine {
  /**
   * Captures an instant point-in-time snapshot of table records into IndexedDB
   */
  public static async createSnapshot(
    project: ProjectProfile,
    dataType: string,
    name?: string,
    description?: string
  ): Promise<DatabaseSnapshot> {
    // 1. Fetch current records
    const res = await DataGridEngine.fetchRecords(project, dataType, { limit: 100 });
    const records = res.records;

    const snapshot: DatabaseSnapshot = {
      id: `snap_${Date.now()}`,
      name: name || `Snapshot ${dataType} (${new Date().toLocaleTimeString()})`,
      description: description || `Point-in-time capture of ${records.length} records in table '${dataType}'.`,
      appName: project.name || project.appId,
      environment: project.environment || 'version-test',
      createdAt: new Date().toISOString(),
      dataType,
      recordCount: records.length,
      records
    };

    // 2. Persist into IndexedDB
    try {
      await IndexedDbStore.put(DB_STORES.SNAPSHOTS, snapshot);
    } catch (e: any) {
      console.warn('Failed to persist snapshot to IndexedDB, saving to memory:', e.message);
    }

    return snapshot;
  }

  /**
   * Retrieves all saved snapshots for the active project
   */
  public static async getSnapshots(appName?: string): Promise<DatabaseSnapshot[]> {
    try {
      const all = await IndexedDbStore.getAll<DatabaseSnapshot>(DB_STORES.SNAPSHOTS);
      return all
        .filter((s: DatabaseSnapshot) => s.appName === appName)
        .sort((a: DatabaseSnapshot, b: DatabaseSnapshot) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return [];
    }
  }

  /**
   * Deletes a snapshot from IndexedDB
   */
  public static async deleteSnapshot(snapshotId: string): Promise<void> {
    try {
      await IndexedDbStore.delete(DB_STORES.SNAPSHOTS, snapshotId);
    } catch (e: any) {
      console.warn('Failed to delete snapshot:', e.message);
    }
  }

  /**
   * Compares Baseline snapshot with Target snapshot to calculate field-level diffs
   */
  public static compareSnapshots(
    baseline: DatabaseSnapshot,
    target: DatabaseSnapshot
  ): SnapshotComparisonReport {
    const baselineMap = new Map<string, DataGridRecord>(baseline.records.map(r => [r._id, r]));
    const targetMap = new Map<string, DataGridRecord>(target.records.map(r => [r._id, r]));

    const diffs: SnapshotRecordDiff[] = [];
    let addedCount = 0;
    let modifiedCount = 0;
    let deletedCount = 0;
    let unchangedCount = 0;

    // Check additions and modifications in target
    for (const [id, targetRec] of targetMap.entries()) {
      if (!baselineMap.has(id)) {
        addedCount++;
        diffs.push({
          recordId: id,
          diffType: 'added',
          recordData: targetRec
        });
      } else {
        const baseRec = baselineMap.get(id)!;
        const fieldDiffs: SnapshotFieldDiff[] = [];

        const allKeys = new Set([...Object.keys(baseRec), ...Object.keys(targetRec)]);
        for (const k of allKeys) {
          if (k === '_id' || k === 'Modified Date') continue;
          if (JSON.stringify(baseRec[k]) !== JSON.stringify(targetRec[k])) {
            fieldDiffs.push({
              field: k,
              oldValue: baseRec[k],
              newValue: targetRec[k]
            });
          }
        }

        if (fieldDiffs.length > 0) {
          modifiedCount++;
          diffs.push({
            recordId: id,
            diffType: 'modified',
            fieldDiffs,
            recordData: targetRec
          });
        } else {
          unchangedCount++;
        }
      }
    }

    // Check deletions from baseline
    for (const [id, baseRec] of baselineMap.entries()) {
      if (!targetMap.has(id)) {
        deletedCount++;
        diffs.push({
          recordId: id,
          diffType: 'deleted',
          recordData: baseRec
        });
      }
    }

    return {
      baselineSnapshotId: baseline.id,
      targetSnapshotId: target.id,
      dataType: baseline.dataType,
      addedCount,
      modifiedCount,
      deletedCount,
      unchangedCount,
      recordDiffs: diffs
    };
  }

  /**
   * Executes 1-Click Rollback compensations to restore database to original baseline
   */
  public static async rollbackToSnapshot(
    project: ProjectProfile,
    baseline: DatabaseSnapshot,
    currentRecords: DataGridRecord[]
  ): Promise<RollbackExecutionResult> {
    const logs: string[] = [];
    let recreatedCount = 0;
    let restoredFieldCount = 0;
    let purgedCount = 0;
    let failedCount = 0;

    const currentMap = new Map<string, DataGridRecord>(currentRecords.map(r => [r._id, r]));
    const baselineMap = new Map<string, DataGridRecord>(baseline.records.map(r => [r._id, r]));

    logs.push(`Starting Rollback to snapshot '${baseline.name}' (${baseline.records.length} records)...`);

    // 1. Recreate missing / deleted records
    for (const [id, baseRec] of baselineMap.entries()) {
      if (!currentMap.has(id)) {
        const { _id, 'Created Date': cd, 'Modified Date': md, ...cleanPayload } = baseRec;
        const res = await DataGridEngine.createRecord(project, baseline.dataType, cleanPayload);
        if (res.success) {
          recreatedCount++;
          logs.push(`[Recreated] Record ${id} (${baseRec.name || baseRec.email || 'item'})`);
        } else {
          failedCount++;
          logs.push(`[Failed Recreate] ${id}: ${res.message}`);
        }
      }
    }

    // 2. Restore modified fields
    for (const [id, baseRec] of baselineMap.entries()) {
      if (currentMap.has(id)) {
        const curRec = currentMap.get(id)!;
        for (const [k, v] of Object.entries(baseRec)) {
          if (k === '_id' || k === 'Created Date' || k === 'Modified Date') continue;
          if (JSON.stringify(curRec[k]) !== JSON.stringify(v)) {
            const res = await DataGridEngine.updateRecordField(project, baseline.dataType, id, k, v);
            if (res.success) {
              restoredFieldCount++;
              logs.push(`[Restored Field] ${id}.${k} ➔ "${v}"`);
            } else {
              failedCount++;
            }
          }
        }
      }
    }

    // 3. Purge uncommitted new records
    for (const [id] of currentMap.entries()) {
      if (!baselineMap.has(id)) {
        const res = await DataGridEngine.deleteRecord(project, baseline.dataType, id);
        if (res.success) {
          purgedCount++;
          logs.push(`[Purged New Record] ${id}`);
        } else {
          failedCount++;
        }
      }
    }

    const total = recreatedCount + restoredFieldCount + purgedCount;
    logs.push(`Rollback finished. Executed ${total} compensation steps (${failedCount} errors).`);

    return {
      success: failedCount === 0,
      totalCompensations: total,
      recreatedRecords: recreatedCount,
      restoredFields: restoredFieldCount,
      purgedNewRecords: purgedCount,
      failedCount,
      logs
    };
  }
}
