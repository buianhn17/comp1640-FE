import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { getAllIdeas } from "../../services/ideaService";
import { getCurrentAcademicYear } from "../../services/academicYearService";
import "../../styles/coordinator.css";

// ─────────────────────────────────────────────────────────────
// 🔧 Toggle this to switch between mock data and real API
const USE_MOCK = false;
// ─────────────────────────────────────────────────────────────

/* ── Mock data ─────────────────────────────────────────────── */
const MOCK_CURRENT_YEAR = {
  yearId: 1,
  yearLabel: "2024 – 2025",
  ideaClosureDate: "2025-03-31",
  finalClosureDate: "2025-04-30",
  ideaOpen: true,
  commentOpen: true,
};

const MOCK_IDEAS = [
  { ideaId: 1,  title: "Automate weekly status reports",        authorId: "u1", authorName: "Alice Nguyen",  isAnonymous: false, submittedAt: "2025-01-05T08:00:00Z", upvotes: 12, downvotes: 1 },
  { ideaId: 2,  title: "Introduce peer-recognition bot",        authorId: "u2", authorName: "Bob Tran",      isAnonymous: false, submittedAt: "2025-01-12T09:30:00Z", upvotes:  8, downvotes: 0 },
  { ideaId: 3,  title: "Four-day workweek pilot",               authorId: "u3", authorName: "Carol Le",      isAnonymous: true,  submittedAt: "2025-01-18T10:00:00Z", upvotes: 22, downvotes: 4 },
  { ideaId: 4,  title: "Standardise API documentation",         authorId: "u1", authorName: "Alice Nguyen",  isAnonymous: false, submittedAt: "2025-01-25T11:15:00Z", upvotes:  6, downvotes: 1 },
  { ideaId: 5,  title: "Green commute subsidy",                 authorId: "u4", authorName: "David Pham",    isAnonymous: false, submittedAt: "2025-02-03T08:45:00Z", upvotes: 15, downvotes: 2 },
  { ideaId: 6,  title: "Cross-department mentorship programme", authorId: "u5", authorName: "Eva Hoang",     isAnonymous: false, submittedAt: "2025-02-10T13:00:00Z", upvotes:  9, downvotes: 0 },
  { ideaId: 7,  title: "Centralise vendor invoicing",           authorId: "u2", authorName: "Bob Tran",      isAnonymous: false, submittedAt: "2025-02-17T09:00:00Z", upvotes:  5, downvotes: 1 },
  { ideaId: 8,  title: "Internal knowledge-sharing sessions",   authorId: "u3", authorName: "Carol Le",      isAnonymous: false, submittedAt: "2025-02-24T10:30:00Z", upvotes: 11, downvotes: 0 },
  { ideaId: 9,  title: "Anonymous feedback channel",            authorId: "u6", authorName: "Frank Vu",      isAnonymous: true,  submittedAt: "2025-03-03T14:00:00Z", upvotes:  7, downvotes: 3 },
  { ideaId: 10, title: "Quarterly hackathon events",            authorId: "u4", authorName: "David Pham",    isAnonymous: false, submittedAt: "2025-03-10T08:00:00Z", upvotes: 18, downvotes: 1 },
  { ideaId: 11, title: "Redesign onboarding checklist",         authorId: "u5", authorName: "Eva Hoang",     isAnonymous: false, submittedAt: "2025-03-15T11:00:00Z", upvotes:  4, downvotes: 0 },
  { ideaId: 12, title: "Flexible remote-work policy update",    authorId: "u1", authorName: "Alice Nguyen",  isAnonymous: false, submittedAt: "2025-03-20T09:45:00Z", upvotes: 20, downvotes: 2 },
];

/* ── Mock service wrappers ─────────────────────────────────── */
const mockGetCurrentAcademicYear = async () => {
  await new Promise((r) => setTimeout(r, 300));
  return MOCK_CURRENT_YEAR;
};

const mockGetAllIdeas = async () => {
  await new Promise((r) => setTimeout(r, 500));
  return { content: MOCK_IDEAS, totalElements: MOCK_IDEAS.length, totalPages: 1 };
};

/* ── Resolved service calls ────────────────────────────────── */
const svcGetCurrentAcademicYear = USE_MOCK ? mockGetCurrentAcademicYear : getCurrentAcademicYear;
const svcGetAllIdeas            = USE_MOCK ? mockGetAllIdeas            : getAllIdeas;

/* ═══════════════════════════════════════════════════════════ */

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 8, padding: "8px 14px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.09)", fontSize: 13,
    }}>
      <p style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>{label}</p>
      <p style={{ margin: "3px 0 0", color: "#2563eb" }}>{payload[0].value} ý tưởng</p>
    </div>
  );
};

const CoordinatorDashboard = () => {
  const user = useSelector((state) => state.auth.user);

  const [ideas,       setIdeas]       = useState([]);
  const [currentYear, setCurrentYear] = useState(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [year, ideasData] = await Promise.all([
          svcGetCurrentAcademicYear(),
          svcGetAllIdeas({ deptId: user?.deptId, size: 100 }),
        ]);
        setCurrentYear(year);
        setIdeas(ideasData?.content ?? []);
      } catch (err) {
        console.error("CoordinatorDashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [user]);

  /* ── Stats ───────────────────────────────────────────────── */
  const totalIdeas        = ideas.length;
  const totalContributors = new Set(ideas.map((i) => i.authorId).filter(Boolean)).size;
  const anonymousCount    = ideas.filter((i) => i.isAnonymous).length;

  /* ── Monthly trend ───────────────────────────────────────── */
  const monthlyData = (() => {
    const map = {};
    ideas.forEach((idea) => {
      if (!idea.submittedAt) return;
      const d   = new Date(idea.submittedAt);
      const key = `T${d.getMonth() + 1}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([month, count]) => ({ month, count }))
      .slice(-6);
  })();

  /* ── Recent 5 ideas ──────────────────────────────────────── */
  const recentIdeas = [...ideas]
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 5);

  const deptName  = user?.deptName || (USE_MOCK ? "Engineering" : "Department");
  const yearLabel = currentYear?.yearLabel || "N/A";

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

  return (
    <div className="co-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="co-page-header">
        <div>
          <h1 className="co-page-title">
            Dashboard — {deptName}
          </h1>
          <p className="co-page-sub">Tổng quan ý tưởng trong phạm vi department của bạn</p>
        </div>
        <span style={{
          fontSize: 12, color: "#64748b", background: "#f1f5f9",
          padding: "5px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
        }}>
          {yearLabel}
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
          Đang tải dữ liệu...
        </div>
      ) : (
        <>
          {/* ── Stat cards ─────────────────────────────────── */}
          <div className="co-stats-grid">
            <div className="co-stat-card">
              <div className="co-stat-head">
                <span className="co-stat-label">Tổng ý tưởng</span>
                <span className="co-stat-icon co-stat-icon--blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2a7 7 0 0 1 7 7c0 3-1.5 5-3.5 6.5V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.5C6.5 14 5 12 5 9a7 7 0 0 1 7-7z"/>
                    <line x1="9" y1="21" x2="15" y2="21"/>
                  </svg>
                </span>
              </div>
              <div className="co-stat-value">{totalIdeas}</div>
              <div className="co-stat-footer">Trong phòng ban</div>
            </div>

            <div className="co-stat-card">
              <div className="co-stat-head">
                <span className="co-stat-label">Người đóng góp</span>
                <span className="co-stat-icon co-stat-icon--green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </span>
              </div>
              <div className="co-stat-value">{totalContributors}</div>
              <div className="co-stat-footer">Staff đã nộp ý tưởng</div>
            </div>

            <div className="co-stat-card">
              <div className="co-stat-head">
                <span className="co-stat-label">Ẩn danh</span>
                <span className="co-stat-icon co-stat-icon--amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </span>
              </div>
              <div className="co-stat-value">{anonymousCount}</div>
              <div className="co-stat-footer">Ý tưởng ẩn danh</div>
            </div>

            <div className="co-stat-card">
              <div className="co-stat-head">
                <span className="co-stat-label">Năm học</span>
                <span className="co-stat-icon co-stat-icon--purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </span>
              </div>
              <div className="co-stat-value" style={{ fontSize: 16 }}>{yearLabel}</div>
              <div className="co-stat-footer">
                {currentYear?.ideaOpen ? "✅ Đang mở" : "🔒 Đã đóng"}
              </div>
            </div>
          </div>

          {/* ── Chart + top contributors ────────────────────── */}
          <div className="co-row">
            <div className="co-card">
              <div className="co-card-head">
                <span className="co-card-title">Ý tưởng theo tháng</span>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{monthlyData.length} tháng</span>
              </div>
              {monthlyData.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8" }}>
                  Chưa có dữ liệu
                </div>
              ) : (
                <div className="co-chart-wrap" style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} barSize={28}
                      margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f0f7ff" }} />
                      <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="co-card">
              <div className="co-card-head">
                <span className="co-card-title">Top đóng góp</span>
              </div>
              <div className="co-category-list">
                {(() => {
                  const countMap = {};
                  ideas.forEach((i) => {
                    if (i.isAnonymous || !i.authorName) return;
                    countMap[i.authorName] = (countMap[i.authorName] || 0) + 1;
                  });
                  return Object.entries(countMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([name, count]) => (
                      <div key={name} className="co-category-item">
                        <span className="co-category-name">{name}</span>
                        <span className="co-category-count">{count} ý tưởng</span>
                      </div>
                    ));
                })()}
                {ideas.filter((i) => !i.isAnonymous).length === 0 && (
                  <div style={{ color: "#94a3b8", fontSize: 13, padding: "12px 0" }}>
                    Chưa có dữ liệu
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Recent ideas table ─────────────────────────── */}
          <div className="co-card">
            <div className="co-card-head">
              <span className="co-card-title">Ý tưởng gần đây</span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>5 ý tưởng mới nhất</span>
            </div>
            <div className="co-card-body" style={{ overflowX: "auto" }}>
              {recentIdeas.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", color: "#94a3b8" }}>
                  Chưa có ý tưởng nào
                </div>
              ) : (
                <table className="co-table">
                  <thead>
                    <tr>
                      <th>Tiêu đề</th>
                      <th>Tác giả</th>
                      <th>Ngày nộp</th>
                      <th>Upvotes</th>
                      <th>Downvotes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentIdeas.map((idea) => (
                      <tr key={idea.ideaId}>
                        <td style={{
                          maxWidth: 260, overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap",
                          fontWeight: 500, color: "#0f172a",
                        }}>
                          {idea.title}
                        </td>
                        <td>{idea.isAnonymous ? "Ẩn danh" : (idea.authorName ?? "—")}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{formatDate(idea.submittedAt)}</td>
                        <td>{idea.upvotes ?? 0}</td>
                        <td>{idea.downvotes ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CoordinatorDashboard;