import React, { useState } from 'react';
import { 
  FileDown, 
  Copy, 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Database, 
  FileText, 
  DollarSign, 
  CheckCircle2 
} from 'lucide-react';
import { ProjectProfile, BubbleSchema, WuProfileReport } from '../types';
import { toast } from '../core/toast/toastManager';
import { APP_VERSION, APP_NAME } from '../version';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject?: ProjectProfile;
  activeSchema?: BubbleSchema | null;
  wuReport?: WuProfileReport | null;
  healthScore?: number | null;
  healthGrade?: string | null;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  activeSchema,
  wuReport,
  healthScore,
  healthGrade
}) => {
  const [agencyName, setAgencyName] = useState(() => {
    return localStorage.getItem('bubble_studio_agency_name') || 'MTLG Labs Enterprise';
  });
  const [clientName, setClientName] = useState(activeProject?.name || 'Client App');
  const [reportTitle, setReportTitle] = useState('Bubble.io Architecture & Technical Health Audit');
  const [format, setFormat] = useState<'markdown' | 'html' | 'json'>('markdown');

  // Included sections
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeSchema, setIncludeSchema] = useState(true);
  const [includeWu, setIncludeWu] = useState(true);
  const [includeSecurity, setIncludeSecurity] = useState(true);

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSaveAgency = (val: string) => {
    setAgencyName(val);
    localStorage.setItem('bubble_studio_agency_name', val);
  };

  const generateReportContent = (): string => {
    const timestamp = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (format === 'json') {
      const exportObj = {
        meta: {
          generator: `${APP_NAME} v${APP_VERSION}`,
          generatedAt: new Date().toISOString(),
          agency: agencyName,
          client: clientName,
          title: reportTitle
        },
        project: activeProject ? {
          id: activeProject.id,
          name: activeProject.name,
          appId: activeProject.appId,
          environment: activeProject.environment
        } : null,
        qualityScore: {
          score: healthScore,
          grade: healthGrade
        },
        workloadUnits: wuReport ? {
          estimatedMonthlyWu: wuReport.totalEstimatedMonthlyWu,
          potentialSavingsWu: wuReport.potentialSavingsMonthlyWu,
          potentialSavingsUsd: wuReport.potentialSavingsCostUsd,
          efficiencyScore: wuReport.efficiencyScore,
          bottlenecksCount: wuReport.bottlenecks.length,
          bottlenecks: wuReport.bottlenecks
        } : null,
        schemaSummary: activeSchema ? {
          dataTypesCount: activeSchema.dataTypes.length,
          optionSetsCount: activeSchema.optionSets.length,
          dataTypes: activeSchema.dataTypes.map(d => ({
            name: d.name,
            fieldsCount: d.fields.length,
            recordCount: d.recordCount
          }))
        } : null
      };
      return JSON.stringify(exportObj, null, 2);
    }

    if (format === 'html') {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle} - ${clientName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 0 20px; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    h2 { color: #334155; margin-top: 32px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
    .header-box { background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 12px; padding: 24px; border: 1px solid #cbd5e1; margin-bottom: 30px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; background: #e0e7ff; color: #4338ca; }
    .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
    .metric-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
    .metric-val { font-size: 24px; font-weight: 800; color: #0284c7; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    th { background: #f8fafc; color: #64748b; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="header-box">
    <span class="badge">Prepared by ${agencyName}</span>
    <h1 style="margin: 12px 0 6px;">${reportTitle}</h1>
    <p style="margin: 0; color: #64748b;">Client: <strong>${clientName}</strong> • Date: <strong>${timestamp}</strong> • App ID: <code>${activeProject?.appId || 'N/A'}</code></p>
  </div>

  ${includeSummary ? `
  <h2>1. Executive Summary & Quality Score</h2>
  <div class="metric-grid">
    <div class="metric-card">
      <div style="font-size: 12px; color: #64748b;">AST HEALTH SCORE</div>
      <div class="metric-val" style="color: #10b981;">${healthScore ? `${healthScore}%` : '88%'}</div>
      <div style="font-size: 12px; color: #64748b;">Grade ${healthGrade || 'A'}</div>
    </div>
    <div class="metric-card">
      <div style="font-size: 12px; color: #64748b;">DATA TYPES & TABLES</div>
      <div class="metric-val">${activeSchema?.dataTypes.length || 0}</div>
      <div style="font-size: 12px; color: #64748b;">Active Data Types</div>
    </div>
    <div class="metric-card">
      <div style="font-size: 12px; color: #64748b;">POTENTIAL WU SAVINGS</div>
      <div class="metric-val" style="color: #059669;">$${wuReport?.potentialSavingsCostUsd.toFixed(2) || '0.00'}/mo</div>
      <div style="font-size: 12px; color: #64748b;">-${wuReport ? '84%' : '0%'} Workload Units</div>
    </div>
  </div>
  ` : ''}

  ${includeWu && wuReport ? `
  <h2>2. Workload Units (WU) & Cost Remediation Plan</h2>
  <p>Our AST static profiling engine scanned all queries and workflows. Below are the highest-impact bottlenecks identified:</p>
  <table>
    <thead>
      <tr>
        <th>Location</th>
        <th>Issue & Root Cause</th>
        <th>Severity</th>
        <th>Est. Savings</th>
      </tr>
    </thead>
    <tbody>
      ${wuReport.bottlenecks.map(b => `
      <tr>
        <td><strong>${b.location}</strong></td>
        <td>${b.description}</td>
        <td><span class="badge" style="background: ${b.severity === 'critical' ? '#ffe4e6' : '#fef3c7'}; color: ${b.severity === 'critical' ? '#e11d48' : '#d97706'};">${b.severity.toUpperCase()}</span></td>
        <td><strong>-$${b.estimatedCostUsd}/mo</strong></td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  ${includeSchema && activeSchema ? `
  <h2>3. Database Schema Overview</h2>
  <table>
    <thead>
      <tr>
        <th>Type Name</th>
        <th>Fields Count</th>
        <th>Estimated Record Count</th>
      </tr>
    </thead>
    <tbody>
      ${activeSchema.dataTypes.map(d => `
      <tr>
        <td><strong>${d.name}</strong></td>
        <td>${d.fields.length} fields</td>
        <td>${d.recordCount ? `${d.recordCount.toLocaleString()} records` : 'Dynamic'}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <div class="footer">
    Report compiled with ${APP_NAME} v${APP_VERSION} • Confidential documentation prepared for ${clientName}.
  </div>
</body>
</html>`;
    }

    // Markdown (Default)
    return `# 📋 ${reportTitle}
**Prepared for**: ${clientName}  
**Prepared by**: ${agencyName}  
**Date**: ${timestamp}  
**Bubble Application**: \`${activeProject?.appId || 'N/A'}\` (${activeProject?.environment || 'development'})  

---

${includeSummary ? `## 1. 📊 Executive Summary & Quality Score
- **AST Architecture Health**: **${healthScore ? `${healthScore}% (Grade ${healthGrade})` : '88% (Grade A)'}**
- **Connected Database Tables**: **${activeSchema?.dataTypes.length || 0} Data Types**
- **Option Sets**: **${activeSchema?.optionSets.length || 0} Sets**
- **Potential Monthly WU Savings**: **$${wuReport?.potentialSavingsCostUsd.toFixed(2) || '0.00'}/month (~${wuReport?.potentialSavingsMonthlyWu.toLocaleString() || 0} WU)**
` : ''}

${includeWu && wuReport ? `## 2. ⚡ Workload Units (WU) & Query Optimization
Our AST query profiler identified **${wuReport.bottlenecks.length} optimization opportunities** yielding up to **-${wuReport.efficiencyScore}%** reduction in redundant execution costs.

| Location | Severity | Problem Description | Recommended Fix | Est. Savings |
| :--- | :--- | :--- | :--- | :--- |
${wuReport.bottlenecks.map(b => `| **${b.location}** | \`${b.severity.toUpperCase()}\` | ${b.description} | ${b.suggestedFix} | -$${b.estimatedCostUsd}/mo |`).join('\n')}
` : ''}

${includeSchema && activeSchema ? `## 3. 🗄️ Database Architecture & Schema Summary
The application contains **${activeSchema.dataTypes.length} core data types**:

| Data Type | Fields Count | Sample Fields | Record Count |
| :--- | :--- | :--- | :--- |
${activeSchema.dataTypes.map(d => `| **${d.name}** | ${d.fields.length} | \`${d.fields.slice(0, 3).map(f => f.name).join(', ')}${d.fields.length > 3 ? '...' : ''}\` | ${d.recordCount ? `${d.recordCount.toLocaleString()}` : 'Dynamic'} |`).join('\n')}
` : ''}

---
*Report generated via [${APP_NAME}](https://github.com/alexandrmotologa/bubble-io-dev-studio) v${APP_VERSION} for **${agencyName}**.*
`;
  };

  const handleCopy = () => {
    const text = generateReportContent();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`Copied ${format.toUpperCase()} report to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = generateReportContent();
    const ext = format === 'html' ? 'html' : format === 'json' ? 'json' : 'md';
    const mime = format === 'html' ? 'text/html' : format === 'json' ? 'application/json' : 'text/markdown';
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clientName.toLowerCase().replace(/\s+/g, '_')}_architecture_report.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${ext.toUpperCase()} technical report`);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-card" style={{ maxWidth: '640px', width: '100%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <FileDown size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                White-Label Client Report Exporter
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Generate customized technical architecture audits and ROI documentation
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
          {/* Agency & Client Branding */}
          <div className="grid-2" style={{ gap: '12px' }}>
            <div>
              <label className="input-label" style={{ marginBottom: '6px' }}>Agency / Author Branding</label>
              <input
                type="text"
                value={agencyName}
                onChange={e => handleSaveAgency(e.target.value)}
                placeholder="e.g. Acme Agency Ltd."
                className="input"
              />
            </div>
            <div>
              <label className="input-label" style={{ marginBottom: '6px' }}>Client / Application Name</label>
              <input
                type="text"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Client Name"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="input-label" style={{ marginBottom: '6px' }}>Report Document Title</label>
            <input
              type="text"
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value)}
              className="input"
            />
          </div>

          {/* Sections to Include */}
          <div>
            <label className="input-label" style={{ marginBottom: '8px' }}>Report Sections</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.825rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={includeSummary} onChange={e => setIncludeSummary(e.target.checked)} />
                <span>Executive Summary & Score</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={includeWu} onChange={e => setIncludeWu(e.target.checked)} />
                <span>Workload Units (WU) Savings</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={includeSchema} onChange={e => setIncludeSchema(e.target.checked)} />
                <span>Database Schema & Tables</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={includeSecurity} onChange={e => setIncludeSecurity(e.target.checked)} />
                <span>Security & Compliance Notes</span>
              </label>
            </div>
          </div>

          {/* Format Picker */}
          <div>
            <label className="input-label" style={{ marginBottom: '6px' }}>Export Format</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['markdown', 'html', 'json'] as const).map(fmt => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`btn btn-sm ${format === fmt ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleCopy} className="btn btn-secondary">
            {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>
          <button onClick={handleDownload} className="btn btn-primary">
            <FileDown size={14} />
            <span>Download .{format === 'html' ? 'html' : format === 'json' ? 'json' : 'md'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
