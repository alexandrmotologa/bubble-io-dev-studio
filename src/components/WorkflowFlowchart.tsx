import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowDown, 
  Database, 
  Mail, 
  Globe, 
  Navigation, 
  Zap, 
  Copy, 
  Check, 
  Sliders, 
  Layers,
  Sparkles
} from 'lucide-react';
import { WorkflowGraphData, WorkflowNode } from '../types';
import { WorkflowGraphEngine } from '../core/workflows/workflowGraphEngine';
import { toast } from '../core/toast/toastManager';

interface WorkflowFlowchartProps {
  blueprintExportJson?: any;
  onLog: (module: 'devops', message: string, level?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const WorkflowFlowchart: React.FC<WorkflowFlowchartProps> = ({
  blueprintExportJson,
  onLog
}) => {
  const [workflowsList, setWorkflowsList] = useState<any[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [activeGraph, setActiveGraph] = useState<WorkflowGraphData | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'mermaid'>('visual');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const list = WorkflowGraphEngine.extractAllWorkflows(blueprintExportJson);
    setWorkflowsList(list);
    if (list.length > 0) {
      setSelectedWorkflowId(list[0].id);
      loadGraph(list[0]);
    }
  }, [blueprintExportJson]);

  const loadGraph = (wfItem: any) => {
    const graph = WorkflowGraphEngine.buildWorkflowGraph(wfItem);
    setActiveGraph(graph);
  };

  const handleSelectWorkflow = (wfId: string) => {
    setSelectedWorkflowId(wfId);
    const target = workflowsList.find(w => w.id === wfId);
    if (target) {
      loadGraph(target);
      onLog('devops', `Visualized workflow logic for '${target.name}' (${target.page})`);
    }
  };

  const handleCopyMermaid = () => {
    if (!activeGraph) return;
    const mm = WorkflowGraphEngine.generateMermaidFlowchart(activeGraph);
    navigator.clipboard.writeText(mm);
    setCopied(true);
    toast.success('Mermaid flowchart code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
    onLog('devops', 'Copied Mermaid flowchart diagram to clipboard.', 'success');
  };

  if (workflowsList.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        <GitBranch size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No workflows detected in project blueprint</div>
        <p style={{ fontSize: '0.8rem', margin: '6px 0 0' }}>Attach a .bubble blueprint file to inspect visual workflow action trees.</p>
      </div>
    );
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger': return <Zap size={14} color="#6366f1" />;
      case 'db_write': return <Database size={14} color="#10b981" />;
      case 'email': return <Mail size={14} color="#f59e0b" />;
      case 'api_call': return <Globe size={14} color="#06b6d4" />;
      case 'navigation': return <Navigation size={14} color="#8b5cf6" />;
      default: return <Sliders size={14} color="var(--text-secondary)" />;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'rgba(99, 102, 241, 0.12)';
      case 'db_write': return 'rgba(16, 185, 129, 0.12)';
      case 'email': return 'rgba(245, 158, 11, 0.12)';
      case 'api_call': return 'rgba(6, 182, 212, 0.12)';
      case 'navigation': return 'rgba(139, 92, 246, 0.12)';
      default: return 'var(--bg-input)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header Selector Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={16} color="var(--primary)" />
          <select
            value={selectedWorkflowId}
            onChange={(e) => handleSelectWorkflow(e.target.value)}
            className="select"
            style={{ fontWeight: 700, padding: '6px 12px', minWidth: '240px' }}
          >
            {workflowsList.map(wf => (
              <option key={wf.id} value={wf.id}>
                [{wf.page}] {wf.name} ({wf.actionsCount} actions)
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-md)' }}>
            <button
              onClick={() => setViewMode('visual')}
              className={`btn btn-sm ${viewMode === 'visual' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Interactive Tree
            </button>
            <button
              onClick={() => setViewMode('mermaid')}
              className={`btn btn-sm ${viewMode === 'mermaid' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Mermaid Syntax
            </button>
          </div>

          <button onClick={handleCopyMermaid} className="btn btn-secondary btn-sm">
            {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy Diagram'}</span>
          </button>
        </div>
      </div>

      {activeGraph && (
        <div className="responsive-split" style={{ gridTemplateColumns: '1.4fr 0.6fr', alignItems: 'start' }}>
          {/* Main Visual Flowchart / Nodes */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <Play size={16} color="var(--primary)" />
                  <span>{activeGraph.workflowName}</span>
                </div>
                <div className="card-subtitle">
                  Location: <strong>{activeGraph.pageName}</strong> • {activeGraph.nodes.length - 1} Sequential Actions
                </div>
              </div>
            </div>

            {viewMode === 'visual' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px 0' }}>
                {activeGraph.nodes.map((node, idx) => {
                  const isRoot = idx === 0;

                  return (
                    <React.Fragment key={node.id}>
                      {idx > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--primary)', opacity: 0.7 }}>
                          <div style={{ width: '2px', height: '14px', background: 'var(--border-active)' }} />
                          <ArrowDown size={14} />
                        </div>
                      )}

                      <div style={{
                        width: '100%',
                        maxWidth: '480px',
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-md)',
                        background: getNodeColor(node.type),
                        border: `1px solid ${isRoot ? 'var(--primary)' : 'var(--border-subtle)'}`,
                        boxShadow: isRoot ? '0 4px 16px rgba(99, 102, 241, 0.2)' : 'none',
                        position: 'relative'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {getNodeIcon(node.type)}
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              {node.label}
                            </span>
                          </div>

                          {node.isBlockingClient && (
                            <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                              Client Blocking
                            </span>
                          )}
                        </div>

                        {node.sublabel && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', paddingLeft: '22px' }}>
                            {node.sublabel}
                          </div>
                        )}

                        {node.condition && (
                          <div style={{
                            marginTop: '8px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            fontSize: '0.7rem',
                            color: 'var(--accent-amber)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <AlertTriangle size={11} />
                            <span><strong>Only when:</strong> {node.condition}</span>
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <pre style={{
                background: 'var(--bg-input)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                overflowX: 'auto',
                lineHeight: 1.5
              }}>
                {WorkflowGraphEngine.generateMermaidFlowchart(activeGraph)}
              </pre>
            )}
          </div>

          {/* Sidebar: Performance & Optimization Advisor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="card">
              <div className="card-title" style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
                <Sparkles size={16} color="var(--accent-emerald)" />
                <span>Workflow Performance Check</span>
              </div>

              {activeGraph.optimizationAdvice.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeGraph.optimizationAdvice.map((adv, aIdx) => (
                    <div key={aIdx} style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      fontSize: '0.75rem',
                      color: 'var(--text-primary)',
                      lineHeight: 1.4,
                      display: 'flex',
                      gap: '6px'
                    }}>
                      <AlertTriangle size={14} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>{adv}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--accent-emerald)', fontSize: '0.8rem' }}>
                  <CheckCircle2 size={24} style={{ margin: '0 auto 6px' }} />
                  <div>Optimized Action Chain</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    No blocking sequential delays detected.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
