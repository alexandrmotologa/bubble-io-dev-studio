import React from 'react';
import { 
  Database, 
  Stethoscope, 
  Languages, 
  Camera, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  HardDriveDownload,
  Sparkles,
  Check,
  BookOpen
} from 'lucide-react';
import { NavigationTab, ProjectProfile } from '../types';

interface DashboardViewProps {
  activeProject?: ProjectProfile;
  onNavigate: (tab: NavigationTab) => void;
  onRunQuickBackup: () => void;
  onRunQuickAudit: () => void;
  isBackingUp: boolean;
  isAuditing: boolean;
  healthScore: number;
  healthGrade: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeProject,
  onNavigate,
  onRunQuickBackup,
  onRunQuickAudit,
  isBackingUp,
  isAuditing,
  healthScore,
  healthGrade
}) => {
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
              <Sparkles size={12} /> Active Bubble.io Workspace
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {activeProject?.name || 'My Bubble Application'}
            </h2>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>App ID: <strong style={{ color: 'var(--text-primary)' }}>{activeProject?.appId}</strong></span>
              <span>•</span>
              <span>Environment: <strong style={{ color: 'var(--accent-emerald)' }}>{activeProject?.environment.toUpperCase()}</strong></span>
              <span>•</span>
              <span>Domain: <strong style={{ color: 'var(--text-primary)' }}>{activeProject?.customDomain || `${activeProject?.appId}.bubbleapps.io`}</strong></span>
            </div>
          </div>

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
              <span>{isAuditing ? 'Auditing...' : 'Run Audit'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Start Guide Card */}
      <div className="card" style={{ padding: '18px 24px', background: 'rgba(255, 255, 255, 0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Quick Start: Master Your Bubble App in 3 Steps</h3>
          </div>
          <span className="badge badge-emerald">Ready for Development</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
          <div style={{ padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>1. Check App Health</strong>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Run a Dead Code Scan to find orphaned elements and unused workflows. Follow the interactive fix guides.
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem' }}>2. Export Types & Backups</strong>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              In DevOps & Schema, trigger an automated database backup and generate TypeScript types for external APIs.
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--accent-amber)', fontSize: '0.85rem' }}>3. Translate & Visual QA</strong>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Batch translate app texts with AI models, and run regression tests before pushing to Live.
            </p>
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
            <span className="badge badge-indigo">CLI Engine</span>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>DevOps & Schema</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Automated backups, ERD visualizer, schema diffs, and TypeScript generator.
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
            <span className="badge badge-emerald">Grade {healthGrade}</span>
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
            <span className="badge badge-cyan">AI Powered</span>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>AI Localization</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Translate UI texts with OpenAI / Gemini with translation memory & glossaries.
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

      {/* Bottom Row: App Health & Recommendations */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <ShieldCheck size={20} color="var(--accent-emerald)" />
                <span>Overall App Health & Quality</span>
              </div>
              <div className="card-subtitle">Based on latest AST dead code scan</div>
            </div>
            <span className="badge badge-emerald">Optimal</span>
          </div>

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

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Orphaned UI Elements:</span>
                <strong style={{ color: 'var(--accent-amber)' }}>8 items</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Dead Workflows:</span>
                <strong style={{ color: 'var(--accent-rose)' }}>6 items</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Unused Database Fields:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>5 fields</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Unreferenced Styles:</span>
                <strong style={{ color: 'var(--text-primary)' }}>4 styles</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <AlertTriangle size={20} color="var(--accent-amber)" />
                <span>High-Priority Recommendations</span>
              </div>
              <div className="card-subtitle">Actionable optimizations for your Bubble app</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              fontSize: '0.85rem',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <CheckCircle2 size={16} color="var(--accent-amber)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>Purge 6 orphaned workflow actions:</strong> Prevents silent backend execution errors and queue stalls.
              </div>
            </div>

            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              fontSize: '0.85rem',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <CheckCircle2 size={16} color="var(--primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong>Generate TypeScript definitions:</strong> Export current Bubble schema interfaces to your external frontend or API repo.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
