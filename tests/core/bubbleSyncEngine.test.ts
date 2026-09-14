import { describe, it, expect } from 'vitest';
import { BubbleSyncEngine } from '../../src/core/bubble-sync/bubbleSyncEngine';
import { ProjectProfile } from '../../src/types';

describe('BubbleSyncEngine', () => {
  const sampleBlueprintData = {
    pages: {
      index: {
        elements: {
          header: { type: 'Group' },
          footer: { type: 'Group' }
        },
        workflows: {
          on_load: { event: 'page_loaded' }
        }
      },
      dashboard: {
        elements: {
          sidebar: { type: 'Group' },
          chart: { type: 'Group' }
        },
        workflows: {
          btn_click: { event: 'button_clicked' }
        }
      }
    },
    element_definitions: {
      custom_dropdown: { type: 'Reusable' }
    },
    workflows: {
      backend_cron: { event: 'cron' }
    },
    user_types: {
      user: { name: 'User' }
    },
    custom_types: {
      transaction: { name: 'Transaction' }
    },
    app_texts: {
      lbl_welcome: 'Welcome back!',
      lbl_logout: 'Sign Out'
    }
  };

  it('calculates AST blueprint statistics accurately from JSON structure', () => {
    const stats = BubbleSyncEngine.calculateBlueprintStats(sampleBlueprintData);

    expect(stats).toBeDefined();
    expect(stats.pagesCount).toBe(2);
    expect(stats.elementsCount).toBe(5); // 2 on index + 2 on dashboard + 1 reusable
    expect(stats.workflowsCount).toBe(3); // 1 on index + 1 on dashboard + 1 backend
    expect(stats.dataTypesCount).toBe(2); // user + transaction
    expect(stats.appTextsCount).toBe(2);
  });

  it('handles null or malformed data gracefully in calculateBlueprintStats', () => {
    const emptyStats = BubbleSyncEngine.calculateBlueprintStats(null);
    expect(emptyStats).toEqual({
      pagesCount: 0,
      workflowsCount: 0,
      elementsCount: 0,
      dataTypesCount: 0,
      appTextsCount: 0
    });

    const invalidStats = BubbleSyncEngine.calculateBlueprintStats('not an object');
    expect(invalidStats.pagesCount).toBe(0);
  });

  it('returns false for checkAuthStatus in non-electron test environment', async () => {
    const status = await BubbleSyncEngine.checkAuthStatus();
    expect(status).toBeDefined();
    expect(status.isAuthenticated).toBe(false);
  });

  it('fails gracefully when generating blueprint from project without appId', async () => {
    const emptyProject: ProjectProfile = {
      id: 'p_test',
      name: 'Test Project',
      appId: '',
      environment: 'development',
      createdAt: new Date().toISOString()
    };

    const res = await BubbleSyncEngine.generateBlueprintFromApi(emptyProject);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Application ID is missing');
  });

  it('reports downloads watcher active status', () => {
    const active = BubbleSyncEngine.isDownloadsWatcherActive();
    expect(typeof active).toBe('boolean');
  });
});
