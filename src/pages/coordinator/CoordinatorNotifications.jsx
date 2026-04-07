import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getAllIdeas } from "../../services/ideaService";
import "../../styles/coordinator.css";

// ─────────────────────────────────────────────────────────────
// 🔧 Toggle this to switch between mock data and real API
const USE_MOCK = false;
// ─────────────────────────────────────────────────────────────

/* ── Mock data ─────────────────────────────────────────────── */
const MOCK_IDEAS = [
  { ideaId: 1,  title: "Automate weekly status reports",        authorId: "u1", authorName: "Alice Nguyen",  isAnonymous: false, submittedAt: "2025-03-20T09:45:00Z" },
  { ideaId: 2,  title: "Introduce peer-recognition bot",        authorId: "u2", authorName: "Bob Tran",      isAnonymous: false, submittedAt: "2025-03-18T08:30:00Z" },
  { ideaId: 3,  title: "Four-day workweek pilot",               authorId: "u3", authorName: "Carol Le",      isAnonymous: true,  submittedAt: "2025-03-15T11:00:00Z" },
  { ideaId: 4,  title: "Standardise API documentation",         authorId: "u1", authorName: "Alice Nguyen",  isAnonymous: false, submittedAt: "2025-03-12T10:15:00Z" },
  { ideaId: 5,  title: "Green commute subsidy",                 authorId: "u4", authorName: "David Pham",    isAnonymous: false, submittedAt: "2025-03-10T08:00:00Z" },
  { ideaId: 6,  title: "Cross-department mentorship programme", authorId: "u5", authorName: "Eva Hoang",     isAnonymous: false, submittedAt: "2025-03-08T13:30:00Z" },
  { ideaId: 7,  title: "Centralise vendor invoicing",           authorId: "u2", authorName: "Bob Tran",      isAnonymous: false, submittedAt: "2025-03-05T09:00:00Z" },
  { ideaId: 8,  title: "Internal knowledge-sharing sessions",   authorId: "u3", authorName: "Carol Le",      isAnonymous: false, submittedAt: "2025-03-01T10:00:00Z" },
  { ideaId: 9,  title: "Anonymous feedback channel",            authorId: "u6", authorName: "Frank Vu",      isAnonymous: true,  submittedAt: "2025-02-25T14:00:00Z" },
  { ideaId: 10, title: "Quarterly hackathon events",            authorId: "u4", authorName: "David Pham",    isAnonymous: false, submittedAt: "2025-02-20T08:00:00Z" },
];

/* ── Mock service wrapper ──────────────────────────────────── */
const mockGetAllIdeas = async () => {
  await new Promise((r) => setTimeout(r, 450));
  return { content: MOCK_IDEAS, totalElements: MOCK_IDEAS.length, totalPages: 1 };
};

/* ── Resolved service call ─────────────────────────────────── */
const svcGetAllIdeas = USE_MOCK ? mockGetAllIdeas : getAllIdeas;

/* ═══════════════════════════════════════════════════════════ */

const FILTERS = [
  { key: "all",    label: "Tất cả"      },
  { key: "unread", label: "Chưa đọc"    },
  { key: "idea",   label: "Ý tưởng mới" },
];

const IdeaIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2a7 7 0 0 1 7 7c0 3-1.5 5-3.5 6.5V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.5C6.5 14 5 12 5 9a7 7 0 0 1 7-7z"/>
    <line x1="9" y1="21" x2="15" y2="21"/>
  </svg>
);

const READ_KEY = "coord_read_notifications";
const getReadSet  = () => new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]"));
const saveReadSet = (set) => localStorage.setItem(READ_KEY, JSON.stringify([...set]));

const CoordinatorNotifications = () => {
  const navigate = useNavigate();
  const user     = useSelector((state) => state.auth.user);

  const [ideas,   setIdeas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(getReadSet());
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await svcGetAllIdeas({ deptId: user?.deptId, size: 50 });
        setIdeas(data?.content ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const notifications = useMemo(() =>
    ideas.map((idea) => ({
      id:     idea.ideaId,
      type:   "idea",
      title:  "Ý tưởng mới được nộp",
      desc:   `${idea.isAnonymous ? "Ẩn danh" : (idea.authorName ?? "Someone")} đã nộp ý tưởng "${idea.title}"`,
      time:   idea.submittedAt
        ? new Date(idea.submittedAt).toLocaleDateString("vi-VN")
        : "—",
      read:   readIds.has(idea.ideaId),
      ideaId: idea.ideaId,
    })), [ideas, readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    switch (filter) {
      case "unread": return notifications.filter((n) => !n.read);
      case "idea":   return notifications.filter((n) => n.type === "idea");
      default:       return notifications;
    }
  }, [filter, notifications]);

  const markRead = (id) => {
    const updated = new Set([...readIds, id]);
    setReadIds(updated);
    saveReadSet(updated);
  };

  const markAllRead = () => {
    const updated = new Set(notifications.map((n) => n.id));
    setReadIds(updated);
    saveReadSet(updated);
  };

  const handleClick = (notif) => {
    markRead(notif.id);
    if (notif.ideaId) navigate(`/ideas/${notif.ideaId}`);
  };

  return (
    <div className="co-page">
      <div className="co-page-header">
        <div>
          <h1 className="co-page-title">
            Thông báo
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 10, fontSize: 13, fontWeight: 700,
                background: "#2563eb", color: "#fff",
                padding: "2px 9px", borderRadius: 20, verticalAlign: "middle",
              }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="co-page-sub">Ý tưởng mới nộp trong department của bạn</p>
        </div>
      </div>

      <div className="co-card">
        <div className="co-card-head" style={{ padding: "12px 16px" }}>
          <div className="co-notif-filters">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`co-filter-btn${filter === f.key ? " co-filter-btn--active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                {f.key === "unread" && unreadCount > 0 && (
                  <span style={{
                    marginLeft: 5,
                    background: filter === "unread" ? "rgba(255,255,255,0.3)" : "#dbeafe",
                    color: filter === "unread" ? "#fff" : "#2563eb",
                    fontSize: 10, fontWeight: 700,
                    padding: "1px 6px", borderRadius: 20,
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
            {unreadCount > 0 && (
              <button className="co-mark-all-btn" onClick={markAllRead}>
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
        </div>

        <div className="co-notif-list">
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b" }}>
              Đang tải...
            </div>
          ) : filtered.length === 0 ? (
            <div className="co-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p>Không có thông báo nào</p>
            </div>
          ) : (
            filtered.map((notif) => (
              <div
                key={notif.id}
                className={`co-notif-item${!notif.read ? " co-notif-item--unread" : ""}`}
                onClick={() => handleClick(notif)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleClick(notif)}
              >
                <div className="co-notif-icon co-notif-icon--idea">
                  <IdeaIcon />
                </div>
                <div className="co-notif-body">
                  <div className="co-notif-title">{notif.title}</div>
                  <div className="co-notif-desc">{notif.desc}</div>
                  <div className="co-notif-time">{notif.time}</div>
                </div>
                {!notif.read && <div className="co-notif-dot" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorNotifications;