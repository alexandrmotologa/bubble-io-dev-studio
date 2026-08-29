import React from 'react';
import { 
  Database, 
  Stethoscope, 
  Languages, 
  Camera, 
  BookOpen,
  Webhook,
  Shield,
  Bot,
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  HardDriveDownload,
  Sparkles,
  Plus,
  Layers,
  Activity,
  GitBranch,
  FileCode,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { NavigationTab, ProjectProfile } from '../types';

interface DashboardViewProps {
  activeProject?: ProjectProfile;
  onNavigate: (tab: NavigationTab) => void;
  onOpenConnectModal: () => void;
  onRunQuickBackup: () => void;
  onRunQuickAudit: () => void;
  onOpenCopilot?: () => void;
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
  onOpenCopilot,
  isBackingUp,
  isAuditing,
  healthScore,
  healthGrade
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

  // Dynamic Blueprint & Stats Extraction
  const bp = activeProject.blueprintExportJson;
  const pagesCount = bp?.pages ? Object.keys(bp.pages).length : (activeProject.stats?.pagesCount || 1);
  const workflowsCount = bp?.workflows ? Object.keys(bp.workflows).length : (activeProject.stats?.workflowsCount || 0);
  const tablesCount = bp?.data_types ? Object.keys(bp.data_types).length : (activeProject.stats?.dataTypesCount || 0);
  const pluginsCount = bp?.plugins ? Object.keys(bp.plugins).length : 4;
  const elementsCount = bp?.elements ? Object.keys(bp.elements).length : 18;

  return (
    <div className="view-container">
      {/* Top Banner / Project Status */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid var(--border-active)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-indigo">
                <Sparkles size={12} /> Active Bubble Workspace
              </span>
              <span className={`badge ${activeProject.environment.includes('live') ? 'badge-emerald' : 'badge-cyan'}`}>
                {activeProject.environment.toUpperCase()}
              </span>
              {activeProject.httpBasicUser && (
                <span className="badge badge-amber">HTTP Basic Auth Protected</span>
              )}
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {activeProject.name}
            </h2>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span>App ID: <strong style={{ color: 'var(--text-primary)' }}>{activeProject.appId}</strong></span>
              <span>•</span>
              <span>Environment: <strong style={{ color: activeProject.environment.includes('live') ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }}>{activeProject.environment}</strong></span>
              {activeProject.customDomain && (
                <>
                  <span>•</span>
                  <span>Domain: <strong style={{ color: 'var(--text-primary)' }}>{activeProject.customDomain}</strong></span>
                </>
              )}
              <span>•</span>
              <span>Connected: <strong>{new Date(activeProject.createdAt).toLocaleDateString()}</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {onOpenCopilot && (
              <button onClick={onOpenCopilot} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' }}>
                <Bot size={16} />
                <span>AI Copilot (Ctrl+I)</span>
              </button>
            )}
            <button 
              onClick={onRunQuickBackup} 
              disabled={isBackingUp}
              className="btn btn-secondary"
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

      {/* Live Workspace Blueprint Metrics */}
      <div className="grid-5" style={{ gap: '10px' }}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DATA TYPES & TABLES</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>{tablesCount} Types</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Live Data API Ready</div>
        </div>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PAGES & VIEWS</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{pagesCount} Pages</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Responsive layouts</div>
        </div>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WORKFLOW LOGIC</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{workflowsCount} Workflows</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Client & Backend Events</div>
        </div>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>UI ELEMENTS</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{elementsCount} Elements</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>AST AST Parsed</div>
        </div>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>INSTALLED PLUGINS</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ec4899' }}>{pluginsCount} Plugins</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Performance Monitored</div>
        </div>
      </div>

      {/* 4 Core Module Tiles */}
      <div className="grid-4">
        {/* Module 1: DevOps & Data Studio */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('devops')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Database size={20} />
            </div>
            <span className="badge badge-indigo">DevOps & Schema</span>
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Database & 3-Way Diff</h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
            Automated backups, ERD visualizer, 3-way branch diff (Dev ↔ Staging ↔ Live), and mock server.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
            <span>Open Studio</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Module 2: Dead Code & AST Health */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('audit')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-emerald)'
            }}>
              <Stethoscope size={20} />
            </div>
            <span className={`badge ${healthScore ? 'badge-emerald' : 'badge-indigo'}`}>
              {healthGrade ? `Grade ${healthGrade}` : 'AST Engine'}
            </span>
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>AST Health & Dead Code</h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
            Orphaned UI elements, dead workflows, dynamic DAG dependency graph & plugin performance auditor.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
            <span>Analyze App</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Module 3: AI Localization Studio */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('translator')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <Languages size={20} />
            </div>
            <span className="badge badge-cyan">AI Translation</span>
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>AI Localization Studio</h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
            Multi-provider translation (Gemini, OpenAI, Claude, OpenRouter & Ollama) with brand glossary.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            <span>Translate Strings</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Module 4: Visual QA Suite */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('visual-tester')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)'
            }}>
              <Camera size={20} />
            </div>
            <span className="badge badge-amber">Visual QA</span>
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>Visual QA & Pixel Diff</h3>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
            Automated multi-device regression test suite (Desktop, Tablet, Mobile) with HTTP Basic Auth.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
            <span>Run Test Matrix</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Bottom Row: App Health & Quick Launch */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <ShieldCheck size={20} color="var(--accent-emerald)" />
                <span>App Quality & AST Health Score</span>
              </div>
              <div className="card-subtitle">Calculated via static AST dependency analysis engine</div>
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

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Activity size={20} color="var(--primary)" />
                <span>Quick Actions & Workflows</span>
              </div>
              <div className="card-subtitle">Frequent developer workflows for {activeProject.name}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div 
              onClick={() => onNavigate('doc-gen')}
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
                <strong>📚 1-Click DocGen Book:</strong> Compile complete architecture and developer documentation.
              </div>
              <ArrowRight size={14} color="var(--accent-cyan)" />
            </div>

            <div 
              onClick={() => onNavigate('api-studio')}
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
                <strong>🔌 Webhooks & API Studio:</strong> Live dispatcher, cURL to API Connector & OpenAPI 3.0 specs.
              </div>
              <ArrowRight size={14} color="var(--primary)" />
            </div>

            <div 
              onClick={() => onNavigate('security')}
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
                <strong>🛡️ Security & RBAC Matrix:</strong> Audit Privacy Rules and find data exposure vulnerabilities.
              </div>
              <ArrowRight size={14} color="var(--accent-emerald)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
