import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getLatestComments } from "../../services/commentService";

// ─────────────────────────────────────────────────────────────
// 🔧 Toggle this to switch between mock data and real API
const USE_MOCK = false;
// ─────────────────────────────────────────────────────────────

/* ── Mock data ─────────────────────────────────────────────── */
const MOCK_COMMENTS_PAGE_0 = [
  { commentId: 1,  ideaId: 10, isAnonymous: false, authorName: "Alice Nguyen",  content: "Great idea! I think implementing this quarterly would double engagement rates across all departments.",                                createdAt: "2025-03-20T09:45:00Z" },
  { commentId: 2,  ideaId:  3, isAnonymous: true,  authorName: null,            content: "I strongly support a four-day workweek trial. Many companies have seen no drop in productivity when tested properly.",              createdAt: "2025-03-19T14:30:00Z" },
  { commentId: 3,  ideaId:  5, isAnonymous: false, authorName: "Bob Tran",      content: "The green commute subsidy is long overdue. We should also add a cycling allowance to encourage more sustainable options.",          createdAt: "2025-03-18T11:10:00Z" },
  { commentId: 4,  ideaId:  1, isAnonymous: false, authorName: "Carol Le",      content: "Automating status reports would save our team at least three hours a week. We've been requesting this for over a year.",            createdAt: "2025-03-17T10:00:00Z" },
  { commentId: 5,  ideaId:  8, isAnonymous: false, authorName: "David Pham",    content: "Knowledge-sharing sessions work best when they're recorded and made available asynchronously for remote team members.",             createdAt: "2025-03-16T15:20:00Z" },
  { commentId: 6,  ideaId:  2, isAnonymous: true,  authorName: null,            content: "The peer-recognition bot concept is excellent — it builds culture without requiring manager involvement.",                           createdAt: "2025-03-15T09:00:00Z" },
  { commentId: 7,  ideaId:  6, isAnonymous: false, authorName: "Eva Hoang",     content: "Mentorship programmes need proper structure, clear goals, and commitment from senior staff to actually deliver value.",             createdAt: "2025-03-14T13:45:00Z" },
  { commentId: 8,  ideaId:  4, isAnonymous: false, authorName: "Frank Vu",      content: "Standardising API documentation will reduce onboarding time for new developers significantly — great initiative.",                  createdAt: "2025-03-13T08:30:00Z" },
  { commentId: 9,  ideaId:  9, isAnonymous: false, authorName: "Grace Dinh",    content: "An anonymous feedback channel is valuable but only if leadership genuinely acts on the input received.",                            createdAt: "2025-03-12T11:00:00Z" },
  { commentId: 10, ideaId:  7, isAnonymous: false, authorName: "Henry Bui",     content: "Centralising vendor invoicing would eliminate the confusion we currently have with duplicate payments and missing approvals.",       createdAt: "2025-03-11T14:00:00Z" },
];

const MOCK_COMMENTS_PAGE_1 = [
  { commentId: 11, ideaId: 10, isAnonymous: false, authorName: "Irene Lam",     content: "Hackathons are a great way to surface hidden talent and cross-team collaboration. Monthly cadence might be too frequent though.",  createdAt: "2025-03-10T10:15:00Z" },
  { commentId: 12, ideaId:  3, isAnonymous: false, authorName: "James Nguyen",  content: "I'm sceptical about the four-day week — our client SLAs are based on five-day availability.",                                      createdAt: "2025-03-09T09:30:00Z" },
  { commentId: 13, ideaId: 11, isAnonymous: true,  authorName: null,            content: "The onboarding checklist redesign is way overdue. New joiners are consistently confused by the current process.",                  createdAt: "2025-03-08T16:00:00Z" },
  { commentId: 14, ideaId:  5, isAnonymous: false, authorName: "Karen Ho",      content: "If the subsidy covers e-scooters as well as public transit, it would be even more impactful for those living further out.",         createdAt: "2025-03-07T11:45:00Z" },
  { commentId: 15, ideaId:  2, isAnonymous: false, authorName: "Leo Phan",      content: "We tried something similar at my last company. The key is keeping the rewards meaningful but not financial.",                      createdAt: "2025-03-06T08:00:00Z" },
];

/* ── Mock service wrapper ──────────────────────────────────── */
const MOCK_PAGES = [MOCK_COMMENTS_PAGE_0, MOCK_COMMENTS_PAGE_1];

const mockGetLatestComments = async (page, size) => {
  await new Promise((r) => setTimeout(r, 450));
  const pageData = MOCK_PAGES[page] ?? [];
  return {
    content:       pageData,
    totalPages:    MOCK_PAGES.length,
    totalElements: MOCK_PAGES.flat().length,
    page,
    size,
  };
};

/* ── Resolved service call ─────────────────────────────────── */
const svcGetLatestComments = USE_MOCK ? mockGetLatestComments : getLatestComments;

/* ═══════════════════════════════════════════════════════════ */

const LatestComments = () => {
  const navigate = useNavigate();

  const [comments,   setComments]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const PAGE_SIZE = 10;

  const fetchComments = useCallback(async (p) => {
    setLoading(true);
    setError(null);
    try {
      const data = await svcGetLatestComments(p, PAGE_SIZE);
      setComments(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
    } catch (err) {
      setError("Failed to load comments.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComments(page); }, [page, fetchComments]);

  const formatDateTime = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleString("en-GB", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div style={{ padding: "24px", maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "#0f172a" }}>
        Latest Comments
      </h1>
      <p style={{ color: "#64748b", marginBottom: 20, fontSize: 14 }}>
        Most recent comments across all ideas
      </p>

      {loading && (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b" }}>
          Loading comments...
        </div>
      )}

      {error && !loading && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
          padding: "12px 16px", color: "#dc2626", marginBottom: 16,
        }}>
          {error}
          <button
            onClick={() => fetchComments(page)}
            style={{ marginLeft: 10, textDecoration: "underline", cursor: "pointer",
              background: "none", border: "none", color: "#dc2626" }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && comments.length === 0 && (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: "40px 0" }}>
          No comments available
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {comments.map((c) => {
          const author  = c.isAnonymous ? "Anonymous" : (c.authorName ?? "—");
          const initial = c.isAnonymous ? "?" : (author[0] ?? "?").toUpperCase();
          return (
            <div
              key={c.commentId}
              style={{
                border: "1px solid #e2e8f0", borderRadius: 10,
                padding: "14px 16px", background: "#fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                cursor: c.ideaId ? "pointer" : "default",
              }}
              onClick={() => c.ideaId && navigate(`/ideas/${c.ideaId}`)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: c.isAnonymous ? "#94a3b8" : "#2563eb",
                  color: "#fff", fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {initial}
                </div>
                <span style={{ fontWeight: 600, fontSize: 13.5, color: "#0f172a" }}>
                  {author}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8" }}>
                  {formatDateTime(c.createdAt)}
                </span>
              </div>

              <p style={{ margin: 0, color: "#374151", fontSize: 14, lineHeight: 1.6 }}>
                {c.content}
              </p>

              {c.ideaId && (
                <p style={{
                  margin: "8px 0 0", fontSize: 12, color: "#94a3b8",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
                    <path d="M12 2a7 7 0 0 1 7 7c0 3-1.5 5-3.5 6.5V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.5C6.5 14 5 12 5 9a7 7 0 0 1 7-7z"/>
                  </svg>
                  Idea #{c.ideaId}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Pagination ─────────────────────────────────────── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid #e2e8f0",
              background: "#fff", cursor: page === 0 ? "not-allowed" : "pointer",
              opacity: page === 0 ? 0.4 : 1, fontSize: 13,
            }}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              style={{
                padding: "6px 12px", borderRadius: 6, fontSize: 13,
                border: `1px solid ${page === i ? "#2563eb" : "#e2e8f0"}`,
                background: page === i ? "#2563eb" : "#fff",
                color: page === i ? "#fff" : "#374151",
                cursor: "pointer",
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages - 1}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid #e2e8f0",
              background: "#fff", cursor: page === totalPages - 1 ? "not-allowed" : "pointer",
              opacity: page === totalPages - 1 ? 0.4 : 1, fontSize: 13,
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default LatestComments;