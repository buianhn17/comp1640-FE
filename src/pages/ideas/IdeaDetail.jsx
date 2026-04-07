import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ROLES } from "../../constants/roles";
import { getIdeaById } from "../../services/ideaService";
import { getCommentsByIdea, addComment as addCommentApi } from "../../services/commentService";
import { getIdeaVotes, voteOnIdea, deleteVote } from "../../services/voteService";
import { getDocumentsByIdea } from "../../services/documentService";
import "../../styles/ideas.css";

// ── MOCK DATA (dùng khi API chưa sẵn sàng) ──────────────────────────────────
const USE_MOCK = false; // đổi thành true để dùng mock, false để gọi API thật

const MOCK_IDEAS = {
  "1": { ideaId: 1, title: "Improve Onboarding Process",       content: "Streamline the onboarding workflow by creating interactive guides, automated email sequences, and a buddy-system pairing new staff with experienced mentors. This reduces time-to-productivity from 3 weeks to under 1 week.", isAnonymous: false, authorName: "Nguyen Van An",  authorId: 1, submittedAt: "2025-01-15T09:00:00", viewCount: 142, upvotes: 24, downvotes: 2, termsAccepted: true, isDisabled: false, categories: ["HR"]         },
  "2": { ideaId: 2, title: "Shift Management Mobile App",       content: "Develop a mobile app so staff can view, swap, and request changes to their shifts without needing to contact their manager directly. Includes push notifications and conflict detection.", isAnonymous: true,  authorName: null,             authorId: 2, submittedAt: "2025-01-20T11:30:00", viewCount: 98,  upvotes: 18, downvotes: 1, termsAccepted: true, isDisabled: false, categories: ["Technology"] },
  "3": { ideaId: 3, title: "Operational Cost Optimisation",     content: "Audit all recurring vendor contracts and renegotiate terms where market rates have fallen. Estimated savings of 15% on operational spend this fiscal year based on benchmarking analysis.",            isAnonymous: false, authorName: "Le Van Cuong",   authorId: 3, submittedAt: "2025-02-01T08:45:00", viewCount: 76,  upvotes: 12, downvotes: 4, termsAccepted: true, isDisabled: false, categories: ["Finance"]    },
  "4": { ideaId: 4, title: "Q1 Marketing Campaign Strategy",    content: "Launch a targeted social-media campaign during Q1 focusing on brand awareness among the 18-35 demographic in three key markets. Includes influencer partnerships and retargeting ads.",            isAnonymous: false, authorName: "Pham Thi Dung",  authorId: 4, submittedAt: "2025-02-10T14:20:00", viewCount: 201, upvotes: 31, downvotes: 3, termsAccepted: true, isDisabled: false, categories: ["Marketing"]  },
};

const MOCK_COMMENTS = {
  "1": [
    { commentId: 1, content: "Great idea! We had a similar onboarding issue last year and this would have saved weeks.",    isAnonymous: false, authorName: "Tran Thi Binh",  createdAt: "2025-01-16T10:00:00" },
    { commentId: 2, content: "I support this. Maybe we can pilot it with the next cohort in March?",                       isAnonymous: true,  authorName: null,              createdAt: "2025-01-17T14:30:00" },
    { commentId: 3, content: "The buddy-system part is key. Strong +1 from the engineering team.",                         isAnonymous: false, authorName: "Hoang Minh Duc", createdAt: "2025-01-18T09:15:00" },
  ],
  "2": [
    { commentId: 4, content: "Shift swaps are a nightmare right now. This app would be a game changer.",                   isAnonymous: true,  authorName: null,              createdAt: "2025-01-21T08:00:00" },
    { commentId: 5, content: "Push notifications are essential. Without them staff will just ignore it.",                  isAnonymous: false, authorName: "Dang Quoc Khai", createdAt: "2025-01-22T11:45:00" },
  ],
  "3": [
    { commentId: 6, content: "We should start with the 3 largest contracts. That alone covers most of the savings.",       isAnonymous: false, authorName: "Vu Thi Huong",   createdAt: "2025-02-02T10:00:00" },
  ],
  "4": [
    { commentId: 7,  content: "Love the influencer angle. Data shows it converts 3x better for our target age group.",    isAnonymous: false, authorName: "Nguyen Van An",  createdAt: "2025-02-11T09:00:00" },
    { commentId: 8,  content: "What budget are we allocating? This needs a proper media plan.",                            isAnonymous: true,  authorName: null,              createdAt: "2025-02-11T11:30:00" },
    { commentId: 9,  content: "Retargeting is the right call. Our click-through on retargeted ads is 4% vs 0.8% cold.",   isAnonymous: false, authorName: "Bui Thi Lan",    createdAt: "2025-02-12T15:00:00" },
  ],
};

const MOCK_DOCUMENTS = {
  "1": [{ docId: 1, fileName: "onboarding_proposal.pdf",   filePath: "#", fileSizeKb: 1240 }],
  "2": [],
  "3": [{ docId: 3, fileName: "cost_analysis.xlsx",        filePath: "#", fileSizeKb: 870  }],
  "4": [{ docId: 4, fileName: "q1_campaign_deck.pptx",     filePath: "#", fileSizeKb: 5120 }],
};

const MOCK_VOTES = {
  "1": { ideaId: 1, upvotes: 24, downvotes: 2, userVote: null },
  "2": { ideaId: 2, upvotes: 18, downvotes: 1, userVote: null },
  "3": { ideaId: 3, upvotes: 12, downvotes: 4, userVote: null },
  "4": { ideaId: 4, upvotes: 31, downvotes: 3, userVote: null },
};

const IdeaDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const fetchedRef = useRef(false);
  /* ── State ───────────────────────────────────────────────── */
  const [idea,      setIdea]      = useState(null);
  const [comments,  setComments]  = useState([]);
  const [vote,      setVote]      = useState(null);   // { ideaId, upvotes, downvotes, userVote }
  const [documents, setDocuments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const [commentText,    setCommentText]    = useState("");
  const [isAnonymousCmt, setAnonymousCmt]   = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [votingLoading,  setVotingLoading]  = useState(false);

  /* ── Fetch tất cả data cùng lúc ─────────────────────────── */
  useEffect(() => {
    if (fetchedRef.current) return;   // 🔥 chặn chạy lần 2
    fetchedRef.current = true;
  
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        if (USE_MOCK) {
          // Dùng mock data — xóa block này khi API sẵn sàng
          await new Promise((r) => setTimeout(r, 350));
          const ideaData = MOCK_IDEAS[id] ?? MOCK_IDEAS["1"];
          setIdea(ideaData);
          setComments(MOCK_COMMENTS[id] ?? []);
          setDocuments(MOCK_DOCUMENTS[id] ?? []);
          if (user) setVote(MOCK_VOTES[id] ?? null);
        } else {
          const [ideaData, commentData, docsData] = await Promise.all([
            getIdeaById(id),
            getCommentsByIdea(id),
            getDocumentsByIdea(id),
          ]);
          setIdea(ideaData);
          setComments(commentData ?? []);
          setDocuments(docsData ?? []);

          // Vote chỉ fetch khi đã đăng nhập
          if (user) {
            try {
              const voteData = await getIdeaVotes(id);
              setVote(voteData);
            } catch {
              // Chưa vote → bỏ qua lỗi
            }
          }
        }
      } catch (err) {
        setError("Failed to load idea. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, user]);

  /* ── Helpers ─────────────────────────────────────────────── */
  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const formatDateTime = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  /* ── Vote handler ────────────────────────────────────────── */
  const handleVote = async (voteType) => {
    if (!user || user.role !== ROLES.STAFF) return;
    if (idea?.authorId === user?.userId) {
      alert("You cannot vote on your own idea");
      return;
    }
    setVotingLoading(true);
    try {
      // Nếu đã vote cùng loại → xoá vote (toggle off)
      if (vote?.userVote === voteType) {
        await deleteVote(id);
        const updated = await getIdeaVotes(id);
        setVote(updated);
      } else {
        // Vote mới hoặc đổi vote
        const updated = await voteOnIdea(id, { voteType });
        setVote(updated);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Vote failed");
    } finally {
      setVotingLoading(false);
    }
  };

  /* ── Comment handler ─────────────────────────────────────── */
  const handleComment = async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      const newComment = await addCommentApi(id, {
        content:     commentText,
        isAnonymous: isAnonymousCmt,
      });
      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
      setAnonymousCmt(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  /* ── Loading / Error states ──────────────────────────────── */
  if (loading) {
    return (
      <div className="id-page">
        <div style={{ textAlign: "center", padding: "80px 0", color: "#64748b" }}>
          Loading idea...
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="id-page">
        <div className="id-access-denied">{error || "Idea not found."}</div>
      </div>
    );
  }

  /* ── Derived values ─────────────────────────────────────── */
  const upvotes   = vote?.upvotes   ?? idea.upvotes   ?? 0;
  const downvotes = vote?.downvotes ?? idea.downvotes ?? 0;
  const score     = upvotes - downvotes;
  const scoreSign = score > 0 ? `+${score}` : `${score}`;
  const scoreCls  = score > 0 ? "id-score--pos" : score < 0 ? "id-score--neg" : "id-score--neu";

  const authorName    = idea.isAnonymous ? "Anonymous" : (idea.authorName ?? "—");
  const authorInitial = idea.isAnonymous ? "?" : (authorName[0] ?? "?").toUpperCase();

  const commentClosed = !idea.termsAccepted || idea.isDisabled;
  const canComment =
  user?.role === ROLES.ACADEMIC ||
  user?.role === ROLES.SUPPORT ||
  user?.role === ROLES.QA_COORDINATOR;

const canVote =
  user?.role === ROLES.ACADEMIC ||
  user?.role === ROLES.SUPPORT;

  const sortedComments = [...comments].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="id-page">
      {/* ── Back button ────────────────────────────────────── */}
      <div>
        <button className="id-btn id-btn--ghost" onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back
        </button>
      </div>

      {/* ── Hero card ──────────────────────────────────────── */}
      <div className="id-detail-hero">
        <div className="id-detail-hero-top">
          <div className="id-detail-badges">
            {idea.categories?.length > 0 && (
              <span className="id-detail-category">{idea.categories[0]}</span>
            )}
            {idea.isAnonymous && (
              <span className="id-detail-anon">Anonymous</span>
            )}
            <span className={`id-score ${scoreCls}`} style={{ marginLeft: "auto" }}>
              {score >= 0 ? "▲" : "▼"} {scoreSign}
            </span>
          </div>
          <h1 className="id-detail-title">{idea.title}</h1>
          <div className="id-detail-author-row">
            <div className="id-detail-avatar"
              style={{ background: idea.isAnonymous ? "#94a3b8" : "#2563eb" }}>
              {authorInitial}
            </div>
            <div>
              <div className="id-detail-author-name">{authorName}</div>
              <div className="id-detail-author-date">{formatDate(idea.submittedAt)}</div>
            </div>
          </div>
        </div>

        {/* Content — BE field là "content" */}
        <div className="id-detail-desc">{idea.content}</div>

        {/* Documents/Attachments */}
        {documents.length > 0 && (
          <div className="id-detail-attachments">
            <div className="id-attachment-label">Attachments</div>
            {documents.map((doc) => (
              <a key={doc.docId} href={doc.filePath} target="_blank" rel="noreferrer" className="id-attachment-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                {doc.fileName} ({doc.fileSizeKb} KB)
              </a>
            ))}
          </div>
        )}

        {/* Stat bar + vote */}
        <div className="id-detail-stat-bar">
          <div className="id-detail-meta">
            <span className="id-detail-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {idea.viewCount ?? 0} views
            </span>
            <span className="id-detail-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {comments.length} comments
            </span>
          </div>

          {canVote && (
            <div className="id-vote-group">
              <button
                className={`id-vote-btn id-vote-btn--up${vote?.userVote === "UPVOTE" ? " id-vote-btn--active" : ""}`}
                onClick={() => handleVote("UPVOTE")}
                disabled={votingLoading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
                Upvote · {upvotes}
              </button>
              <button
                className={`id-vote-btn id-vote-btn--down${vote?.userVote === "DOWNVOTE" ? " id-vote-btn--active" : ""}`}
                onClick={() => handleVote("DOWNVOTE")}
                disabled={votingLoading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
                Downvote · {downvotes}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Comments ───────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Comments
            <span style={{
              marginLeft: 8, fontSize: 12, background: "#e2e8f0", color: "#475569",
              padding: "2px 8px", borderRadius: 20, fontWeight: 600,
            }}>
              {comments.length}
            </span>
          </h3>
        </div>

        {/* Comment box */}
        {canComment && !commentClosed && (
          <div className="id-composer" style={{ marginBottom: 16 }}>
            <div className="id-composer-title">Add a Comment</div>
            <textarea
              className="id-composer-textarea"
              rows="3"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#64748b", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isAnonymousCmt}
                  onChange={(e) => setAnonymousCmt(e.target.checked)}
                  style={{ accentColor: "#2563eb", width: 13, height: 13 }}
                />
                Comment anonymously
              </label>
              <button
                className="id-btn id-btn--primary"
                onClick={handleComment}
                disabled={!commentText.trim() || postingComment}
                style={{ opacity: commentText.trim() ? 1 : 0.5 }}
              >
                {postingComment ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        )}

        {/* Comment list */}
        {sortedComments.length === 0 ? (
          <div className="id-empty" style={{ padding: "40px 20px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p className="id-empty-sub">No comments yet.</p>
          </div>
        ) : (
          <div className="id-comments-section">
            {sortedComments.map((c) => {
              const name    = c.isAnonymous ? "Anonymous" : (c.authorName ?? "—");
              const initial = c.isAnonymous ? "?" : (name[0] ?? "?").toUpperCase();
              return (
                <div key={c.commentId} className="id-comment-item">
                  <div className="id-comment-header">
                    <div className="id-comment-avatar"
                      style={{ background: c.isAnonymous ? "#94a3b8" : "#2563eb" }}>
                      {initial}
                    </div>
                    <div className="id-comment-author">{name}</div>
                    <div className="id-comment-time">{formatDateTime(c.createdAt)}</div>
                  </div>
                  <div className="id-comment-body">{c.content}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeaDetail;