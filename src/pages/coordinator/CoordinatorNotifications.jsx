import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { markOneAsRead, markAllAsRead, clearNotifications } from '../../redux/slices/notificationSlice';
import '../../styles/coordinator.css';

/* ─── Format ngày ─────────────────────────────────────────── */
const formatDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'Vừa xong';
  if (mins  < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
};

/* ─── Type label ─────────────────────────────────────────── */
const TYPE_CONFIG = {
  NEW_IDEA: {
    label: 'New Idea',
    bg: '#eff6ff', color: '#2563eb',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
        <path d="M12 2a7 7 0 0 1 7 7c0 3-1.5 5-3.5 6.5V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.5C6.5 14 5 12 5 9a7 7 0 0 1 7-7z"/>
        <line x1="9" y1="21" x2="15" y2="21"/>
      </svg>
    ),
  },
  NEW_COMMENT: {
    label: 'New Comment',
    bg: '#f0fdf4', color: '#16a34a',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
};

/* ═══════════════════════════════════════════════════════════ */
const CoordinatorNotifications = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { messages, unreadCount } = useSelector((s) => s.notifications);

  const handleClick = (notif) => {
    if (!notif.isRead) dispatch(markOneAsRead(notif.ideaId));
    if (notif.ideaId) navigate(`/ideas/${notif.ideaId}`);
  };

  return (
    <div className="co-page">
      {/* ── Header ── */}
      <div className="co-page-header">
        <div>
          <h1 className="co-page-title">Notifications</h1>
          <p className="co-page-sub">
            Thông báo về ý tưởng và bình luận trong department của bạn
          </p>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button
              onClick={() => dispatch(markAllAsRead())}
              style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 13,
                background: '#eff6ff', color: '#2563eb',
                border: '1px solid #bfdbfe', cursor: 'pointer', fontWeight: 500,
              }}
            >
              ✓ Đánh dấu tất cả đã đọc
            </button>
          )}
          {messages.length > 0 && (
            <button
              onClick={() => dispatch(clearNotifications())}
              style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 13,
                background: '#f8fafc', color: '#64748b',
                border: '1px solid #e2e8f0', cursor: 'pointer',
              }}
            >
              Xoá tất cả
            </button>
          )}
        </div>
      </div>

      {/* ── Summary bar ── */}
      {messages.length > 0 && (
        <div style={{
          display: 'flex', gap: 16, marginBottom: 20,
          padding: '12px 16px', background: '#f8fafc',
          borderRadius: 10, border: '1px solid #e2e8f0',
          fontSize: 13, color: '#64748b',
        }}>
          <span>Tổng: <strong style={{ color: '#0f172a' }}>{messages.length}</strong></span>
          <span>Chưa đọc: <strong style={{ color: '#2563eb' }}>{unreadCount}</strong></span>
          <span>Đã đọc: <strong style={{ color: '#16a34a' }}>{messages.length - unreadCount}</strong></span>
        </div>
      )}

      {/* ── Empty ── */}
      {messages.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          color: '#94a3b8',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
            width="48" height="48" style={{ marginBottom: 12, opacity: 0.4 }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <p style={{ fontWeight: 500, fontSize: 15, margin: 0 }}>Chưa có thông báo nào</p>
          <p style={{ fontSize: 13, margin: '6px 0 0' }}>
            Thông báo sẽ xuất hiện khi có ý tưởng mới trong department của bạn.
          </p>
        </div>
      )}

      {/* ── List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((notif, idx) => {
          const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.NEW_IDEA;
          return (
            <div
              key={notif.ideaId ? `${notif.ideaId}-${idx}` : idx}
              onClick={() => handleClick(notif)}
              style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
                border: '1px solid',
                borderColor: notif.isRead ? '#e2e8f0' : '#bfdbfe',
                background: notif.isRead ? '#fff' : '#f0f7ff',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: cfg.bg, color: cfg.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {cfg.icon}
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    background: cfg.bg, color: cfg.color,
                    padding: '1px 8px', borderRadius: 10,
                  }}>
                    {cfg.label}
                  </span>
                  {!notif.isRead && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: '#2563eb',
                      background: '#dbeafe', padding: '1px 6px', borderRadius: 8,
                    }}>
                      Mới
                    </span>
                  )}
                </div>

                <p style={{
                  margin: 0, fontSize: 14, fontWeight: notif.isRead ? 400 : 500,
                  color: '#0f172a',
                }}>
                  {notif.title || 'Thông báo mới'}
                </p>

                {notif.message && (
                  <p style={{
                    margin: '4px 0 0', fontSize: 13, color: '#64748b',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {notif.message}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
                  <span title={formatDate(notif.createdAt)}>
                    🕐 {timeAgo(notif.createdAt)}
                  </span>
                  {notif.ideaId && (
                    <span style={{ color: '#2563eb' }}>→ Xem ý tưởng</span>
                  )}
                </div>
              </div>

              {/* Unread dot */}
              {!notif.isRead && (
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#2563eb', flexShrink: 0, marginTop: 6,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoordinatorNotifications;