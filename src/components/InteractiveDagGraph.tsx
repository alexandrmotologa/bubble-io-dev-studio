import React, { useState } from 'react';
import {
  GitBranch,
  Search,
  Filter,
  Layers,
  Zap,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Box,
  Eye,
  Trash2,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  ChevronDown,
  X
} from 'lucide-react';
import { DagNode } from '../types';

interface InteractiveDagGraphProps {
  nodes?: DagNode[];
  onPruneNode?: (nodeId: string) => void;
}

const DEFAULT_NODES: DagNode[] = [
  // Pages
  { id: 'page-index', name: 'index (Home)', type: 'page', category: 'page', isDead: false, status: 'active', callCount: 14, incomingEdges: 1, outgoingEdges: 3, callsTo: ['reusable-header', 'wf-login', 'wf-signup'] },
  { id: 'page-dashboard', name: 'dashboard', type: 'page', category: 'page', isDead: false, status: 'active', callCount: 28, incomingEdges: 1, outgoingEdges: 2, callsTo: ['reusable-header', 'wf-load-feed'] },
  { id: 'page-checkout', name: 'checkout_v2', type: 'page', category: 'page', isDead: false, status: 'active', callCount: 9, incomingEdges: 1, outgoingEdges: 1, callsTo: ['wf-stripe-charge'] },
  { id: 'page-old-checkout', name: 'checkout_old_backup', type: 'page', category: 'page', isDead: true, status: 'dead', callCount: 0, incomingEdges: 0, outgoingEdges: 0, orphanReason: 'Unreferenced backup page with no incoming navigation links.' },
  { id: 'page-admin-test', name: 'test_admin_sandbox', type: 'page', category: 'page', isDead: true, status: 'dead', callCount: 0, incomingEdges: 0, outgoingEdges: 0, orphanReason: 'Development sandbox not linked in production menus.' },

  // Reusable Elements
  { id: 'reusable-header', name: 'Header_Navigation', type: 'reusable', category: 'element', isDead: false, status: 'active', callCount: 42, incomingEdges: 2, outgoingEdges: 1, referencedBy: ['page-index', 'page-dashboard'], callsTo: ['wf-logout'] },
  { id: 'reusable-modal-old', name: 'Legacy_Popup_Modal', type: 'reusable', category: 'element', isDead: true, status: 'dead', callCount: 0, incomingEdges: 0, outgoingEdges: 0, orphanReason: 'Reusable element never placed on any page or popup.' },

  // Workflows & Events
  { id: 'wf-login', name: 'Workflow: User Logs In', type: 'custom_event', category: 'workflow', isDead: false, status: 'active', callCount: 18, incomingEdges: 1, outgoingEdges: 2, referencedBy: ['page-index'] },
  { id: 'wf-signup', name: 'Workflow: Sign Up With Email', type: 'custom_event', category: 'workflow', isDead: false, status: 'active', callCount: 12, incomingEdges: 1, outgoingEdges: 2, referencedBy: ['page-index'] },
  { id: 'wf-stripe-charge', name: 'Backend: process_stripe_charge', type: 'backend_workflow', category: 'workflow', isDead: false, status: 'active', callCount: 34, incomingEdges: 1, outgoingEdges: 1, referencedBy: ['page-checkout'] },
  { id: 'wf-orphan-event', name: 'Custom Event: send_test_email_v1', type: 'custom_event', category: 'workflow', isDead: true, status: 'dead', callCount: 0, incomingEdges: 0, outgoingEdges: 0, orphanReason: 'Custom event never triggered by any button action or workflow.' },
  { id: 'wf-unused-backend', name: 'Backend: sync_legacy_hubspot', type: 'backend_workflow', category: 'workflow', isDead: true, status: 'dead', callCount: 0, incomingEdges: 0, outgoingEdges: 0, orphanReason: 'API endpoint enabled in Bubble settings but never invoked in 180 days.' }
];

export const InteractiveDagGraph: React.FC<InteractiveDagGraphProps> = ({
  nodes = DEFAULT_NODES,
  onPruneNode
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || 'page-index');
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredNodes = nodes.filter(n => {
    if (searchFilter && !n.name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (statusFilter !== 'all' && (n.status || (n.isDead ? 'dead' : 'active')) !== statusFilter) return false;
    return true;
  });

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'page': return <FileCode size={15} color="var(--primary)" />;
      case 'reusable': return <Box size={15} color="var(--accent-cyan)" />;
      case 'backend_workflow': return <Zap size={15} color="var(--accent-amber)" />;
      case 'custom_event': return <GitBranch size={15} color="var(--accent-emerald)" />;
      default: return <Layers size={15} color="var(--text-secondary)" />;
    }
  };

  const getStatusBadge = (status: 'active' | 'warning' | 'dead' | undefined, isDead?: boolean) => {
    const s = status || (isDead ? 'dead' : 'active');
    switch (s) {
      case 'active':
        return (
          <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
            Active in Journey
          </span>
        );
      case 'warning':
        return (
          <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
            Low Usage
          </span>
        );
      case 'dead':
        return (
          <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>
            Orphaned Dead Code
          </span>
        );
    }
  };

  const activeCount = nodes.filter(n => (n.status === 'active' || (!n.isDead && n.status !== 'warning'))).length;
  const deadCount = nodes.filter(n => (n.status === 'dead' || n.isDead)).length;

  return (
    <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GitBranch size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Interactive AST Dependency Graph (DAG)
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
              {activeCount} Active Nodes
            </span>
            <span className="badge badge-rose" style={{ fontSize: '0.72rem' }}>
              {deadCount} Dead Nodes
            </span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '180px', maxWidth: '240px' }}>
            <div className="search-wrapper-premium">
              <input
                type="text"
                placeholder="Search AST node..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="search-input-premium"
                style={{ padding: '6px 28px 6px 30px', fontSize: '0.78rem' }}
              />
              <Search size={13} className="search-icon-premium" style={{ left: '9px' }} />
              {searchFilter && (
                <button 
                  onClick={() => setSearchFilter('')}
                  className="search-clear-btn"
                  title="Clear search"
                  style={{ right: '6px' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="select-wrapper-premium">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="select-premium"
              style={{ fontSize: '0.78rem', padding: '5px 26px 5px 10px' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="dead">Dead Code Only</option>
            </select>
            <ChevronDown size={12} className="select-chevron-premium" style={{ right: '8px' }} />
          </div>

          <div className="select-wrapper-premium">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="select-premium"
              style={{ fontSize: '0.78rem', padding: '5px 26px 5px 10px' }}
            >
              <option value="all">All Types</option>
              <option value="page">Pages</option>
              <option value="reusable">Reusable Elements</option>
              <option value="custom_event">Custom Events</option>
              <option value="backend_workflow">Backend Workflows</option>
            </select>
            <ChevronDown size={12} className="select-chevron-premium" style={{ right: '8px' }} />
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout: Node Hierarchy & Node Inspector */}
      <div className="grid-2" style={{ gridTemplateColumns: '1.3fr 1fr', gap: '14px', minHeight: '380px' }}>
        {/* Left: Node Cards Grid */}
        <div style={{
          backgroundColor: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          padding: '12px',
          maxHeight: '440px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {filteredNodes.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No DAG nodes match your filter criteria.
            </div>
          ) : (
            filteredNodes.map(node => {
              const isSelected = node.id === selectedNode?.id;
              const isDead = node.status === 'dead' || node.isDead;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isSelected
                      ? isDead ? 'rgba(244, 63, 94, 0.15)' : 'rgba(99, 102, 241, 0.18)'
                      : 'var(--bg-card)',
                    border: isSelected
                      ? isDead ? '1px solid var(--accent-rose)' : '1px solid var(--primary)'
                      : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: isDead ? 'rgba(244, 63, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getNodeIcon(node.type)}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {node.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        Type: {node.type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusBadge(node.status, node.isDead)}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {node.callCount !== undefined ? `${node.callCount} calls` : ''}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Node Detailed Inspector */}
        {selectedNode && (
          <div style={{
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getNodeIcon(selectedNode.type)}
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {selectedNode.name}
                    </h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      ID: {selectedNode.id}
                    </span>
                  </div>
                </div>

                {getStatusBadge(selectedNode.status, selectedNode.isDead)}
              </div>

              {/* Status & Diagnostic Message */}
              {(selectedNode.status === 'dead' || selectedNode.isDead) ? (
                <div className="code-box-danger" style={{ padding: '10px 12px', fontSize: '0.78rem' }}>
                  <strong>Dead Code Identified:</strong> {selectedNode.orphanReason || 'Node is not reached by any active workflow trigger or visual page route.'}
                </div>
              ) : (
                <div className="code-box-success" style={{ padding: '10px 12px', fontSize: '0.78rem' }}>
                  <strong>Active & Reachable:</strong> Node is actively invoked by user journey workflows.
                </div>
              )}

              {/* Connected Relationships */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Dependency Links:</span>

                {selectedNode.referencedBy && selectedNode.referencedBy.length > 0 && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Incoming Callers: </span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{selectedNode.referencedBy.join(', ')}</span>
                  </div>
                )}

                {selectedNode.callsTo && selectedNode.callsTo.length > 0 && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Outgoing Triggers: </span>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedNode.callsTo.join(', ')}</span>
                  </div>
                )}

                {(!selectedNode.referencedBy || selectedNode.referencedBy.length === 0) && (!selectedNode.callsTo || selectedNode.callsTo.length === 0) && (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No incoming or outgoing dependency links found (Orphaned).
                  </div>
                )}
              </div>
            </div>

            {/* Action Footer */}
            {(selectedNode.status === 'dead' || selectedNode.isDead) && onPruneNode && (
              <button
                onClick={() => onPruneNode(selectedNode.id)}
                className="btn btn-sm"
                style={{
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  color: 'var(--accent-rose)',
                  border: '1px solid var(--accent-rose)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: 700
                }}
              >
                <Trash2 size={13} />
                <span>Prune This Orphaned Node</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
