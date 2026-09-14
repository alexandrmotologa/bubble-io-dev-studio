import { describe, it, expect } from 'vitest';
import { PluginSecurityScanner } from '../../src/core/audit/pluginSecurityScanner';

describe('PluginSecurityScanner', () => {
  it('should detect exposed Stripe secret keys and flag as critical leak', () => {
    const dummyStripeKey = ['sk', 'live', '51M0000000000000000000000'].join('_');
    const mockBlueprint = {
      plugins: {
        stripe_payment: {
          name: 'Stripe Custom Gateway',
          version: '1.0.0',
          author: 'Dev',
          api_version: 'v3',
          header: `<script>var stripe_secret = "${dummyStripeKey}";</script>`
        }
      }
    };

    const report = PluginSecurityScanner.scan(mockBlueprint);

    expect(report.totalPlugins).toBe(1);
    expect(report.secretLeaksCount).toBe(1);
    expect(report.secretLeaks[0].secretType).toBe('stripe_secret');
    expect(report.secretLeaks[0].maskedValue).toContain('sk_live');
    expect(report.criticalIssuesCount).toBeGreaterThan(0);
    expect(report.securityScore).toBeLessThan(70);
  });

  it('should detect deprecated Bubble Plugin API v2 and flag as warning', () => {
    const mockBlueprint = {
      plugins: {
        legacy_tool: {
          name: 'Old Form Validator',
          version: '1.0.2',
          author: 'Legacy Contributor',
          api_version: 'v2',
          load_in_header: true
        }
      }
    };

    const report = PluginSecurityScanner.scan(mockBlueprint);

    expect(report.plugins[0].isDeprecated).toBe(true);
    expect(report.plugins[0].apiVersion).toBe('v2');
    const depVuln = report.vulnerabilities.find(v => v.type === 'deprecated_api');
    expect(depVuln).toBeDefined();
    expect(depVuln?.severity).toBe('warning');
  });

  it('should flag insecure HTTP external script endpoints', () => {
    const mockBlueprint = {
      plugins: {
        insecure_script: {
          name: 'Insecure Widget',
          version: '2.1.0',
          api_version: 'v3',
          header: '<script src="http://unsecured-cdn.com/lib.js"></script>'
        }
      }
    };

    const report = PluginSecurityScanner.scan(mockBlueprint);

    expect(report.plugins[0].insecureHttpUrls.length).toBeGreaterThan(0);
    const mixedContentVuln = report.vulnerabilities.find(v => v.type === 'insecure_cdn');
    expect(mixedContentVuln).toBeDefined();
    expect(mixedContentVuln?.severity).toBe('critical');
  });

  it('should flag unmaintained plugins not updated in >2 years', () => {
    const mockBlueprint = {
      plugins: {
        abandoned_plugin: {
          name: 'Abandoned Charting Lib',
          version: '1.0.0',
          last_updated: '2021-01-15T00:00:00.000Z',
          api_version: 'v3'
        }
      }
    };

    const report = PluginSecurityScanner.scan(mockBlueprint);

    expect(report.plugins[0].isStale).toBe(true);
    expect(report.plugins[0].daysSinceUpdate).toBeGreaterThan(730);
    const staleVuln = report.vulnerabilities.find(v => v.type === 'stale_version');
    expect(staleVuln).toBeDefined();
    expect(staleVuln?.severity).toBe('warning');
  });

  it('should generate comprehensive markdown report', () => {
    const report = PluginSecurityScanner.scan();
    const md = PluginSecurityScanner.generateMarkdownReport(report, 'Test App');

    expect(md).toContain('# Bubble.io Plugin Security & Deprecation Audit Report');
    expect(md).toContain('Executive Security Scorecard');
    expect(md).toContain('Installed Plugins Deep Inspection');
  });
});
