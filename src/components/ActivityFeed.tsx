import React, { useState, useEffect } from 'react';
import {
  HardDriveDownload,
  Stethoscope,
  RefreshCw,
  Languages,
  ShieldCheck,
  GitBranch,
  FileCode,
  Sliders,
  Layers,
  Terminal,
  Clock,
  Trash2,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { ActivityStore, ActivityEntry, ActivityType } from '../core/activity/activityStore';
import { NavigationTab } from '../types';

interface ActivityFeedProps {
  projectId?: string;
  onNavigate?: (tab: NavigationTab) => void;
  maxDisplay?: number;
}

const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'backup':
      return <HardDriveDownload size={14} color="var(--primary)" />;
    case 'audit':
      return <Stethoscope size={14} color="var(--accent-emerald)" />;
    case 'sync':
      return <RefreshCw size={14} color="var(--accent-cyan)" />;
    case 'translation':
      return <Languages size={14} color="#a855f7" />;
    case 'security':
      return <ShieldCheck size={14} color="#f43f5e" />;
    case 'migration':
      return <GitBranch size={14} color="var(--accent-amber)" />;
    case 'export':
      return <FileCode size={14} color="#06b6d4" />;
    case 'settings':
      return <Sliders size={14} color="var(--text-muted)" />;
    case 'project':
      return <Layers size={14} color="var(--primary)" />;
    default:
      return <Terminal size={14} color="var(--text-secondary)" />;
  }
};

const mapActivityToTab = (type: ActivityType): NavigationTab | null => {
  switch (type) {
    case 'backup':
    case 'migration':
    case 'sync':
      return 'devops';
    case 'audit':
      return 'audit';
    case 'translation':
      return 'translator';
    case 'security':
      return 'security';
    case 'settings':
      return 'settings';
    default:
      return null;
  }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  projectId,
  onNavigate,
  maxDisplay = 20
}) => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const update = (entries: ActivityEntry[]) => {
      let filtered = entries;
      if (projectId) {
        filtered = filtered.filter(e => !e.projectId || e.projectId === projectId);
      }
      setActivities(filtered);
    };

    const unsubscribe = ActivityStore.subscribe(update);
    return unsubscribe;
  }, [projectId]);

  const displayedActivities = activities
    .filter(a => filterType === 'all' || a.type === filterType)
    .slice(0, maxDisplay);

  const handleClear = () => {
    if (window.confirm('Clear all recorded activity logs?')) {
      ActivityStore.clear(projectId);
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-header" style={{ paddingBottom: '12px' }}>
        <div>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="var(--primary)" />
            <span>Workspace Activity Timeline</span>
            {activities.length > 0 && (
              <span className="badge badge-indigo" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                {activities.length}
              </span>
            )}
          </div>
          <div className="card-subtitle">Real-time audit log of operations and engine events</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <Filter size={12} color="var(--text-muted)" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                outline: 'none',
                padding: '2px 0'
              }}
            >
              <option value="all">All Events</option>
              <option value="backup">Backups</option>
              <option value="audit">Audits</option>
              <option value="sync">Syncs</option>
              <option value="translation">Translations</option>
              <option value="security">Security</option>
              <option value="migration">Migrations</option>
            </select>
          </div>

          {activities.length > 0 && (
            <button
              onClick={handleClear}
              className="btn btn-ghost btn-sm"
              title="Clear Activity Log"
              style={{ padding: '4px 6px', color: 'var(--text-muted)' }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {displayedActivities.length === 0 ? (
        <div style={{
          padding: '32px 16px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1
        }}>
          <CheckCircle2 size={28} style={{ opacity: 0.4, marginBottom: '8px', color: 'var(--accent-emerald)' }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            No recent activity recorded
          </div>
          <p style={{ fontSize: '0.75rem', margin: '4px 0 0', maxWidth: '300px' }}>
            Actions like database backups, AST audits, AI translations, and schema syncs will be logged here.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '340px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {displayedActivities.map((entry) => {
            const targetTab = mapActivityToTab(entry.type);
            const isClickable = Boolean(onNavigate && targetTab);

            return (
              <div
                key={entry.id}
                onClick={() => {
                  if (isClickable && targetTab && onNavigate) {
                    onNavigate(targetTab);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'border-color 0.15s ease, transform 0.1s ease',
                  fontSize: '0.8rem'
                }}
                className={isClickable ? 'hover-border' : ''}
              >
                <div style={{
                  padding: '6px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '1px',
                  flexShrink: 0
                }}>
                  {getActivityIcon(entry.type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {entry.title}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {formatRelativeTime(entry.timestamp)}
                    </span>
                  </div>

                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px', lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {entry.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
