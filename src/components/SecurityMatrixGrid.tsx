import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  Lock, 
  Unlock,
  AlertTriangle,
  Info,
  Copy,
  X,
  CheckCheck
} from 'lucide-react';
import { PrivacyRuleMatrixRow } from '../types';
import { toast } from '../core/toast/toastManager';

interface SecurityMatrixGridProps {
  matrix: PrivacyRuleMatrixRow[];
}

export const SecurityMatrixGrid: React.FC<SecurityMatrixGridProps> = ({ matrix }) => {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showRestrictedOnly, setShowRestrictedOnly] = useState(false);
  const [selectedRowDetail, setSelectedRowDetail] = useState<PrivacyRuleMatrixRow | null>(null);

  const roles = Array.from(new Set(matrix.map(m => m.role)));

  const filteredMatrix = matrix.filter(row => {
    if (selectedRole !== 'all' && row.role !== selectedRole) return false;
    if (showRestrictedOnly && row.accessLevel === 'full') return false;
    if (searchTerm && !row.dataType.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input"
              style={{ paddingLeft: '30px', height: '34px', fontSize: '0.8rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
            <button
              onClick={() => setSelectedRole('all')}
              className={`btn btn-sm ${selectedRole === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', height: '28px', fontSize: '0.725rem', padding: '0 8px' }}
            >
              All Roles ({matrix.length})
            </button>
            {roles.map(r => (
              <button
                key={r}
                onClick={() => setSelectedRole(r)}
                className={`btn btn-sm ${selectedRole === r ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', height: '28px', fontSize: '0.725rem', padding: '0 8px' }}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowRestrictedOnly(prev => !prev)}
            className={`btn btn-sm ${showRestrictedOnly ? 'btn-primary' : 'btn-secondary'}`}
            style={{ height: '32px', fontSize: '0.75rem', padding: '0 10px' }}
          >
            <Lock size={12} />
            <span>Restricted Only</span>
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.725rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /> Full Access
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} /> Conditional
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }} /> Restricted
          </span>
        </div>
      </div>

      {/* Grid Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Data Type</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>User Role</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Find in Searches</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>View All Fields</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Privacy Rule Condition</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Access Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatrix.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {row.dataType}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${row.role.includes('Admin') ? 'badge-indigo' : row.role.includes('Authenticated') ? 'badge-cyan' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
                      {row.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {row.findInSearches ? (
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={13} /> Allowed
                      </span>
                    ) : (
                      <span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <EyeOff size={13} /> Hidden
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {row.viewAllFields ? (
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Unlock size={13} /> All Fields
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedRowDetail(row)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f59e0b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        <Lock size={13} /> Restricted ({row.restrictedFields.length} hidden)
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: row.conditionExpression ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                    {row.conditionExpression || 'Default (No Condition)'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {row.accessLevel === 'full' && (
                      <span className="badge badge-emerald">FULL ACCESS</span>
                    )}
                    {row.accessLevel === 'conditional' && (
                      <span className="badge badge-amber">CONDITIONAL</span>
                    )}
                    {row.accessLevel === 'hidden' && (
                      <span className="badge badge-indigo">RESTRICTED</span>
                    )}
                    {row.accessLevel === 'none' && (
                      <span className="badge badge-rose">BLOCKED</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedRowDetail(row)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                      title="Inspect field permissions"
                    >
                      <Info size={11} />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Field Inspection Modal */}
      {selectedRowDetail && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: 'var(--bg-surface-elevated, #121826)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(18, 24, 38, 0.9) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={20} color="var(--primary)" />
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedRowDetail.dataType} • {selectedRowDetail.role}
                  </h3>
                  <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                    Evaluated Privacy Rule Permissions Breakdown
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRowDetail(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label">Privacy Rule Condition</label>
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{selectedRowDetail.conditionExpression || 'Everyone Else (Default Access)'}</span>
                  {selectedRowDetail.conditionExpression && (
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedRowDetail.conditionExpression || '', 'Condition')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.675rem', padding: '2px 6px' }}
                    >
                      <Copy size={10} />
                    </button>
                  )}
                </div>
              </div>

              {selectedRowDetail.restrictedFields.length > 0 && (
                <div>
                  <label className="input-label">Restricted / Blocked Fields ({selectedRowDetail.restrictedFields.length})</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {selectedRowDetail.restrictedFields.map(f => (
                      <span key={f} className="badge badge-rose" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                        <Lock size={11} style={{ marginRight: '4px' }} /> {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="input-label">Allowed Fields Policy</label>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {selectedRowDetail.viewAllFields 
                    ? 'All database fields are readable by this user role.' 
                    : `Only public catalog fields are allowed (${selectedRowDetail.allowedFields.join(', ')}).`}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedRowDetail(null)}
                  className="btn btn-primary btn-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
