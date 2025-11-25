'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './admin.module.css';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read: string | null;
}

export default function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/messages');
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      loadMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await fetch(`/api/admin/messages?id=${id}`, { method: 'DELETE' });
      loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className={styles.contentSection}>
      <div className={styles.contentHeader}>
        <h2 className={styles.contentTitle}>
          Messages {unreadCount > 0 && <span style={{ color: '#dc2626' }}>({unreadCount} unread)</span>}
        </h2>
      </div>

      {isLoading ? (
        <div className={`type-serif-italic ${styles.emptyState}`}>Loading messages...</div>
      ) : messages.length === 0 ? (
        <div className={`type-serif-italic ${styles.emptyState}`}>No messages yet</div>
      ) : (
        <div className={styles.listGrid}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={styles.formBox}
              style={{
                opacity: msg.read ? 0.7 : 1,
                borderLeft: msg.read ? '1px solid var(--border-light)' : '3px solid var(--foreground)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div className={styles.listItemTitle}>{msg.name}</div>
                  <a href={`mailto:${msg.email}`} className={`type-sans ${styles.listItemMeta}`} style={{ textDecoration: 'underline' }}>
                    {msg.email}
                  </a>
                </div>
                <div className={`type-sans ${styles.listItemMeta}`}>
                  {formatDate(msg.createdAt)}
                </div>
              </div>

              <div
                className={styles.listItemBody}
                style={{
                  whiteSpace: expandedId === msg.id ? 'pre-wrap' : 'nowrap',
                  overflow: expandedId === msg.id ? 'visible' : 'hidden',
                  textOverflow: expandedId === msg.id ? 'unset' : 'ellipsis',
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
              >
                {msg.message}
              </div>

              <div className={styles.buttonGroup} style={{ marginTop: '0.75rem' }}>
                {!msg.read && (
                  <button
                    onClick={() => handleMarkRead(msg.id)}
                    className={`type-sans ${styles.button} ${styles.buttonSmall}`}
                  >
                    Mark Read
                  </button>
                )}
                <button
                  onClick={() => handleDelete(msg.id)}
                  className={`type-sans ${styles.buttonDanger} ${styles.buttonSmall}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
