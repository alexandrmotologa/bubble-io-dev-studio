import React, { useState, useRef, useEffect } from 'react';
import { 
  Layers, 
  ChevronDown, 
  Check, 
  Plus, 
  Globe, 
  ShieldCheck, 
  FlaskConical, 
  Search,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { ProjectProfile } from '../types';

interface ProjectDropdownProps {
  activeProject?: ProjectProfile;
  projects: ProjectProfile[];
  onSelectProject: (id: string) => void;
  onOpenAddProject?: () => void;
  onLoadDemoProject?: () => void;
}

export const ProjectDropdown: React.FC<ProjectDropdownProps> = ({
  activeProject,
  projects,
  onSelectProject,
  onOpenAddProject,
  onLoadDemoProject
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && projects.length > 3) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, projects.length]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.appId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEnvBadge = (env: string) => {
    switch (env) {
      case 'live':
        return { label: 'LIVE', color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'staging':
        return { label: 'STAGE', color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.15)' };
      default:
        return { label: 'DEV', color: 'var(--accent-cyan)', bg: 'rgba(6, 182, 212, 0.15)' };
    }
  };

  if (projects.length === 0) {
    return (
      <button
        onClick={onOpenAddProject}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: '0.825rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
        }}
      >
        <Plus size={15} />
        <span>Connect Bubble App</span>
      </button>
    );
  }

  const activeEnv = activeProject ? getEnvBadge(activeProject.environment) : getEnvBadge('development');

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Premium Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '8px 10px',
          background: isOpen ? 'var(--bg-surface-elevated)' : 'var(--bg-input)',
          border: isOpen ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '0 0 16px rgba(99, 102, 241, 0.25)' : 'none',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
          {/* App Emblem / Avatar */}
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            fontWeight: 800,
            fontSize: '0.75rem',
            flexShrink: 0
          }}>
            {activeProject?.name.charAt(0).toUpperCase() || 'B'}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontWeight: 700,
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2
            }}>
              {activeProject?.name || 'Select Bubble App'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.2, marginTop: '2px' }}>
              <code>{activeProject?.appId || 'no-app'}</code>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', flexShrink: 0 }}>
          <span style={{
            fontSize: '0.625rem',
            fontWeight: 800,
            padding: '2px 5px',
            borderRadius: '4px',
            background: activeEnv.bg,
            color: activeEnv.color,
            letterSpacing: '0.04em'
          }}>
            {activeEnv.label}
          </span>
          <ChevronDown
            size={14}
            color="var(--text-secondary)"
            style={{
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          />
        </div>
      </button>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          width: '300px',
          background: 'var(--bg-sidebar)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 18px 40px rgba(0, 0, 0, 0.75), 0 0 20px rgba(99, 102, 241, 0.2)',
          backdropFilter: 'blur(16px)',
          zIndex: 1000,
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 14px 10px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Bubble Workspaces
            </span>
            <span className="badge badge-indigo" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
              {projects.length} {projects.length === 1 ? 'App' : 'Apps'}
            </span>
          </div>

          {/* Search bar if multiple projects */}
          {projects.length > 2 && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                border: '1px solid var(--border-subtle)'
              }}>
                <Search size={13} color="var(--text-muted)" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search application..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.775rem',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
          )}

          {/* Project List */}
          <div style={{
            maxHeight: '230px',
            overflowY: 'auto',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px'
          }}>
            {filteredProjects.map(project => {
              const isSelected = project.id === activeProject?.id;
              const env = getEnvBadge(project.environment);

              return (
                <div
                  key={project.id}
                  onClick={() => {
                    onSelectProject(project.id);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--bg-surface-elevated)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-active)' : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.06)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.725rem',
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {project.name.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: '0.825rem',
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {project.name}
                      </div>
                      <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                        <code>{project.appId}</code>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      padding: '2px 4px',
                      borderRadius: '3px',
                      background: env.bg,
                      color: env.color
                    }}>
                      {env.label}
                    </span>

                    {isSelected && (
                      <Check size={14} color="var(--primary)" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div style={{
            padding: '8px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAddProject?.();
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: '1px dashed var(--border-active)',
                color: 'var(--primary)',
                fontSize: '0.775rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={13} />
              <span>Connect New Bubble App</span>
            </button>

            {onLoadDemoProject && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLoadDemoProject();
                }}
                style={{
                  width: '100%',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.725rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <FlaskConical size={12} color="var(--accent-amber)" />
                <span>Load Sandbox Demo App</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
