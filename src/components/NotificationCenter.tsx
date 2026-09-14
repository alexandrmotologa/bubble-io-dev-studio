import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  ExternalLink
} from 'lucide-react';
import { NotificationStore, NotificationItem } from '../core/notifications/notificationStore';
import { NavigationTab } from '../types';

interface NotificationCenterProps {
  onNavigate?: (tab: NavigationTab) => void;
}

const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getNotificationIcon = (type: NotificationItem['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 size={16} color="var(--accent-emerald)" />;
    case 'error':
      return <XCircle size={16} color="var(--accent-danger, #ef4444)" />;
    case 'warn':
      return <AlertTriangle size={16} color="var(--accent-amber)" />;
    default:
      return <Info size={16} color="var(--accent-cyan)" />;
  }
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = NotificationStore.subscribe((items) => {
      setNotifications(items);
    });
    return unsubscribe;
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = unreadOnly
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleMarkAllRead = () => {
    NotificationStore.markAllAsRead();
  };

  const handleClearAll = () => {
    NotificationStore.clearAll();
  };

  const handleItemClick = (item: NotificationItem) => {
    if (!item.read) {
      NotificationStore.markAsRead(item.id);
    }
    if (item.targetTab && onNavigate) {
      onNavigate(item.targetTab as NavigationTab);
      setIsOpen(false);
    }
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost"
        style={{
          position: 'relative',
          padding: '7px 9px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-secondary)'
        }}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              minWidth: '16px',
              height: '16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            maxHeight: '480px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-active)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="badge badge-indigo" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="btn btn-ghost btn-sm"
                  title="Mark all as read"
                  style={{ padding: '4px 6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                >
                  <CheckCheck size={14} />
                  <span>Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="btn btn-ghost btn-sm"
                  title="Clear all"
                  style={{ padding: '4px 6px', color: 'var(--text-muted)' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Subheader */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '8px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-input)'
            }}
          >
            <button
              onClick={() => setUnreadOnly(false)}
              className={`btn btn-sm ${!unreadOnly ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setUnreadOnly(true)}
              className={`btn btn-sm ${unreadOnly ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '3px 10px', fontSize: '0.75rem' }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '360px',
              padding: '6px 8px'
            }}
          >
            {filteredNotifications.length === 0 ? (
              <div
                style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}
              >
                <CheckCircle2 size={32} style={{ opacity: 0.3, margin: '0 auto 8px', color: 'var(--accent-emerald)' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>All caught up!</div>
                <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>No new notifications right now.</div>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    margin: '4px 0',
                    borderRadius: 'var(--radius-md)',
                    background: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
                    border: `1px solid ${n.read ? 'transparent' : 'rgba(99, 102, 241, 0.25)'}`,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  className="hover-bg"
                >
                  <div style={{ marginTop: '2px', flexShrink: 0 }}>
                    {getNotificationIcon(n.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.825rem',
                        fontWeight: n.read ? 600 : 700,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {n.title}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {formatRelativeTime(n.timestamp)}
                      </span>
                    </div>

                    {n.message && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        margin: '3px 0 0',
                        lineHeight: 1.4,
                        wordBreak: 'break-word'
                      }}>
                        {n.message}
                      </p>
                    )}

                    {n.actionLabel && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.725rem',
                        color: 'var(--primary)',
                        marginTop: '4px',
                        fontWeight: 600
                      }}>
                        {n.actionLabel}
                        <ExternalLink size={10} />
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      NotificationStore.delete(n.id);
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{
                      padding: '2px',
                      opacity: 0.5,
                      flexShrink: 0,
                      color: 'var(--text-muted)'
                    }}
                    title="Dismiss"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
