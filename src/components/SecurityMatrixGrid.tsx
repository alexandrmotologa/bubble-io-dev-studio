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
  Info
} from 'lucide-react';
import { PrivacyRuleMatrixRow } from '../types';

interface SecurityMatrixGridProps {
  matrix: PrivacyRuleMatrixRow[];
}

export const SecurityMatrixGrid: React.FC<SecurityMatrixGridProps> = ({ matrix }) => {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const roles = Array.from(new Set(matrix.map(m => m.role)));
  const dataTypes = Array.from(new Set(matrix.map(m => m.dataType)));

  const filteredMatrix = matrix.filter(row => {
    if (selectedRole !== 'all' && row.role !== selectedRole) return false;
    if (searchTerm && !row.dataType.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
              All Roles
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
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }} /> Blocked / None
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
                    <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{row.role}</span>
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
                      <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={13} /> Restricted ({row.allowedFields.length} allowed)
                      </span>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
