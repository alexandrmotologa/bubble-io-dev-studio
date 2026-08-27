import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Stethoscope, 
  Languages, 
  Camera, 
  Settings, 
  Layers,
  Plus
} from 'lucide-react';
import { NavigationTab, ProjectProfile } from '../types';
import { ProjectDropdown } from './ProjectDropdown';

interface SidebarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  activeProject?: ProjectProfile;
  projects: ProjectProfile[];
  onSelectProject: (id: string) => void;
  onOpenConnectModal: () => void;
  onDeleteProject?: (project: ProjectProfile) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  activeProject,
  projects,
  onSelectProject,
  onOpenConnectModal,
  onDeleteProject
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'devops', label: 'DevOps & Schema', icon: Database, badge: 'CLI' },
    { id: 'audit', label: 'Dead Code & Health', icon: Stethoscope, badge: 'Audit' },
    { id: 'translator', label: 'AI Localization', icon: Languages, badge: 'AI' },
    { id: 'visual-tester', label: 'Visual QA Suite', icon: Camera, badge: 'Visual' },
    { id: 'settings', label: 'Settings & Keys', icon: Settings, badge: null }
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 16px',
      gap: '20px',
      flexShrink: 0
    }}>
      {/* App Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
        }}>
          <Layers size={22} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
            Bubble Studio
          </h1>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            v1.0.0 • All-in-One Suite
          </span>
        </div>
      </div>

      {/* Custom Project Switcher Dropdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Active Application
          </span>
          <button
            onClick={onOpenConnectModal}
            title="Connect another Bubble application"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: 0
            }}
          >
            <Plus size={11} />
            <span>Add</span>
          </button>
        </div>

        <ProjectDropdown
          activeProject={activeProject}
          projects={projects}
          onSelectProject={onSelectProject}
          onOpenConnectModal={onOpenConnectModal}
          onDeleteProject={onDeleteProject}
        />
      </div>

      {/* Navigation List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as NavigationTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} color={isActive ? 'var(--primary)' : 'currentColor'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`badge ${isActive ? 'badge-indigo' : 'badge-cyan'}`} style={{ fontSize: '0.675rem' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Environment / Footer */}
      <div style={{
        padding: '12px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)', display: 'inline-block' }}></span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            System Ready
          </span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Node 24 • Electron 34 • macOS & Win
        </span>
      </div>
    </aside>
  );
};
