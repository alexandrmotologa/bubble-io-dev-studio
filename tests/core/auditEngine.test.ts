import { describe, it, expect } from 'vitest';
import { AuditEngine } from '../../src/core/audit/auditEngine';

describe('AuditEngine', () => {
  const sampleBlueprint = {
    name: 'Test Bubble App',
    pages: {
      index: {
        name: 'index',
        elements: {
          group_hero: {
            name: 'Hero Banner',
            type: 'Group',
            is_hidden: false
          },
          btn_orphan: {
            name: 'Orphan Button',
            type: 'Button',
            is_hidden: true
          }
        },
        workflows: {
          wf_1: {
            name: 'Page Loaded',
            event_type: 'page_load',
            actions: [{ name: 'Show Banner' }]
          }
        }
      }
    },
    data_types: {
      user: {
        fields: {
          email: { type: 'text' },
          role: { type: 'text' }
        }
      }
    }
  };

  it('should parse and analyze a blueprint to calculate health score', async () => {
    const report = await AuditEngine.analyzeApp(sampleBlueprint);

    expect(report).toBeDefined();
    expect(report.score).toBeGreaterThan(0);
    expect(typeof report.grade).toBe('string');
    expect(Array.isArray(report.deadItems)).toBe(true);
  });

  it('should generate a cleanup manifest JSON', async () => {
    const report = await AuditEngine.analyzeApp(sampleBlueprint);
    const manifestJson = AuditEngine.generateCleanupManifest(report);

    expect(manifestJson).toContain('cleanableItems');
    const parsed = JSON.parse(manifestJson);
    expect(parsed.appName).toBe('Test Bubble App');
  });

  it('should generate markdown report', async () => {
    const report = await AuditEngine.analyzeApp(sampleBlueprint);
    const md = AuditEngine.generateMarkdown(report);

    expect(md).toContain('Dead Code & App Health Audit Report');
    expect(md).toContain('Health Score');
  });
});
