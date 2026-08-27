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
  Sparkles
} from 'lucide-react';

export interface DagNode {
  id: string;
  name: string;
  type: 'page' | 'reusable' | 'element' | 'custom_event' | 'backend_workflow' | 'option_set';
  status: 'active' | 'warning' | 'dead';
  pageParent?: string;
  callCount?: number;
  orphanReason?: string;
  referencedBy?: string[];
  callsTo?: string[];
}

interface InteractiveDagGraphProps {
  nodes?: DagNode[];
  onPruneNode?: (nodeId: string) => void;
}

const DEFAULT_NODES: DagNode[] = [
  // Pages
  { id: 'page-index', name: 'index (Home)', type: 'page', status: 'active', callCount: 14, callsTo: ['reusable-header', 'wf-login', 'wf-signup'] },
  { id: 'page-dashboard', name: 'dashboard', type: 'page', status: 'active', callCount: 28, callsTo: ['reusable-header', 'wf-load-feed'] },
  { id: 'page-checkout', name: 'checkout_v2', type: 'page', status: 'active', callCount: 9, callsTo: ['wf-stripe-charge'] },
  { id: 'page-old-checkout', name: 'checkout_old_backup', type: 'page', status: 'dead', callCount: 0, orphanReason: 'Unreferenced backup page with no incoming navigation links.' },
  { id: 'page-admin-test', name: 'test_admin_sandbox', type: 'page', status: 'dead', callCount: 0, orphanReason: 'Development sandbox not linked in production menus.' },

  // Reusable Elements
  { id: 'reusable-header', name: 'Header_Navigation', type: 'reusable', status: 'active', callCount: 42, referencedBy: ['page-index', 'page-dashboard'], callsTo: ['wf-logout'] },
  { id: 'reusable-modal-old', name: 'Legacy_Popup_Modal', type: 'reusable', status: 'dead', callCount: 0, orphanReason: 'Reusable element never placed on any page or popup.' },

  // Workflows & Events
  { id: 'wf-login', name: 'Workflow: User Logs In', type: 'custom_event', status: 'active', callCount: 18, referencedBy: ['page-index'] },
  { id: 'wf-signup', name: 'Workflow: Sign Up With Email', type: 'custom_event', status: 'active', callCount: 12, referencedBy: ['page-index'] },
  { id: 'wf-stripe-charge', name: 'Backend: process_stripe_charge', type: 'backend_workflow', status: 'active', callCount: 34, referencedBy: ['page-checkout'] },
  { id: 'wf-orphan-event', name: 'Custom Event: send_test_email_v1', type: 'custom_event', status: 'dead', callCount: 0, orphanReason: 'Custom event never triggered by any button action or workflow.' },
  { id: 'wf-unused-backend', name: 'Backend: sync_legacy_hubspot', type: 'backend_workflow', status: 'dead', callCount: 0, orphanReason: 'API endpoint enabled in Bubble settings but never invoked in 180 days.' }
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
    if (statusFilter !== 'all' && n.status !== statusFilter) return false;
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

  const getStatusBadge = (status: 'active' | 'warning' | 'dead') => {
    switch (status) {
      case 'active':
        return (
          <span style={{ fontSize: '0.675rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            Active in Journey
          </span>
        );
      case 'warning':
        return (
          <span style={{ fontSize: '0.675rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            Low Usage
          </span>
        );
      case 'dead':
        return (
          <span style={{ fontSize: '0.675rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', fontWeight: 700, border: '1px solid rgba(244, 63, 94, 0.3)' }}>
            Orphaned Dead Code
          </span>
        );
    }
  };

  const activeCount = nodes.filter(n => n.status === 'active').length;
  const deadCount = nodes.filter(n => n.status === 'dead').length;

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface-elevated)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      padding: '18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      {/* Header & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GitBranch size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Interactive AST Dependency Graph (DAG)
            </h3>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)', fontWeight: 700 }}>
              {activeCount} Active Nodes
            </span>
            <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.12)', color: 'var(--accent-rose)', fontWeight: 700 }}>
              {deadCount} Dead Nodes
            </span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '8px', top: '8px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search AST node..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="input input-sm"
              style={{ paddingLeft: '26px', width: '160px', height: '28px', fontSize: '0.75rem' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="select select-sm"
            style={{ height: '28px', fontSize: '0.75rem', padding: '0 8px' }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="dead">Dead Code Only</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="select select-sm"
            style={{ height: '28px', fontSize: '0.75rem', padding: '0 8px' }}
          >
            <option value="all">All Types</option>
            <option value="page">Pages</option>
            <option value="reusable">Reusable Elements</option>
            <option value="custom_event">Custom Events</option>
            <option value="backend_workflow">Backend Workflows</option>
          </select>
        </div>
      </div>

      {/* Main 2-Column Layout: Node Hierarchy & Node Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px', minHeight: '380px' }}>
        {/* Left: Node Cards Grid */}
        <div style={{
          backgroundColor: '#0a0d14',
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
              No DAG nodes match your filter.
            </div>
          ) : (
            filteredNodes.map(node => {
              const isSelected = node.id === selectedNode?.id;
              const isDead = node.status === 'dead';
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
                      : 'var(--bg-input)',
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
                    {getStatusBadge(node.status)}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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

                {getStatusBadge(selectedNode.status)}
              </div>

              {/* Status & Diagnostic Message */}
              {selectedNode.status === 'dead' ? (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  fontSize: '0.75rem',
                  color: 'var(--accent-rose)',
                  lineHeight: 1.5
                }}>
                  <strong>Dead Code Identified:</strong> {selectedNode.orphanReason}
                </div>
              ) : (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '0.75rem',
                  color: 'var(--accent-emerald)',
                  lineHeight: 1.5
                }}>
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
            {selectedNode.status === 'dead' && onPruneNode && (
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
