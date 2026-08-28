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
  Sparkles,
  Info,
  Cpu,
  Clock,
  Code,
  FileJson,
  ChevronRight,
  ShieldCheck
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
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'mermaid'>('visual');
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [pageFilter, setPageFilter] = useState<string>('ALL');

  useEffect(() => {
    const list = WorkflowGraphEngine.extractAllWorkflows(blueprintExportJson);
    setWorkflowsList(list);
    if (list.length > 0) {
      setSelectedWorkflowId(list[0].id);
      loadGraph(list[0]);
    }
  }, [blueprintExportJson]);

  const distinctPages = React.useMemo(() => {
    const pages = new Set<string>();
    for (const wf of workflowsList) {
      if (wf.page) pages.add(wf.page);
    }
    return Array.from(pages).sort();
  }, [workflowsList]);

  const filteredWorkflows = React.useMemo(() => {
    if (pageFilter === 'ALL') return workflowsList;
    return workflowsList.filter(wf => wf.page === pageFilter);
  }, [workflowsList, pageFilter]);

  // Compute estimated WU cost
  const estimatedWu = React.useMemo(() => {
    if (!activeGraph) return { min: 0.05, max: 0.1, dbWrites: 0, apiCalls: 0, emails: 0 };
    let dbWrites = 0;
    let apiCalls = 0;
    let emails = 0;
    for (const node of activeGraph.nodes) {
      if (node.type === 'db_write') dbWrites++;
      if (node.type === 'api_call') apiCalls++;
      if (node.type === 'email') emails++;
    }
    const min = 0.05 + (dbWrites * 0.15) + (apiCalls * 0.2) + (emails * 0.25);
    const max = 0.10 + (dbWrites * 0.35) + (apiCalls * 0.45) + (emails * 0.5);
    return { min: Number(min.toFixed(2)), max: Number(max.toFixed(2)), dbWrites, apiCalls, emails };
  }, [activeGraph]);

  const loadGraph = (wfItem: any) => {
    const graph = WorkflowGraphEngine.buildWorkflowGraph(wfItem);
    setActiveGraph(graph);
    // Select first action node by default if available, else root
    if (graph.nodes.length > 1) {
      setSelectedNode(graph.nodes[1]);
    } else if (graph.nodes.length > 0) {
      setSelectedNode(graph.nodes[0]);
    } else {
      setSelectedNode(null);
    }
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

  const handleCopyNodeJson = (node: WorkflowNode) => {
    navigator.clipboard.writeText(JSON.stringify(node.details || node, null, 2));
    toast.success(`Copied ${node.label} details to clipboard!`);
    onLog('devops', `Copied node AST properties to clipboard.`);
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
      case 'trigger': return <Zap size={15} color="#6366f1" />;
      case 'db_write': return <Database size={15} color="#10b981" />;
      case 'email': return <Mail size={15} color="#f59e0b" />;
      case 'api_call': return <Globe size={15} color="#06b6d4" />;
      case 'navigation': return <Navigation size={15} color="#8b5cf6" />;
      default: return <Sliders size={15} color="var(--text-secondary)" />;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Page Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Page:</span>
            <select
              value={pageFilter}
              onChange={(e) => {
                const newPage = e.target.value;
                setPageFilter(newPage);
                const nextList = newPage === 'ALL' ? workflowsList : workflowsList.filter(w => w.page === newPage);
                if (nextList.length > 0) {
                  handleSelectWorkflow(nextList[0].id);
                }
              }}
              className="select"
              style={{ fontSize: '0.75rem', padding: '4px 8px', width: 'auto', minWidth: '130px' }}
            >
              <option value="ALL">All Pages ({workflowsList.length})</option>
              {distinctPages.map(p => (
                <option key={p} value={p}>
                  {p} ({workflowsList.filter(w => w.page === p).length})
                </option>
              ))}
            </select>
          </div>

          <GitBranch size={16} color="var(--primary)" />
          <select
            value={selectedWorkflowId}
            onChange={(e) => handleSelectWorkflow(e.target.value)}
            className="select"
            style={{ fontWeight: 700, padding: '5px 12px', minWidth: '260px' }}
          >
            {filteredWorkflows.map(wf => (
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
        <div className="responsive-split" style={{ gridTemplateColumns: '1.25fr 0.75fr', alignItems: 'start', gap: '16px' }}>
          {/* Main Visual Flowchart / Nodes */}
          <div className="card" style={{ padding: '18px' }}>
            <div className="card-header" style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div className="card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Play size={16} color="var(--primary)" />
                  <span>{activeGraph.workflowName}</span>
                </div>
                <div className="card-subtitle" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  Location: <strong>{activeGraph.pageName}</strong> • {activeGraph.nodes.length - 1} Sequential Action Steps
                  <span style={{ color: 'var(--accent-cyan)', marginLeft: '8px' }}>(Click any step to inspect)</span>
                </div>
              </div>

              {/* Workload Units (WU) Estimator Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)'
              }}>
                <Zap size={14} color="var(--accent-amber)" />
                <div style={{ fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated WU: </span>
                  <strong style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                    ~{estimatedWu.min} - {estimatedWu.max} WU
                  </strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.675rem', marginLeft: '4px' }}>/ run</span>
                </div>
              </div>
            </div>

            {viewMode === 'visual' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
                {activeGraph.nodes.map((node, idx) => {
                  const isRoot = idx === 0;
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <React.Fragment key={node.id}>
                      {idx > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--primary)', opacity: 0.7, margin: '-2px 0' }}>
                          <div style={{ width: '2px', height: '14px', background: 'var(--border-active)' }} />
                          <ArrowDown size={14} />
                        </div>
                      )}

                      <div 
                        onClick={() => setSelectedNode(node)}
                        style={{
                          width: '100%',
                          maxWidth: '520px',
                          padding: '14px 16px',
                          borderRadius: 'var(--radius-md)',
                          background: getNodeColor(node.type),
                          border: isSelected 
                            ? '2px solid var(--primary)' 
                            : isRoot 
                              ? '1px solid var(--primary)' 
                              : '1px solid var(--border-subtle)',
                          boxShadow: isSelected 
                            ? '0 0 0 3px rgba(99, 102, 241, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)' 
                            : isRoot 
                              ? '0 4px 14px rgba(99, 102, 241, 0.15)' 
                              : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <div style={{ flexShrink: 0 }}>
                              {getNodeIcon(node.type)}
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {node.label}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {node.isBlockingClient && (
                              <span className="badge badge-amber" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                                Client Blocking
                              </span>
                            )}
                            <span className="badge badge-indigo" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                              {node.categoryName?.split(' ')[0] || 'Step'}
                            </span>
                          </div>
                        </div>

                        {node.sublabel && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', paddingLeft: '23px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{node.sublabel}</span>
                          </div>
                        )}

                        {node.condition && (
                          <div style={{
                            marginTop: '8px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'rgba(245, 158, 11, 0.12)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            fontSize: '0.7rem',
                            color: 'var(--accent-amber)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
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

          {/* Sidebar: Rich Node Inspector & Performance Advice */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Selected Node Details Inspector */}
            {selectedNode ? (
              <div className="card" style={{ border: '1px solid var(--border-active)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getNodeIcon(selectedNode.type)}
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Action Inspector
                    </span>
                  </div>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                    {selectedNode.executionLocation || 'Client'}
                  </span>
                </div>

                {/* Node Title & Category */}
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedNode.label}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span className="badge badge-indigo" style={{ fontSize: '0.68rem' }}>
                      {selectedNode.categoryName || 'Workflow Step'}
                    </span>
                    {selectedNode.rawType && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        AST: <code>{selectedNode.rawType}</code>
                      </span>
                    )}
                  </div>
                </div>

                {/* Plain-English Explanation */}
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    <Info size={13} color="var(--primary)" />
                    <span>What this step does:</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {selectedNode.explanation || 'Executes this configured action in the workflow.'}
                  </p>
                </div>

                {/* Performance & Latency Profile */}
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedNode.isBlockingClient ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  border: selectedNode.isBlockingClient ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: selectedNode.isBlockingClient ? 'var(--accent-amber)' : 'var(--accent-emerald)', marginBottom: '4px' }}>
                    <Clock size={13} />
                    <span>Performance & Latency:</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {selectedNode.performanceImpact || 'Instantaneous execution.'}
                  </div>
                </div>

                {/* Execution Condition If Present */}
                {selectedNode.condition && (
                  <div style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontSize: '0.725rem',
                    color: 'var(--accent-amber)',
                    marginBottom: '12px'
                  }}>
                    <strong>Execution Rule (Only When):</strong>
                    <div style={{ marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      <code>{selectedNode.condition}</code>
                    </div>
                  </div>
                )}

                {/* Raw AST Properties Toggle */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => setShowRawJson(!showRawJson)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Code size={11} />
                      <span>{showRawJson ? 'Hide Raw AST' : 'View Raw Properties'}</span>
                    </button>

                    <button
                      onClick={() => handleCopyNodeJson(selectedNode)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Copy Action JSON to clipboard"
                    >
                      <Copy size={11} />
                      <span>Copy AST</span>
                    </button>
                  </div>

                  {showRawJson && (
                    <pre style={{
                      marginTop: '8px',
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {JSON.stringify(selectedNode.details || selectedNode, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Click any workflow step in the flowchart to inspect action details and explanations.
              </div>
            )}

            {/* Workflow Performance Check & Best Practices */}
            <div className="card" style={{ padding: '16px' }}>
              <div className="card-title" style={{ fontSize: '0.9rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  <div style={{ fontWeight: 600 }}>Optimized Action Chain</div>
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
