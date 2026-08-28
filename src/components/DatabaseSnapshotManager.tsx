import React, { useState, useEffect } from 'react';
import { 
  History, 
  Camera, 
  RotateCcw, 
  Trash2, 
  GitCompare, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  RefreshCw, 
  Database, 
  ArrowRight,
  Plus,
  Play,
  X,
  ShieldAlert
} from 'lucide-react';
import { BubbleDataType, DatabaseSnapshot, DataGridRecord, ProjectProfile, RollbackExecutionResult, SnapshotComparisonReport } from '../types';
import { SnapshotEngine } from '../core/snapshots/snapshotEngine';
import { DataGridEngine } from '../core/data-grid/dataGridEngine';

interface DatabaseSnapshotManagerProps {
  project?: ProjectProfile;
  dataTypes: BubbleDataType[];
  onLog: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const DatabaseSnapshotManager: React.FC<DatabaseSnapshotManagerProps> = ({
  project,
  dataTypes,
  onLog
}) => {
  const [snapshots, setSnapshots] = useState<DatabaseSnapshot[]>([]);
  const [selectedType, setSelectedType] = useState<string>(dataTypes[0]?.name || 'User');
  const [snapshotName, setSnapshotName] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  // Comparison State
  const [baselineId, setBaselineId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [diffReport, setDiffReport] = useState<SnapshotComparisonReport | null>(null);

  // Rollback State
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackResult, setRollbackResult] = useState<RollbackExecutionResult | null>(null);

  // Modal Confirmation States
  const [snapshotToDelete, setSnapshotToDelete] = useState<DatabaseSnapshot | null>(null);
  const [showRollbackModal, setShowRollbackModal] = useState<boolean>(false);

  useEffect(() => {
    loadSnapshots();
  }, [project?.name]);

  const loadSnapshots = async () => {
    if (!project) return;
    const list = await SnapshotEngine.getSnapshots(project.name || project.appId);
    setSnapshots(list);
    if (list.length >= 2) {
      setBaselineId(list[1].id);
      setTargetId(list[0].id);
    } else if (list.length === 1) {
      setBaselineId(list[0].id);
      setTargetId(list[0].id);
    }
  };

  const handleCaptureSnapshot = async () => {
    if (!project) return;
    setIsCapturing(true);
    onLog('devops', `Capturing point-in-time snapshot for table '${selectedType}'...`);
    try {
      const snap = await SnapshotEngine.createSnapshot(
        project,
        selectedType,
        snapshotName || `Snapshot ${selectedType} (${new Date().toLocaleTimeString()})`
      );
      setSnapshots(prev => [snap, ...prev]);
      setSnapshotName('');
      onLog('devops', `Snapshot '${snap.name}' saved to IndexedDB with ${snap.recordCount} records.`, 'success');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    await SnapshotEngine.deleteSnapshot(id);
    setSnapshots(prev => prev.filter(s => s.id !== id));
    if (diffReport?.baselineSnapshotId === id || diffReport?.targetSnapshotId === id) {
      setDiffReport(null);
    }
    onLog('devops', `Deleted snapshot ${id}`, 'info');
  };

  const handleCompare = () => {
    const base = snapshots.find(s => s.id === baselineId);
    const targ = snapshots.find(s => s.id === targetId);
    if (!base || !targ) return;

    const rep = SnapshotEngine.compareSnapshots(base, targ);
    setDiffReport(rep);
    setRollbackResult(null);
    onLog('devops', `Calculated diff between '${base.name}' and '${targ.name}': ${rep.modifiedCount} modified, ${rep.addedCount} added, ${rep.deletedCount} deleted.`);
  };

  const handleExecuteRollback = async () => {
    if (!project || !baselineId) return;
    const base = snapshots.find(s => s.id === baselineId);
    if (!base) return;

    setShowRollbackModal(false);
    setIsRollingBack(true);
    onLog('devops', `Executing 1-Click Rollback to restore '${base.name}'...`);
    try {
      // Get current live records
      const curRes = await DataGridEngine.fetchRecords(project, base.dataType, { limit: 100 });
      const result = await SnapshotEngine.rollbackToSnapshot(project, base, curRes.records);
      setRollbackResult(result);
      onLog('devops', `Rollback completed: ${result.totalCompensations} compensations executed with ${result.failedCount} errors.`, result.success ? 'success' : 'warn');
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Action Bar: Create Snapshot */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(16, 185, 129, 0.08) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="card-title">
              <History size={18} color="var(--primary)" />
              <span>Point-in-Time Database Snapshots</span>
            </div>
            <div className="card-subtitle">Take instant local snapshots before migrations or seedings to enable 1-Click Rollback</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="select"
              style={{ width: '130px', fontSize: '0.8rem' }}
            >
              {dataTypes.map(d => (
                <option key={d.id || d.name} value={d.name}>{d.name}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Snapshot label (optional)..."
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              className="input"
              style={{ width: '220px', fontSize: '0.8rem', height: '32px' }}
            />

            <button onClick={handleCaptureSnapshot} disabled={isCapturing} className="btn btn-primary btn-sm">
              <Camera size={13} className={isCapturing ? 'spin' : ''} />
              <span>{isCapturing ? 'Capturing...' : 'Capture Snapshot'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot List & Diff Comparison */}
      <div className="responsive-split" style={{ gridTemplateColumns: '0.9fr 1.1fr', alignItems: 'start' }}>
        {/* Left: Snapshots List */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Saved Snapshots ({snapshots.length})</div>
              <div className="card-subtitle">Persisted locally in IndexedDB storage</div>
            </div>
            <button onClick={loadSnapshots} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px' }}>
              <RefreshCw size={11} />
            </button>
          </div>

          {snapshots.length === 0 ? (
            <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Camera size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div>No snapshots taken yet</div>
              <p style={{ fontSize: '0.75rem', margin: '4px 0 0' }}>Capture a snapshot before running seedings or tests.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              {snapshots.map(snap => (
                <div key={snap.id} style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {snap.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Table: <strong>{snap.dataType}</strong> • {snap.recordCount} records • {new Date(snap.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setBaselineId(snap.id);
                        handleCompare();
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                      title="Set as Baseline"
                    >
                      Compare
                    </button>
                    <button
                      onClick={() => setSnapshotToDelete(snap)}
                      style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', opacity: 0.7, padding: '2px 4px' }}
                      title="Delete Snapshot"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Differential Visualizer & 1-Click Rollback */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <GitCompare size={16} color="var(--primary)" />
                <span>Differential Inspector & Rollback</span>
              </div>
              <div className="card-subtitle">Compare snapshots and roll back compensations</div>
            </div>

            <button onClick={handleCompare} disabled={snapshots.length < 1} className="btn btn-secondary btn-sm">
              <span>Run Diff</span>
            </button>
          </div>

          {/* Snapshot selector inputs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label">Baseline (Restore Point)</label>
              <select
                value={baselineId}
                onChange={(e) => setBaselineId(e.target.value)}
                className="select"
                style={{ fontSize: '0.75rem' }}
              >
                {snapshots.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.dataType})</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label className="input-label">Target (Current / Comparison)</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="select"
                style={{ fontSize: '0.75rem' }}
              >
                {snapshots.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.dataType})</option>
                ))}
              </select>
            </div>
          </div>

          {diffReport ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Metric badges */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge badge-indigo">
                  {diffReport.unchangedCount} Unchanged
                </span>
                <span className="badge badge-amber">
                  {diffReport.modifiedCount} Modified
                </span>
                <span className="badge badge-emerald">
                  {diffReport.addedCount} Added
                </span>
                <span className="badge badge-rose">
                  {diffReport.deletedCount} Deleted
                </span>
              </div>

              {/* Differential Record List */}
              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {diffReport.recordDiffs.map((diff, dIdx) => (
                  <div key={dIdx} style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: diff.diffType === 'added' ? 'rgba(16, 185, 129, 0.08)' : diff.diffType === 'deleted' ? 'rgba(244, 63, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {diff.recordId}
                      </span>
                      <span className={`badge ${diff.diffType === 'added' ? 'badge-emerald' : diff.diffType === 'deleted' ? 'badge-rose' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                        {diff.diffType.toUpperCase()}
                      </span>
                    </div>

                    {diff.fieldDiffs && diff.fieldDiffs.map((fd, fdIdx) => (
                      <div key={fdIdx} style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <strong>{fd.field}</strong>: <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>"{String(fd.oldValue)}"</span> ➔ <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>"{String(fd.newValue)}"</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* 1-Click Rollback Trigger */}
              <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Restore live database to baseline snapshot
                </div>

                <button
                  type="button"
                  onClick={() => setShowRollbackModal(true)}
                  disabled={isRollingBack}
                  className="btn btn-primary btn-sm"
                  style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #6366f1 100%)' }}
                >
                  <RotateCcw size={13} className={isRollingBack ? 'spin' : ''} />
                  <span>{isRollingBack ? 'Restoring...' : '1-Click Rollback to Baseline'}</span>
                </button>
              </div>

              {rollbackResult && (
                <div style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  background: rollbackResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                  border: `1px solid ${rollbackResult.success ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
                  fontSize: '0.75rem'
                }}>
                  <div style={{ fontWeight: 700, color: rollbackResult.success ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {rollbackResult.success ? '✓ Rollback Executed Successfully' : '⚠ Rollback Completed with Warnings'}
                  </div>
                  <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                    Recreated: {rollbackResult.recreatedRecords} • Restored Fields: {rollbackResult.restoredFields} • Purged: {rollbackResult.purgedNewRecords}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Select a baseline snapshot and click "Run Diff" to preview differential changes.
            </div>
          )}
        </div>
      </div>

      {/* Delete Snapshot Confirmation Modal */}
      {snapshotToDelete && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: 'var(--bg-surface-elevated, #121826)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(244, 63, 94, 0.15)',
            overflow: 'hidden',
            animation: 'modalSlideIn 0.2s ease-out'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(18, 24, 38, 0.9) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(244, 63, 94, 0.2)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-rose, #f43f5e)'
                }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Delete Snapshot
                  </h2>
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                    Permanent deletion confirmation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSnapshotToDelete(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Are you sure you want to delete snapshot <strong style={{ color: 'var(--text-primary)' }}>{snapshotToDelete.name}</strong>?
              </p>

              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.775rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div>• <strong>Table:</strong> {snapshotToDelete.dataType}</div>
                <div>• <strong>Records:</strong> {snapshotToDelete.recordCount} rows</div>
                <div>• <strong>Created:</strong> {new Date(snapshotToDelete.createdAt).toLocaleString()}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSnapshotToDelete(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = snapshotToDelete.id;
                    setSnapshotToDelete(null);
                    await handleDeleteSnapshot(id);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{
                    backgroundColor: 'var(--accent-rose, #f43f5e)',
                    borderColor: 'rgba(244, 63, 94, 0.4)'
                  }}
                >
                  <Trash2 size={13} />
                  <span>Yes, Delete Snapshot</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click Rollback Confirmation Modal */}
      {showRollbackModal && (() => {
        const base = snapshots.find(s => s.id === baselineId);
        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}>
            <div style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--bg-surface-elevated, #121826)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: 'var(--radius-lg, 12px)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2)',
              overflow: 'hidden',
              animation: 'modalSlideIn 0.2s ease-out'
            }}>
              <div style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(18, 24, 38, 0.9) 100%)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.25)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary, #6366f1)'
                  }}>
                    <RotateCcw size={18} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Execute 1-Click Rollback
                    </h2>
                    <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                      Restore live database to baseline point
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRollbackModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Are you sure you want to execute compensations to restore table <strong style={{ color: 'var(--accent-cyan)' }}>{base?.dataType || selectedType}</strong> back to baseline <strong style={{ color: 'var(--text-primary)' }}>{base?.name || 'Snapshot'}</strong>?
                </p>

                {diffReport && (
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.775rem',
                    color: 'var(--text-secondary)',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px'
                  }}>
                    <div>• Modified: <strong>{diffReport.modifiedCount}</strong></div>
                    <div>• Deleted: <strong>{diffReport.deletedCount}</strong></div>
                    <div>• Added: <strong>{diffReport.addedCount}</strong></div>
                    <div>• Unchanged: <strong>{diffReport.unchangedCount}</strong></div>
                  </div>
                )}

                <div style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  fontSize: '0.75rem',
                  color: 'var(--accent-amber)'
                }}>
                  ⚠️ This will patch modified fields, re-create missing records, and clean up un-baseline records in your active database.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowRollbackModal(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteRollback}
                    className="btn btn-primary btn-sm"
                    style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #6366f1 100%)' }}
                  >
                    <RotateCcw size={13} />
                    <span>Confirm & Execute Rollback</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
