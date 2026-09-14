import React, { useState, useMemo } from 'react';
import {
  GitCompare,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  Download,
  Copy,
  Upload,
  Layers,
  Search,
  Filter,
  FileCode,
  Database,
  Workflow,
  Package,
  Check
} from 'lucide-react';
import { ProjectProfile } from '../types';
import {
  BlueprintDiffEngine,
  BlueprintDiffReport,
  BlueprintDiffItem,
  DiffChangeType
} from '../core/blueprint-diff/blueprintDiffEngine';
import { toast } from '../core/toast/toastManager';

interface BlueprintDiffViewerProps {
  activeProject?: ProjectProfile;
  projects?: ProjectProfile[];
}

export const BlueprintDiffViewer: React.FC<BlueprintDiffViewerProps> = ({
  activeProject,
  projects = []
}) => {
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [customTargetJson, setCustomTargetJson] = useState<any>(null);
  const [customTargetFileName, setCustomTargetFileName] = useState<string>('');
  const [report, setReport] = useState<BlueprintDiffReport | null>(null);
  const [filterType, setFilterType] = useState<'all' | DiffChangeType>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // File upload for custom target
  const handleUploadTarget = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        setCustomTargetJson(parsed);
        setCustomTargetFileName(file.name);
        setTargetProjectId('__custom__');
        toast.success(`Loaded .bubble target file: ${file.name}`);
      } catch (err: any) {
        toast.error(`Invalid blueprint JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleRunDiff = () => {
    const baseJson = activeProject?.blueprintExportJson;
    if (!baseJson) {
      toast.error('Active workspace does not have a .bubble blueprint attached.');
      return;
    }

    let compareJson: any = null;
    if (targetProjectId === '__custom__') {
      compareJson = customTargetJson;
    } else {
      const targetProj = projects.find(p => p.id === targetProjectId);
      compareJson = targetProj?.blueprintExportJson;
    }

    if (!compareJson) {
      toast.error('Please select a target workspace or upload a comparison .bubble file.');
      return;
    }

    const diffReport = BlueprintDiffEngine.compareBlueprints(baseJson, compareJson);
    setReport(diffReport);
    toast.success(`Diff completed: ${diffReport.summary.totalChanges} difference(s) detected.`);
  };

  const filteredItems = useMemo(() => {
    if (!report) return [];
    return report.items.filter((item) => {
      if (filterType !== 'all' && item.changeType !== filterType) return false;
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(query) ||
          (item.location && item.location.toLowerCase().includes(query)) ||
          (item.details && item.details.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [report, filterType, filterCategory, searchQuery]);

  const handleExportMarkdown = () => {
    if (!report) return;
    const md = BlueprintDiffEngine.generateMarkdownReport(report);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint_diff_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported Blueprint Diff report (Markdown)');
  };

  const handleCopyMarkdown = () => {
    if (!report) return;
    const md = BlueprintDiffEngine.generateMarkdownReport(report);
    navigator.clipboard.writeText(md);
    setCopied(true);
    toast.success('Diff report copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (category: BlueprintDiffItem['category']) => {
    switch (category) {
      case 'page':
        return <Layers size={14} color="var(--accent-cyan)" />;
      case 'workflow':
        return <Workflow size={14} color="var(--accent-emerald)" />;
      case 'database':
        return <Database size={14} color="var(--primary)" />;
      case 'plugin':
        return <Package size={14} color="#ec4899" />;
      case 'option_set':
        return <FileCode size={14} color="var(--accent-amber)" />;
      default:
        return <GitCompare size={14} color="var(--text-secondary)" />;
    }
  };

  const getChangeBadge = (type: DiffChangeType) => {
    switch (type) {
      case 'added':
        return (
          <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <PlusCircle size={11} />
            <span>ADDED</span>
          </span>
        );
      case 'removed':
        return (
          <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <MinusCircle size={11} />
            <span>REMOVED</span>
          </span>
        );
      case 'modified':
        return (
          <span className="badge badge-indigo" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={11} />
            <span>MODIFIED</span>
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Configuration Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              <GitCompare size={20} color="var(--primary)" />
              <span>Blueprint Structural Diff Engine</span>
            </div>
            <div className="card-subtitle">
              Compare two versions of a Bubble app to inspect modified pages, workflows, database fields, and plugins
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          {/* Baseline Info */}
          <div>
            <label className="input-label">Baseline Workspace (Source A)</label>
            <div
              style={{
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                fontWeight: 600
              }}
            >
              {activeProject ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{activeProject.name}</span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{activeProject.environment}</span>
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No active workspace connected</span>
              )}
            </div>
          </div>

          {/* Target Comparison Selector */}
          <div>
            <label className="input-label">Comparison Target (Source B)</label>
            <select
              value={targetProjectId}
              onChange={(e) => setTargetProjectId(e.target.value)}
              className="select select-premium"
            >
              <option value="">-- Choose Workspace or Upload File --</option>
              {projects
                .filter(p => p.id !== activeProject?.id)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.environment})
                  </option>
                ))}
              {customTargetFileName && (
                <option value="__custom__">📁 File: {customTargetFileName}</option>
              )}
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <Upload size={14} />
              <span>Upload .bubble</span>
              <input
                type="file"
                accept=".json,.bubble"
                onChange={handleUploadTarget}
                style={{ display: 'none' }}
              />
            </label>

            <button
              onClick={handleRunDiff}
              className="btn btn-primary"
              style={{ whiteSpace: 'nowrap' }}
              disabled={!activeProject?.blueprintExportJson}
            >
              <GitCompare size={14} />
              <span>Compare Blueprints</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {report && (
        <>
          {/* Summary Metrics */}
          <div className="grid-4">
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL DIFFERENCES</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                {report.summary.totalChanges}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Across all structural nodes</div>
            </div>

            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>NEWLY ADDED</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                +{report.summary.addedCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pages, fields & workflows</div>
            </div>

            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DELETED / REMOVED</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>
                -{report.summary.removedCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Removed from baseline</div>
            </div>

            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MODIFIED</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                ~{report.summary.modifiedCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Changed actions & types</div>
            </div>
          </div>

          {/* Filter Bar & Action Header */}
          <div className="card" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative', width: '220px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Filter diff items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input"
                    style={{ paddingLeft: '32px', height: '34px', fontSize: '0.8rem' }}
                  />
                </div>

                {/* Change Type Filter */}
                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                  {(['all', 'added', 'removed', 'modified'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`btn btn-sm ${filterType === t ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ padding: '3px 10px', fontSize: '0.75rem', textTransform: 'capitalize' }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Category Filter */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="page">Pages</option>
                  <option value="workflow">Workflows</option>
                  <option value="database">Database</option>
                  <option value="option_set">Option Sets</option>
                  <option value="plugin">Plugins</option>
                </select>
              </div>

              {/* Export Buttons */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleCopyMarkdown}
                  className="btn btn-secondary btn-sm"
                  title="Copy Markdown report"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Report'}</span>
                </button>
                <button
                  onClick={handleExportMarkdown}
                  className="btn btn-secondary btn-sm"
                  title="Download Markdown report"
                >
                  <Download size={14} />
                  <span>Download .md</span>
                </button>
              </div>
            </div>
          </div>

          {/* Diff Items List */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {filteredItems.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No differences found matching your current filter.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: idx < filteredItems.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      background: item.changeType === 'added' ? 'rgba(16, 185, 129, 0.03)' : item.changeType === 'removed' ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'var(--bg-input)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {getCategoryIcon(item.category)}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {item.name}
                          </span>
                          {item.location && (
                            <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                              {item.location}
                            </span>
                          )}
                        </div>
                        {item.details && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {item.details}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      {getChangeBadge(item.changeType)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
