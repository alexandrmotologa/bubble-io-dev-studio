import React, { useState, useMemo } from 'react';
import { ShieldAlert, Download, Copy, Check, Search } from 'lucide-react';
import { BubbleSchema, PiiAuditReport } from '../../types';
import { PiiScanner } from '../../core/devops/piiScanner';
import { toast } from '../../core/toast/toastManager';

interface PiiAuditTabProps {
  schema: BubbleSchema | null;
  onLog?: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const PiiAuditTab: React.FC<PiiAuditTabProps> = ({ schema, onLog }) => {
  const [piiSeverityFilter, setPiiSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [piiCategoryFilter, setPiiCategoryFilter] = useState<string>('ALL');
  const [piiSearchQuery, setPiiSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const piiReport: PiiAuditReport | null = useMemo(() => {
    if (!schema || schema.dataTypes.length === 0) return null;
    return PiiScanner.scanSchema(schema);
  }, [schema]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
    onLog?.('devops', `Copied ${label} to clipboard.`, 'info');
  };

  const handleDownloadCode = (code: string, defaultFilename: string) => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${defaultFilename}!`);
    onLog?.('devops', `Downloaded ${defaultFilename} to disk.`, 'success');
  };

  if (!piiReport) {
    return (
      <div className="card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <ShieldAlert size={36} style={{ margin: '0 auto 12px', opacity: 0.5, display: 'block', color: 'var(--accent-rose)' }} />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          No Schema Loaded for PII Audit
        </h3>
        <p style={{ fontSize: '0.8rem', maxWidth: '440px', margin: '0 auto' }}>
          Import a <code>.bubble</code> file or connect to live Bubble Data API to scan for vulnerable PII fields.
        </p>
      </div>
    );
  }

  const filteredFindings = piiReport.findings.filter(f => {
    if (piiSeverityFilter !== 'ALL' && f.severity !== piiSeverityFilter) return false;
    if (piiCategoryFilter !== 'ALL' && f.category !== piiCategoryFilter) return false;
    if (piiSearchQuery) {
      const q = piiSearchQuery.toLowerCase();
      const matchTable = f.table.toLowerCase().includes(q);
      const matchField = f.field.toLowerCase().includes(q);
      const matchDesc = f.description.toLowerCase().includes(q);
      if (!matchTable && !matchField && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="var(--accent-rose)" />
              <span>Personally Identifiable Information (PII) & Privacy Audit</span>
            </div>
            <div className="card-subtitle">Scans schema field names across 8 vulnerability categories with Bubble Privacy Rule remediations</div>
          </div>

          {/* Quick Export Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                const md = PiiScanner.generateMarkdownReport(piiReport);
                handleDownloadCode(md, `${piiReport.appName || 'bubble'}-pii-audit-report.md`);
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Download size={13} color="var(--primary)" />
              <span>Report (.md)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const json = JSON.stringify(piiReport, null, 2);
                handleDownloadCode(json, `${piiReport.appName || 'bubble'}-pii-audit.json`);
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Download size={13} color="var(--accent-cyan)" />
              <span>Report (.json)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const matrix = PiiScanner.generatePrivacyRulesMatrix(piiReport);
                handleCopy(matrix, 'Privacy Rules Matrix');
              }}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>Copy Privacy Matrix</span>
            </button>
          </div>
        </div>

        {/* Metric Risk Cards with Click-to-Filter */}
        <div className="grid-3" style={{ marginBottom: '16px' }}>
          <div 
            onClick={() => setPiiSeverityFilter(prev => prev === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
            className="card" 
            style={{ 
              padding: '12px 16px', 
              background: piiSeverityFilter === 'CRITICAL' ? 'rgba(244, 63, 94, 0.22)' : 'rgba(244, 63, 94, 0.1)', 
              border: piiSeverityFilter === 'CRITICAL' ? '2px solid #f43f5e' : '1px solid rgba(244, 63, 94, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Click to filter Critical findings"
          >
            <div style={{ fontSize: '0.75rem', color: '#f43f5e', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>CRITICAL RISK FINDINGS</span>
              {piiSeverityFilter === 'CRITICAL' && <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>FILTER ACTIVE</span>}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f43f5e', marginTop: '2px' }}>{piiReport.criticalCount}</div>
          </div>

          <div 
            onClick={() => setPiiSeverityFilter(prev => prev === 'HIGH' ? 'ALL' : 'HIGH')}
            className="card" 
            style={{ 
              padding: '12px 16px', 
              background: piiSeverityFilter === 'HIGH' ? 'rgba(245, 158, 11, 0.22)' : 'rgba(245, 158, 11, 0.1)', 
              border: piiSeverityFilter === 'HIGH' ? '2px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Click to filter High findings"
          >
            <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>HIGH RISK FINDINGS</span>
              {piiSeverityFilter === 'HIGH' && <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>FILTER ACTIVE</span>}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>{piiReport.highCount}</div>
          </div>

          <div 
            onClick={() => setPiiSeverityFilter(prev => prev === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
            className="card" 
            style={{ 
              padding: '12px 16px', 
              background: piiSeverityFilter === 'MEDIUM' ? 'rgba(59, 130, 246, 0.22)' : 'rgba(59, 130, 246, 0.1)', 
              border: piiSeverityFilter === 'MEDIUM' ? '2px solid #3b82f6' : '1px solid rgba(59, 130, 246, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Click to filter Medium findings"
          >
            <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>MEDIUM RISK FINDINGS</span>
              {piiSeverityFilter === 'MEDIUM' && <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>FILTER ACTIVE</span>}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6', marginTop: '2px' }}>{piiReport.mediumCount}</div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', background: 'var(--bg-input)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          {/* Severity Pill Selector */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '4px' }}>Severity:</span>
            <button
              type="button"
              onClick={() => setPiiSeverityFilter('ALL')}
              className={`btn btn-sm ${piiSeverityFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '3px 9px', fontSize: '0.7rem' }}
            >
              All ({piiReport.findings.length})
            </button>
            <button
              type="button"
              onClick={() => setPiiSeverityFilter('CRITICAL')}
              className={`btn btn-sm ${piiSeverityFilter === 'CRITICAL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '3px 9px', fontSize: '0.7rem', color: piiSeverityFilter === 'CRITICAL' ? '#fff' : '#f43f5e' }}
            >
              Critical ({piiReport.criticalCount})
            </button>
            <button
              type="button"
              onClick={() => setPiiSeverityFilter('HIGH')}
              className={`btn btn-sm ${piiSeverityFilter === 'HIGH' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '3px 9px', fontSize: '0.7rem', color: piiSeverityFilter === 'HIGH' ? '#fff' : '#f59e0b' }}
            >
              High ({piiReport.highCount})
            </button>
            <button
              type="button"
              onClick={() => setPiiSeverityFilter('MEDIUM')}
              className={`btn btn-sm ${piiSeverityFilter === 'MEDIUM' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '3px 9px', fontSize: '0.7rem', color: piiSeverityFilter === 'MEDIUM' ? '#fff' : '#3b82f6' }}
            >
              Medium ({piiReport.mediumCount})
            </button>
          </div>

          {/* Category Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category:</span>
            <select
              value={piiCategoryFilter}
              onChange={(e) => setPiiCategoryFilter(e.target.value)}
              className="select"
              style={{ fontSize: '0.75rem', padding: '3px 8px', width: 'auto', minWidth: '150px' }}
            >
              <option value="ALL">All Categories</option>
              <option value="CREDENTIALS">Credentials & Tokens</option>
              <option value="CONTACT_PII">Contact & Addresses</option>
              <option value="GOVERNMENT_ID">Government IDs</option>
              <option value="FINANCIAL">Financial & Banking</option>
              <option value="BIOMETRIC">Biometrics</option>
              <option value="MEDICAL">Medical & Health</option>
              <option value="GEOLOCATION">Geolocation & GPS</option>
              <option value="DEMOGRAPHICS">Demographics</option>
            </select>
          </div>

          {/* Instant Search Input */}
          <div style={{ flex: 1, minWidth: '180px', position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search table or field name (e.g. User, email, token)..."
              value={piiSearchQuery}
              onChange={(e) => setPiiSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: '30px', fontSize: '0.75rem', padding: '4px 8px 4px 30px' }}
            />
          </div>

          {(piiSeverityFilter !== 'ALL' || piiCategoryFilter !== 'ALL' || piiSearchQuery) && (
            <button
              type="button"
              onClick={() => {
                setPiiSeverityFilter('ALL');
                setPiiCategoryFilter('ALL');
                setPiiSearchQuery('');
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.7rem', padding: '3px 8px' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Filtered Findings List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>Identified Vulnerable Fields ({filteredFindings.length} of {piiReport.findings.length})</span>
          </div>
        </div>

        {filteredFindings.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No PII findings match your active filter criteria.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredFindings.map(f => (
              <div key={f.id} style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${f.severity === 'CRITICAL' ? 'badge-rose' : f.severity === 'HIGH' ? 'badge-amber' : 'badge-cyan'}`}>
                      {f.severity}
                    </span>
                    <strong style={{ fontSize: '0.9rem' }}>{f.table}.{f.field}</strong>
                    <span className="badge badge-indigo">{f.category}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({f.type})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(`${f.table}.${f.field}`, 'Field name')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.675rem', padding: '2px 6px' }}
                    title="Copy field reference"
                  >
                    <Copy size={10} />
                  </button>
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>{f.description}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 10px', borderRadius: '4px' }}>
                  💡 <strong>Bubble Privacy Rule Fix:</strong> {f.recommendation}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
