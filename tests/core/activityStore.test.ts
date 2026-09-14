import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivityStore } from '../../src/core/activity/activityStore';

describe('ActivityStore', () => {
  beforeEach(() => {
    ActivityStore.clear();
  });

  it('should record an activity entry and notify subscribers', () => {
    let captured: any[] = [];
    const unsubscribe = ActivityStore.subscribe((entries) => {
      captured = entries;
    });

    const entry = ActivityStore.record({
      type: 'backup',
      title: 'Database Backup Completed',
      message: 'Exported 1,500 records',
      projectId: 'proj_test'
    });

    expect(entry.id).toBeDefined();
    expect(entry.type).toBe('backup');
    expect(captured.length).toBeGreaterThan(0);
    expect(captured[0].title).toBe('Database Backup Completed');

    unsubscribe();
  });

  it('should filter activities by project and type', () => {
    ActivityStore.record({
      type: 'backup',
      title: 'Backup 1',
      message: 'Done',
      projectId: 'proj_A'
    });

    ActivityStore.record({
      type: 'audit',
      title: 'Audit 1',
      message: 'Done',
      projectId: 'proj_B'
    });

    const forProjectA = ActivityStore.getActivities({ projectId: 'proj_A' });
    expect(forProjectA.length).toBe(1);
    expect(forProjectA[0].type).toBe('backup');

    const onlyAudits = ActivityStore.getActivities({ type: 'audit' });
    expect(onlyAudits.length).toBe(1);
    expect(onlyAudits[0].projectId).toBe('proj_B');
  });
});
