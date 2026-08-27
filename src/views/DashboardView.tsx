import React from 'react';
import { 
  Database, 
  Stethoscope, 
  Languages, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  HardDriveDownload,
  Sparkles,
  Plus,
  Layers,
  Activity
} from 'lucide-react';
import { NavigationTab, ProjectProfile, AuditHealthReport } from '../types';

interface DashboardViewProps {
  activeProject?: ProjectProfile;
  onNavigate: (tab: NavigationTab) => void;
  onOpenConnectModal: () => void;
  onRunQuickBackup: () => void;
  onRunQuickAudit: () => void;
  onOpenAddProject?: () => void;
  onLoadDemoProject?: () => void;
  isBackingUp: boolean;
  isAuditing: boolean;
  healthScore: number | null;
  healthGrade: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeProject,
  onNavigate,
  onOpenConnectModal,
  onRunQuickBackup,
  onRunQuickAudit,
  onOpenAddProject,
  onLoadDemoProject,
  isBackingUp,
  isAuditing,
  auditReport
}) => {
  // Empty State: No app configured yet
  if (!activeProject) {
    return (
      <div className="view-container">
        <div className="card" style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px solid var(--border-active)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
          }}>
            <Layers size={32} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Welcome to Bubble.io Dev Studio
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            The all-in-one developer workspace for Bubble.io. Manage schemas & migrations, detect orphaned dead code, translate apps with multi-provider AI, and run visual pixel regression tests.
          </p>

          <button onClick={onOpenConnectModal} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
            <Plus size={18} />
            <span>Connect Your First Bubble App</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container">
      {/* Top Banner / Project Status */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid var(--border-active)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="badge badge-indigo" style={{ marginBottom: '8px' }}>
              <Sparkles size={12} /> Active Bubble Workspace
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {activeProject.name}
            </h2>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>App ID: <strong style={{ color: 'var(--text-primary)' }}>{activeProject.appId}</strong></span>
              <span>•</span>
              <span>Environment: <strong style={{ color: activeProject.environment.includes('live') ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }}>{activeProject.environment}</strong></span>
              {activeProject.customDomain && (
                <>
                  <span>•</span>
                  <span>Domain: <strong style={{ color: 'var(--text-primary)' }}>{activeProject.customDomain}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Banner */
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%)',
          border: '1px dashed var(--border-active)',
          textAlign: 'center',
          padding: '36px 24px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--primary-glow)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            marginBottom: '12px'
          }}>
            <Plus size={24} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>No Bubble.io Application Connected</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '480px', margin: '8px auto 20px' }}>
            Connect your Bubble.io application to start managing backups, analyzing dead code, translating UI texts, and running visual QA tests.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={onOpenAddProject} className="btn btn-primary">
              <Plus size={16} />
              <span>Connect Your Bubble App</span>
            </button>
            <button onClick={onLoadDemoProject} className="btn btn-secondary">
              <FlaskConical size={16} />
              <span>Load Sandbox Demo</span>
            </button>
          </div>
        </div>
      )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onRunQuickBackup} 
              disabled={isBackingUp}
              className="btn btn-primary"
            >
              <HardDriveDownload size={16} />
              <span>{isBackingUp ? 'Backing up...' : 'Quick Backup'}</span>
            </button>
            <button 
              onClick={onRunQuickAudit} 
              disabled={isAuditing}
              className="btn btn-secondary"
            >
              <Stethoscope size={16} />
              <span>{isAuditing ? 'Auditing...' : 'Run AST Audit'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Module Tiles */}
      <div className="grid-4">
        {/* Module 1 */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('devops')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Database size={22} />
            </div>
            <span className="badge badge-indigo">DevOps & CLI</span>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Database & Schema</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Backups, ERD visualizer, TypeScript definitions, and schema migrations.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
            <span>Open Studio</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Module 2 */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('audit')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-emerald)'
            }}>
              <Stethoscope size={22} />
            </div>
            <span className={`badge ${healthScore ? 'badge-emerald' : 'badge-indigo'}`}>
              {healthGrade ? `Grade ${healthGrade}` : 'AST Engine'}
            </span>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Dead Code Detector</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Find orphaned UI elements, dead workflows, unused styles and DB fields.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
            <span>Analyze App</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Module 3 */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('translator')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <Languages size={22} />
            </div>
            <span className="badge badge-cyan">AI Engine</span>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>AI Localization</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Translate App Texts with Gemini, OpenAI, Claude, OpenRouter & Ollama.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            <span>Translate App</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Module 4 */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('visual-tester')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)'
            }}>
              <Camera size={22} />
            </div>
            <span className="badge badge-amber">Visual QA</span>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Visual QA Suite</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Automate pixel diff testing across desktop, tablet, and mobile viewports.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
            <span>Run Test Suite</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Bottom Row: App Health & System Ready */}
      <div className="grid-2">
        {/* Dynamic Health Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <ShieldCheck size={20} color="var(--accent-emerald)" />
                <span>App Quality & Health Score</span>
              </div>
              <div className="card-subtitle">Calculated via AST static analysis engine</div>
            </div>
            {healthScore && <span className="badge badge-emerald">Grade {healthGrade}</span>}
          </div>

          {healthScore ? (
            <div className="health-score-container" style={{ marginTop: '12px' }}>
              <div 
                className="gauge-circle" 
                style={{ '--score-pct': healthScore } as React.CSSProperties}
              >
                <div className="gauge-inner">
                  <span className="gauge-number">{healthScore}%</span>
                  <span className="gauge-grade">Grade {healthGrade}</span>
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                <div style={{ color: 'var(--text-secondary)' }}>
                  AST audit scan has evaluated your application's workflows, UI elements, database fields, styles, and privacy rules.
                </div>
                <button onClick={() => onNavigate('audit')} className="btn btn-secondary btn-sm" style={{ marginTop: '8px', alignSelf: 'flex-start' }}>
                  <span>View Full Audit Scorecard</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Activity size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                No AST scan performed yet
              </div>
              <p style={{ fontSize: '0.8rem', margin: '4px 0 16px' }}>
                Run an audit to calculate your app's health score and detect dead code across 7 rules.
              </p>
              <button onClick={onRunQuickAudit} disabled={isAuditing} className="btn btn-primary btn-sm">
                <Stethoscope size={14} />
                <span>{isAuditing ? 'Analyzing AST...' : 'Run First Audit'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Recommendations Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Activity size={20} color="var(--primary)" />
                <span>Quick Actions & Workflows</span>
              </div>
              <div className="card-subtitle">Frequent development tasks for {activeProject.name}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div 
              onClick={() => onNavigate('devops')}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div>
                <strong>Explore Database & ERD:</strong> View tables, fields, and generate TypeScript interfaces.
              </div>
              <ArrowRight size={14} color="var(--primary)" />
            </div>

            <div 
              onClick={() => onNavigate('translator')}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div>
                <strong>AI Localization Studio:</strong> Translate application strings and manage brand terms glossary.
              </div>
              <ArrowRight size={14} color="var(--accent-cyan)" />
            </div>

            <div 
              onClick={() => onNavigate('visual-tester')}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div>
                <strong>Visual QA & Viewport Diff:</strong> Test responsive layouts with Pixelmatch comparison slider.
              </div>
              <ArrowRight size={14} color="var(--accent-amber)" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
