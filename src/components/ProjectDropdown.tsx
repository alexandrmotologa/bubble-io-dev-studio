import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Plus, 
  Check, 
  Search, 
  Layers, 
  Trash2
} from 'lucide-react';
import { ProjectProfile } from '../types';

interface ProjectDropdownProps {
  activeProject?: ProjectProfile;
  projects: ProjectProfile[];
  onSelectProject: (id: string) => void;
  onOpenConnectModal: () => void;
  onDeleteProject?: (project: ProjectProfile) => void;
}

export const ProjectDropdown: React.FC<ProjectDropdownProps> = ({
  activeProject,
  projects,
  onSelectProject,
  onOpenConnectModal,
  onDeleteProject
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.appId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 12px',
          backgroundColor: 'var(--bg-input)',
          border: isOpen ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s ease',
          boxShadow: isOpen ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: activeProject ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))' : 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: activeProject ? 'var(--primary)' : 'var(--text-muted)'
          }}>
            <Layers size={15} />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: activeProject ? 'var(--text-primary)' : 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {activeProject ? activeProject.name : 'No App Connected'}
              </span>
              {activeProject && (
                <span className={`badge ${activeProject.environment.includes('live') ? 'badge-emerald' : 'badge-cyan'}`} style={{ fontSize: '0.6rem', padding: '1px 5px', flexShrink: 0 }}>
                  {activeProject.environment.includes('live') ? 'LIVE' : 'TEST'}
                </span>
              )}
            </div>
          </div>
        </div>

        <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: '6px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(99, 102, 241, 0.15)',
          zIndex: 900,
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          {/* Search bar if multiple projects */}
          {projects.length > 2 && (
            <div style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)', position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search apps..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                style={{ paddingLeft: '28px', fontSize: '0.75rem', height: '30px' }}
                autoFocus
              />
            </div>
          )}

          {/* Project list */}
          <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
            {filteredProjects.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No applications found.
              </div>
            ) : (
              filteredProjects.map(proj => {
                const isSelected = activeProject?.id === proj.id;
                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      onSelectProject(proj.id);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'background 0.1s ease',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-input)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {proj.name}
                      </span>
                      <span className={`badge ${proj.environment.includes('live') ? 'badge-emerald' : 'badge-cyan'}`} style={{ fontSize: '0.55rem', padding: '0 4px', flexShrink: 0 }}>
                        {proj.environment.includes('live') ? 'LIVE' : 'TEST'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isSelected && (
                        <Check size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                      )}
                      {onDeleteProject && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            onDeleteProject(proj);
                          }}
                          title={`Remove ${proj.name}`}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-rose)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Project Footer */}
          <div style={{ padding: '6px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-input)' }}>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenConnectModal();
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-active)',
                background: 'transparent',
                color: 'var(--primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Plus size={14} />
              <span>Connect New Bubble App</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
