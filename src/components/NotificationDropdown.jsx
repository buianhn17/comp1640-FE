import { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { markAllAsRead, markOneAsRead, clearNotifications, addNotification } from '../redux/slices/notificationSlice';
import { connectWebSocket, disconnectWebSocket } from '../services/websocketService';

/* ─── Format thời gian tương đối ────────────────────────── */
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

/* ─── Icon theo type ─────────────────────────────────────── */
const NotifIcon = ({ type }) => {
  if (type === 'NEW_IDEA') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
        <path d="M12 2a7 7 0 0 1 7 7c0 3-1.5 5-3.5 6.5V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.5C6.5 14 5 12 5 9a7 7 0 0 1 7-7z"/>
        <line x1="9" y1="21" x2="15" y2="21"/>
      </svg>
    );
  }
  // NEW_COMMENT
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════ */
const NotificationDropdown = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { messages, unreadCount } = useSelector((s) => s.notifications);
  const { userId } = useSelector((s) => s.auth); // ← LẤY TỪ REDUX
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
    /* ── WebSocket Connection ────────────────────────────── */
    useEffect(() => {
        if (!userId) {
          console.warn('[Notif] No userId found in Redux');
          return;
        }
    
        console.log('[Notif] Connecting WebSocket for userId:', userId);
        
        connectWebSocket(
          userId,
          (notification) => {
            console.log('[Notif] Received:', notification);
            dispatch(addNotification(notification));
          },
          () => console.log('[Notif] ✓ WebSocket connected'),
          (error) => console.error('[Notif] ❌ WebSocket error:', error)
        );
    
        return () => {
          disconnectWebSocket();
        };
      }, [dispatch, userId]);

  /* ── Đóng khi click ngoài ─────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Click vào notification ───────────────────────────── */
  const handleClick = (notif) => {
    if (!notif.isRead) dispatch(markOneAsRead(notif.ideaId));
    setOpen(false);
    if (notif.ideaId) navigate(`/ideas/${notif.ideaId}`);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* ── Bell button ─────────────────────────────────── */}
      <button
        className="main-topbar-notif"
        title="Notifications"
        onClick={() => setOpen((o) => !o)}
        style={{ position: 'relative' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {/* Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            minWidth: 16, height: 16, borderRadius: 8,
            background: '#ef4444', color: '#fff',
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
            border: '2px solid var(--color-background-primary)',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ─────────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 360, maxHeight: 480,
          background: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-tertiary)',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 1000, display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 10px',
            borderBottom: '1px solid var(--color-border-tertiary)',
          }}>
            <span style={{ fontWeight: 500, fontSize: 14, color: 'var(--color-text-primary)' }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: 6, background: '#ef4444', color: '#fff',
                  fontSize: 10, fontWeight: 700, padding: '1px 6px',
                  borderRadius: 10,
                }}>
                  {unreadCount}
                </span>
              )}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  onClick={() => dispatch(markAllAsRead())}
                  style={{
                    fontSize: 11, color: '#2563eb', background: 'none',
                    border: 'none', cursor: 'pointer', padding: '2px 6px',
                    borderRadius: 6, fontWeight: 500,
                  }}
                >
                  Mark all read
                </button>
              )}
              {messages.length > 0 && (
                <button
                  onClick={() => dispatch(clearNotifications())}
                  style={{
                    fontSize: 11, color: '#94a3b8', background: 'none',
                    border: 'none', cursor: 'pointer', padding: '2px 6px',
                    borderRadius: 6,
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {messages.length === 0 ? (
              <div style={{
                padding: '40px 20px', textAlign: 'center',
                color: 'var(--color-text-secondary)', fontSize: 13,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  width="32" height="32" style={{ marginBottom: 8, opacity: 0.4 }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <p>No notifications yet</p>
              </div>
            ) : (
              messages.map((notif, idx) => (
                <button
                  key={notif.ideaId ? `${notif.ideaId}-${idx}` : idx}
                  onClick={() => handleClick(notif)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none',
                    border: 'none', cursor: 'pointer',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--color-border-tertiary)',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    backgroundColor: notif.isRead
                      ? 'transparent'
                      : 'rgba(37,99,235,0.05)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-background-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notif.isRead ? 'transparent' : 'rgba(37,99,235,0.05)'}
                >
                  {/* Icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: notif.type === 'NEW_IDEA' ? '#eff6ff' : '#f0fdf4',
                    color: notif.type === 'NEW_IDEA' ? '#2563eb' : '#16a34a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <NotifIcon type={notif.type} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: 13, fontWeight: notif.isRead ? 400 : 500,
                      color: 'var(--color-text-primary)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {notif.title || 'New notification'}
                    </p>
                    <p style={{
                      margin: '2px 0 0', fontSize: 12,
                      color: 'var(--color-text-secondary)',
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {notif.message}
                    </p>
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4, display: 'block' }}>
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#2563eb', flexShrink: 0, marginTop: 4,
                    }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;