import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Sparkles, 
  UserCheck, 
  Users, 
  UserX, 
  Search, 
  Database,
  CheckCircle2,
  AlertTriangle,
  FileCode
} from 'lucide-react';
import { PrivacyRuleMatrixRow, SecurityAuditReport } from '../types';

interface RoleSimulatorSandboxProps {
  matrix: PrivacyRuleMatrixRow[];
  report?: SecurityAuditReport;
}

export type SimulatedRole = 'guest' | 'auth_owner' | 'auth_other' | 'admin';

export const RoleSimulatorSandbox: React.FC<RoleSimulatorSandboxProps> = ({ matrix, report }) => {
  const tableNames = Array.from(new Set(matrix.map(m => m.dataType)));
  const [selectedTable, setSelectedTable] = useState<string>(tableNames[0] || 'User');
  const [selectedRole, setSelectedRole] = useState<SimulatedRole>('guest');

  // Filter matrix for selected table
  const tableRows = matrix.filter(m => m.dataType === selectedTable);
  const guestRow = tableRows.find(r => r.role.includes('Guest') || r.role.includes('Everyone'));
  const userRow = tableRows.find(r => r.role.includes('Authenticated'));
  const adminRow = tableRows.find(r => r.role.includes('Admin'));

  // Get list of all fields for selected table from report matrix
  const allFieldNames = Array.from(new Set([
    '_id',
    'Created Date',
    'Modified Date',
    'Created By',
    ...(guestRow?.allowedFields.filter(f => f !== '*') || []),
    ...(guestRow?.restrictedFields || []),
    ...(userRow?.allowedFields.filter(f => f !== '*') || []),
    ...(userRow?.restrictedFields || [])
  ]));

  // Determine permission per field based on simulated role
  const getFieldPermission = (fieldName: string): { status: 'VISIBLE' | 'MASKED' | 'HIDDEN'; reason: string } => {
    const isSensitive = /email|phone|password|secret|token|key|wallet|ssn|stripe|balance|card/i.test(fieldName);

    if (selectedRole === 'admin') {
      return { status: 'VISIBLE', reason: 'Admin role has unconditional bypass and full field visibility.' };
    }

    if (selectedRole === 'auth_owner') {
      return { status: 'VISIBLE', reason: 'Rule: "This record\'s Created By is Current User" matches.' };
    }

    if (selectedRole === 'auth_other') {
      if (isSensitive) {
        return { status: 'HIDDEN', reason: 'Blocked by Privacy Rule: Authenticated user is not the record creator.' };
      }
      return { status: 'VISIBLE', reason: 'Public field accessible to authenticated users.' };
    }

    // Guest / Everyone Else
    if (isSensitive) {
      return { status: 'HIDDEN', reason: 'REDACTED: Confidential PII / credential field hidden from public scrapers.' };
    }
    if (fieldName === 'Created By' || fieldName === 'Modified Date') {
      return { status: 'MASKED', reason: 'Internal audit metadata restricted for unauthenticated visitors.' };
    }
    return { status: 'VISIBLE', reason: 'Public catalog field allowed for Everyone Else.' };
  };

  const getSearchVerdict = (): { allowed: boolean; details: string } => {
    if (selectedRole === 'admin' || selectedRole === 'auth_owner') {
      return { allowed: true, details: 'Full search and filtering capabilities granted.' };
    }
    if (selectedRole === 'auth_other') {
      return { allowed: true, details: 'Allowed, but records without matching privacy rules will be excluded from search.' };
    }
    const hasSensitive = (guestRow?.restrictedFields.length || 0) > 0;
    if (hasSensitive) {
      return { allowed: true, details: 'Public search enabled, but sensitive columns are automatically redacted from API response payload.' };
    }
    return { allowed: true, details: 'Public search enabled for catalog records.' };
  };

  const searchVerdict = getSearchVerdict();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Interactive Controls Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Role Access Simulator & Security Sandbox
              </h3>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                Simulate how real Bubble API requests and search queries evaluate for different user roles
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-cyan">Zero-Data Leakage Mode</span>
            <span className="badge badge-indigo">Live Rule Evaluation</span>
          </div>
        </div>

        <div className="grid-2">
          {/* Table Selector */}
          <div>
            <label className="input-label">Target Data Table</label>
            <select
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
              className="select"
              style={{ fontWeight: 700 }}
            >
              {tableNames.map(t => (
                <option key={t} value={t}>{t} ({matrix.filter(m => m.dataType === t).length} roles)</option>
              ))}
            </select>
          </div>

          {/* Role Persona Switcher */}
          <div>
            <label className="input-label">Simulated User Persona / Role</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setSelectedRole('guest')}
                className={`btn btn-sm ${selectedRole === 'guest' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '6px 10px' }}
              >
                <UserX size={13} color={selectedRole === 'guest' ? '#fff' : '#f43f5e'} />
                <span>Guest (Public / Visitor)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('auth_other')}
                className={`btn btn-sm ${selectedRole === 'auth_other' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '6px 10px' }}
              >
                <Users size={13} color={selectedRole === 'auth_other' ? '#fff' : '#f59e0b'} />
                <span>Other Authenticated User</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('auth_owner')}
                className={`btn btn-sm ${selectedRole === 'auth_owner' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '6px 10px' }}
              >
                <UserCheck size={13} color={selectedRole === 'auth_owner' ? '#fff' : '#10b981'} />
                <span>Record Owner (Creator)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`btn btn-sm ${selectedRole === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '6px 10px' }}
              >
                <ShieldCheck size={13} color={selectedRole === 'admin' ? '#fff' : '#6366f1'} />
                <span>System Administrator</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Result: Search Query & Record Visibility */}
      <div className="grid-2">
        {/* Left: Query & API Search Verdict */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Search size={18} color="var(--primary)" />
              <span>API Search Evaluation: Do a search for {selectedTable}s</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`badge ${searchVerdict.allowed ? 'badge-emerald' : 'badge-rose'}`}>
                  {searchVerdict.allowed ? 'SEARCH ALLOWED' : 'SEARCH BLOCKED'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  GET /api/1.1/obj/{selectedTable.toLowerCase()}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Role: <strong>{selectedRole.toUpperCase()}</strong>
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              {searchVerdict.details}
            </p>

            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              💡 <strong>Bubble Privacy Rule Evaluated:</strong>{' '}
              <code style={{ color: 'var(--accent-cyan)' }}>
                {selectedRole === 'admin' 
                  ? 'Current User\'s Role is "Admin"' 
                  : selectedRole === 'auth_owner' 
                    ? `This ${selectedTable}'s Created By is Current User` 
                    : selectedRole === 'auth_other'
                      ? `Logged In (Not Creator)`
                      : `Everyone Else (Default Guest Policy)`}
              </code>
            </div>
          </div>
        </div>

        {/* Right: Simulated Record Field Visibility */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Database size={18} color="var(--accent-cyan)" />
              <span>Simulated Record Payload: {selectedTable}</span>
            </div>
            <span className="badge badge-indigo">{allFieldNames.length} Fields Evaluated</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '340px', overflowY: 'auto' }}>
            {allFieldNames.map(f => {
              const perm = getFieldPermission(f);
              return (
                <div
                  key={f}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: perm.status === 'VISIBLE' 
                      ? 'rgba(16, 185, 129, 0.06)' 
                      : perm.status === 'MASKED' 
                        ? 'rgba(245, 158, 11, 0.06)' 
                        : 'rgba(244, 63, 94, 0.06)',
                    border: `1px solid ${
                      perm.status === 'VISIBLE' 
                        ? 'rgba(16, 185, 129, 0.25)' 
                        : perm.status === 'MASKED' 
                          ? 'rgba(245, 158, 11, 0.25)' 
                          : 'rgba(244, 63, 94, 0.25)'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.775rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {perm.status === 'VISIBLE' ? (
                      <Eye size={13} color="#10b981" />
                    ) : perm.status === 'MASKED' ? (
                      <AlertTriangle size={13} color="#f59e0b" />
                    ) : (
                      <EyeOff size={13} color="#f43f5e" />
                    )}
                    <strong style={{ color: 'var(--text-primary)' }}>{f}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {perm.status === 'VISIBLE' 
                        ? `"${f === '_id' ? '1728392183x1' : 'example_value'}"` 
                        : perm.status === 'MASKED' 
                          ? '••••••••' 
                          : '[REDACTED]'}
                    </span>
                    <span className={`badge ${
                      perm.status === 'VISIBLE' 
                        ? 'badge-emerald' 
                        : perm.status === 'MASKED' 
                          ? 'badge-amber' 
                          : 'badge-rose'
                    }`} style={{ fontSize: '0.65rem' }}>
                      {perm.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
