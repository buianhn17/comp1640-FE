import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ROLES } from "../../constants/roles";
import {
  getAllIdeas,
  getLatestIdeas,
  getMostPopularIdeas,
} from "../../services/ideaService";
import "../../styles/ideas.css";

const FILTERS = [
  { key: "latest",  label: "Latest"       },
  { key: "popular", label: "Most Popular" },
  { key: "all",     label: "All Ideas"    },
];

// ── MOCK DATA (dùng khi API chưa sẵn sàng) ──────────────────────────────────
const USE_MOCK = false; // đổi thành true để dùng mock, false để gọi API thật

const MOCK_IDEAS = [
  { ideaId: 1, title: "Improve Onboarding Process",       content: "Streamline the onboarding workflow by creating interactive guides and automated email sequences for new staff.",                              isAnonymous: false, authorName: "Nguyen Van An",  submittedAt: "2025-01-15T09:00:00", viewCount: 142, commentCount: 8,  upvotes: 24, downvotes: 2,  categories: ["HR"]         },
  { ideaId: 2, title: "Shift Management Mobile App",       content: "Develop a mobile app so staff can view and swap shifts easily without needing to contact their manager directly.",                          isAnonymous: true,  authorName: null,             submittedAt: "2025-01-20T11:30:00", viewCount: 98,  commentCount: 5,  upvotes: 18, downvotes: 1,  categories: ["Technology"] },
  { ideaId: 3, title: "Operational Cost Optimisation",     content: "Audit recurring vendor contracts and renegotiate terms to reduce operational spend by an estimated 15% this fiscal year.",                  isAnonymous: false, authorName: "Le Van Cuong",   submittedAt: "2025-02-01T08:45:00", viewCount: 76,  commentCount: 3,  upvotes: 12, downvotes: 4,  categories: ["Finance"]    },
  { ideaId: 4, title: "Q1 Marketing Campaign Strategy",    content: "Launch a targeted social-media campaign during Q1 focusing on brand awareness among the 18-35 demographic in three key markets.",          isAnonymous: false, authorName: "Pham Thi Dung",  submittedAt: "2025-02-10T14:20:00", viewCount: 201, commentCount: 12, upvotes: 31, downvotes: 3,  categories: ["Marketing"]  },
  { ideaId: 5, title: "Employee Satisfaction Survey 2025", content: "Run an anonymous pulse survey every quarter to track morale and measure the impact of HR initiatives.",                                    isAnonymous: false, authorName: "Hoang Minh Duc", submittedAt: "2025-02-14T10:00:00", viewCount: 54,  commentCount: 2,  upvotes: 9,  downvotes: 0,  categories: ["HR"]         },
  { ideaId: 6, title: "CI/CD Pipeline Upgrade",            content: "Migrate our build pipeline to GitHub Actions to cut deployment time from 40 min to under 10 min.",                                         isAnonymous: false, authorName: "Vu Thi Huong",   submittedAt: "2025-02-20T16:10:00", viewCount: 167, commentCount: 9,  upvotes: 27, downvotes: 1,  categories: ["Technology"] },
  { ideaId: 7, title: "Dashboard Redesign Initiative",     content: "Redesign the internal analytics dashboard with improved data visualisation and role-based widget customisation.",                           isAnonymous: true,  authorName: null,             submittedAt: "2025-02-28T13:00:00", viewCount: 88,  commentCount: 6,  upvotes: 15, downvotes: 2,  categories: ["Design"]     },
  { ideaId: 8, title: "Internal Communication Platform",   content: "Consolidate Slack, email, and project tools into a single internal communication hub to reduce context-switching.",                        isAnonymous: false, authorName: "Bui Thi Lan",    submittedAt: "2025-03-01T09:30:00", viewCount: 113, commentCount: 7,  upvotes: 20, downvotes: 5,  categories: ["Operations"] },
];

function buildMockPage(filter, page, pageSize) {
  const sorted = [...MOCK_IDEAS];
  if (filter === "popular") {
    sorted.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
  } else {
    sorted.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }
  const total = sorted.length;
  const start = page * pageSize;
  return { content: sorted.slice(start, start + pageSize), totalPages: Math.ceil(total / pageSize), totalElements: total };
}

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IdeaList = () => {
  const user     = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const [ideas,       setIdeas]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [filter,      setFilter]      = useState("latest");
  const [currentPage, setCurrentPage] = useState(0);   // BE dùng 0-based
  const [totalPages,  setTotalPages]  = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const PAGE_SIZE = 6;

  /* ── Fetch ideas theo filter ─────────────────────────────── */
  const fetchIdeas = useCallback(async (f, page) => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (USE_MOCK) {
        // Dùng mock data — xóa block này khi API sẵn sàng
        await new Promise((r) => setTimeout(r, 300));
        data = buildMockPage(f, page, PAGE_SIZE);
      } else if (f === "latest") {
        data = await getLatestIdeas(page, PAGE_SIZE);
      } else if (f === "popular") {
        data = await getMostPopularIdeas(page, PAGE_SIZE);
      } else {
        // "all" — có thể filter thêm theo dept nếu là coordinator
        const params = { page, size: PAGE_SIZE };
        if (user?.role === ROLES.QA_COORDINATOR && user?.deptId) {
          params.deptId = user.deptId;
        }
        data = await getAllIdeas(params);
      }
      // BE trả về Page object: { content, totalPages, totalElements, ... }
      setIdeas(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch (err) {
      setError("Failed to load ideas. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchIdeas(filter, currentPage);
  }, [filter, currentPage, fetchIdeas]);

  /* ── Handlers ────────────────────────────────────────────── */
  const handleFilterChange = (f) => {
    setFilter(f);
    setCurrentPage(0); // reset về trang đầu khi đổi filter
  };

  /* ── Helpers ─────────────────────────────────────────────── */
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "";

  const scoreClass = (upvotes, downvotes) => {
    const s = upvotes - downvotes;
    if (s > 0) return "id-score--pos";
    if (s < 0) return "id-score--neg";
    return "id-score--neu";
  };

  /* ── Stats ───────────────────────────────────────────────── */
  const maxViews = ideas.length > 0 ? Math.max(...ideas.map((i) => i.viewCount ?? 0)) : 0;
  const maxScore = ideas.length > 0 ? Math.max(...ideas.map((i) => (i.upvotes ?? 0) - (i.downvotes ?? 0))) : 0;

  return (
    <div className="id-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="id-page-header">
        <div>
          <h1 className="id-page-title">Idea List</h1>
          <p className="id-page-sub">Explore and manage submitted ideas</p>
        </div>
        {[ROLES.ACADEMIC, ROLES.SUPPORT].includes(user?.role) && (
          <Link to="/submit-idea" className="id-btn id-btn--primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Submit Idea
          </Link>
        )}
      </div>

      {/* ── Stats ──────────────────────────────────────────── */}
      <div className="id-stats-row">
        <div className="id-stat-card">
          <div className="id-stat-icon id-stat-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2a7 7 0 0 1 7 7c0 3-1.5 5-3.5 6.5V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.5C6.5 14 5 12 5 9a7 7 0 0 1 7-7z"/>
              <line x1="9" y1="21" x2="15" y2="21"/>
            </svg>
          </div>
          <div className="id-stat-body">
            <div className="id-stat-label">Total Ideas</div>
            <div className="id-stat-value">{totalElements}</div>
          </div>
        </div>
        <div className="id-stat-card">
          <div className="id-stat-icon id-stat-icon--green">
            <EyeIcon />
          </div>
          <div className="id-stat-body">
            <div className="id-stat-label">Most Viewed</div>
            <div className="id-stat-value">{maxViews}</div>
          </div>
        </div>
        <div className="id-stat-card">
          <div className="id-stat-icon id-stat-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <div className="id-stat-body">
            <div className="id-stat-label">Highest Score</div>
            <div className="id-stat-value">{maxScore > 0 ? `+${maxScore}` : maxScore}</div>
          </div>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="id-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`id-filter-btn${filter === f.key ? " id-filter-btn--active" : ""}`}
            onClick={() => handleFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", alignSelf: "center" }}>
          {totalElements} ideas
        </span>
      </div>

      {/* ── Loading ────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#64748b" }}>
          Loading ideas...
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────── */}
      {error && !loading && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
          padding: "16px 20px", color: "#dc2626", fontSize: 14,
        }}>
          {error}
          <button
            onClick={() => fetchIdeas(filter, currentPage)}
            style={{ marginLeft: 12, textDecoration: "underline", cursor: "pointer", background: "none", border: "none", color: "#dc2626" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Empty ──────────────────────────────────────────── */}
      {!loading && !error && ideas.length === 0 && (
        <div className="id-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2a7 7 0 0 1 7 7c0 3-1.5 5-3.5 6.5V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.5C6.5 14 5 12 5 9a7 7 0 0 1 7-7z"/>
          </svg>
          <p className="id-empty-title">No ideas yet</p>
          <p className="id-empty-sub">Be the first to submit an idea!</p>
        </div>
      )}

      {/* ── Grid ───────────────────────────────────────────── */}
      {!loading && !error && ideas.length > 0 && (
        <div className="id-grid">
          {ideas.map((idea) => {
            const upvotes   = idea.upvotes   ?? 0;
            const downvotes = idea.downvotes ?? 0;
            const score     = upvotes - downvotes;
            const scoreSign = score > 0 ? `+${score}` : `${score}`;
            // BE trả authorName — ẩn nếu isAnonymous
            const author  = idea.isAnonymous ? "Anonymous" : (idea.authorName ?? "—");
            const initial = idea.isAnonymous ? "?" : (author[0] ?? "?").toUpperCase();

            return (
              <div
                key={idea.ideaId}
                className="id-idea-card"
                onClick={() => navigate(`/ideas/${idea.ideaId}`)}
              >
                {idea.categories?.length > 0 && (
                  <span className="id-idea-category">{idea.categories[0]}</span>
                )}
                <Link
                  to={`/ideas/${idea.ideaId}`}
                  className="id-idea-title"
                  onClick={(e) => e.stopPropagation()}
                >
                  {idea.title}
                </Link>
                <div className="id-idea-author">
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: idea.isAnonymous ? "#94a3b8" : "#2563eb",
                    color: "#fff", fontSize: 9, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {initial}
                  </div>
                  {author} · {formatDate(idea.submittedAt)}
                </div>
                <div className="id-idea-footer">
                  <div className="id-idea-meta">
                    <span className="id-idea-meta-item"><EyeIcon /> {idea.viewCount ?? 0}</span>
                    <span className="id-idea-meta-item">
  <ChatIcon /> {idea.commentCount ?? 0}
</span>
                  </div>
                  <span className={`id-score ${scoreClass(upvotes, downvotes)}`}>
                    {score >= 0 ? "▲" : "▼"} {scoreSign}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="id-pagination">
          <button
            className="id-page-btn id-page-btn--nav"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => p - 1)}
            style={{ opacity: currentPage === 0 ? 0.4 : 1 }}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`id-page-btn${currentPage === i ? " id-page-btn--active" : ""}`}
              onClick={() => setCurrentPage(i)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="id-page-btn id-page-btn--nav"
            disabled={currentPage === totalPages - 1}
            onClick={() => setCurrentPage((p) => p + 1)}
            style={{ opacity: currentPage === totalPages - 1 ? 0.4 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default IdeaList;