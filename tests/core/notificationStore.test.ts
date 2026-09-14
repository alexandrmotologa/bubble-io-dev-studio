import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationStore } from '../../src/core/notifications/notificationStore';

describe('NotificationStore', () => {
  beforeEach(() => {
    NotificationStore.clearAll();
  });

  it('should add notifications and track unread count', () => {
    expect(NotificationStore.getUnreadCount()).toBe(0);

    const notif = NotificationStore.add({
      type: 'success',
      title: 'Snapshot Exported',
      message: 'All records backed up successfully'
    });

    expect(NotificationStore.getUnreadCount()).toBe(1);

    NotificationStore.markAsRead(notif.id);
    expect(NotificationStore.getUnreadCount()).toBe(0);
  });

  it('should mark all notifications as read and allow clearing', () => {
    NotificationStore.add({ type: 'info', title: 'Info 1' });
    NotificationStore.add({ type: 'warn', title: 'Warn 1' });

    expect(NotificationStore.getUnreadCount()).toBe(2);

    NotificationStore.markAllAsRead();
    expect(NotificationStore.getUnreadCount()).toBe(0);

    NotificationStore.clearAll();
    expect(NotificationStore.getUnreadCount()).toBe(0);
  });
});
