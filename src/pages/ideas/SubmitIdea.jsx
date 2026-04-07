import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ROLES } from "../../constants/roles";
import { submitIdea } from "../../services/ideaService";
import { getCategories } from "../../services/categoryService";
import { getCurrentAcademicYear } from "../../services/academicYearService";
import { uploadDocument } from "../../services/documentService";
import "../../styles/ideas.css";
import "../../styles/terms-modal.css";

// ── MOCK DATA (dùng khi API chưa sẵn sàng) ──────────────────────────────────
const USE_MOCK = false; // đổi thành true để dùng mock, false để gọi API thật

const MOCK_CATEGORIES = [
  { categoryId: 1, categoryName: "HR"         },
  { categoryId: 2, categoryName: "Technology" },
  { categoryId: 3, categoryName: "Finance"    },
  { categoryId: 4, categoryName: "Marketing"  },
  { categoryId: 5, categoryName: "Operations" },
  { categoryId: 6, categoryName: "Design"     },
  { categoryId: 7, categoryName: "Other"      },
];

const MOCK_CURRENT_YEAR = {
  yearId: 4, yearLabel: "2024-2025",
  ideaClosureDate: "2025-03-31", finalClosureDate: "2025-04-30",
  ideaOpen: true, commentOpen: true,
};

/* ── Terms gate modal ─────────────────────────────────────── */
const TermsGateModal = ({ onConfirm }) => (
  <div className="tg-backdrop">
    <div className="tg-box" role="alertdialog" aria-modal="true">
      <div className="tg-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <h2 className="tg-title">Terms &amp; Conditions Required</h2>
      <p className="tg-desc">
        You must read and agree to the <strong>Terms &amp; Conditions</strong> before submitting an idea.
      </p>
      <button className="tg-btn-ok" onClick={onConfirm}>
        OK — Go to Terms &amp; Conditions
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
          <line x1="5" y1="12" x2="19" y2="12"/>
          <polyline points="12 5 19 12 12 19"/>
        </svg>
      </button>
    </div>
  </div>
);

/* ── Main component ───────────────────────────────────────── */
const SubmitIdea = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  /* ── Remote data ─────────────────────────────────────────── */
  const [categories,       setCategories]       = useState([]);
  const [currentYear,      setCurrentYear]      = useState(null);
  const [loadingInit,      setLoadingInit]      = useState(true);
  const [showTermsGate,    setShowTermsGate]    = useState(false);
  const [submitting,       setSubmitting]       = useState(false);

  /* ── Form state ──────────────────────────────────────────── */
  const [form, setForm] = useState({
    title:        "",
    content:      "",        // BE dùng "content", không phải "description"
    categoryIds:  [],        // mảng ID
    isAnonymous:  false,
    termsAccepted: false,
  });
  const [attachedFile, setAttachedFile] = useState(null);

  /* ── Init: load categories + current academic year ───────── */
  useEffect(() => {
    const init = async () => {
      try {
        if (USE_MOCK) {
          // Dùng mock data — xóa block này khi API sẵn sàng
          await new Promise((r) => setTimeout(r, 300));
          setCategories(MOCK_CATEGORIES);
          setCurrentYear(MOCK_CURRENT_YEAR);
        } else {
          const [cats, year] = await Promise.all([
            getCategories(),
            getCurrentAcademicYear(),
          ]);
          setCategories(cats ?? []);
          setCurrentYear(year);
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoadingInit(false);
      }
    };
    init();

    // Kiểm tra terms
    const accepted = localStorage.getItem("acceptedTerms");
    if (!accepted) setShowTermsGate(true);
  }, []);

  /* ── Guards ──────────────────────────────────────────────── */
  if (!user || (user.role !== ROLES.ACADEMIC && user.role !== ROLES.SUPPORT)) {
    return (
      <div className="id-page">
        <div className="id-access-denied">🚫 You do not have permission to access this page.</div>
      </div>
    );
  }

  const isClosed = currentYear && !currentYear.ideaOpen;

  if (!loadingInit && isClosed) {
    return (
      <div className="id-page">
        <div style={{
          background: "#fef9c3", border: "1px solid #fde68a",
          borderRadius: 12, padding: 28, textAlign: "center",
          color: "#854d0e", fontWeight: 600, fontSize: 15,
        }}>
          ⏰ The submission period has ended.
        </div>
      </div>
    );
  }

  /* ── Handlers ────────────────────────────────────────────── */
  const handleCategoryToggle = (catId) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter((id) => id !== catId)
        : [...prev.categoryIds, catId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!localStorage.getItem("acceptedTerms")) {
      setShowTermsGate(true);
      return;
    }
    if (!form.title.trim() || !form.content.trim()) {
      alert("Title and content are required!");
      return;
    }
    if (!currentYear?.yearId) {
      alert("No active academic year found.");
      return;
    }

    setSubmitting(true);
    try {
      if (USE_MOCK) {
        // Dùng mock data — xóa block này khi API sẵn sàng
        await new Promise((r) => setTimeout(r, 600));
        console.log("[MOCK] Idea submitted:", form);
        navigate("/ideas");
        return;
      }

      // 1. Submit idea
      const payload = {
        yearId:       currentYear.yearId,
        title:        form.title,
        content:      form.content,
        isAnonymous:  form.isAnonymous,
        termsAccepted: true,
        categoryIds:  form.categoryIds,
      };
      const created = await submitIdea(payload);

      // 2. Upload file nếu có
      if (attachedFile && created?.ideaId) {
        try {
          await uploadDocument(created.ideaId, attachedFile);
        } catch (uploadErr) {
          console.warn("File upload failed:", uploadErr);
          // Idea đã tạo thành công, chỉ file lỗi → không block
        }
      }

      navigate("/ideas");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit idea. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Sidebar info ────────────────────────────────────────── */
  const yearLabel   = currentYear?.yearLabel || "Not set";
  const closureDate = currentYear?.ideaClosureDate
    ? new Date(currentYear.ideaClosureDate).toLocaleDateString("en-GB") : "—";
  const finalDate   = currentYear?.finalClosureDate
    ? new Date(currentYear.finalClosureDate).toLocaleDateString("en-GB") : "—";

  return (
    <>
      {showTermsGate && (
        <TermsGateModal
          onConfirm={() => {
            setShowTermsGate(false);
            navigate("/terms", { state: { from: "/submit-idea" } });
          }}
        />
      )}

      <div className="id-page">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="id-page-header">
          <div>
            <h1 className="id-page-title">Submit Idea</h1>
            <p className="id-page-sub">Share your innovation with the organization</p>
          </div>
          {localStorage.getItem("acceptedTerms") && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 12, background: "#ecfdf5", color: "#059669",
              border: "1px solid #a7f3d0", padding: "5px 12px",
              borderRadius: 20, fontWeight: 600,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Terms Accepted
            </span>
          )}
        </div>

        {loadingInit ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
            Loading...
          </div>
        ) : (
          <div className="id-submit-grid">
            {/* ── Form ──────────────────────────────────────── */}
            <div className="id-card">
              <div className="id-card-head">
                <span className="id-card-title">Idea Information</span>
              </div>
              <form onSubmit={handleSubmit} style={{ padding: "22px 24px" }}>
                {/* Title */}
                <div className="id-form-group">
                  <label className="id-form-label">
                    Title <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="id-form-input"
                    placeholder="Enter your idea title..."
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    maxLength={120}
                  />
                  <span className="id-form-hint">{form.title.length}/120 characters</span>
                </div>

                {/* Categories — multi-select dạng checkbox chips */}
                <div className="id-form-group">
                  <label className="id-form-label">Categories</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                    {categories.map((cat) => {
                      const selected = form.categoryIds.includes(cat.categoryId);
                      return (
                        <button
                          key={cat.categoryId}
                          type="button"
                          onClick={() => handleCategoryToggle(cat.categoryId)}
                          style={{
                            padding: "4px 12px", borderRadius: 20, fontSize: 12.5,
                            border: `1px solid ${selected ? "#2563eb" : "#e2e8f0"}`,
                            background: selected ? "#eff6ff" : "#f8fafc",
                            color: selected ? "#2563eb" : "#64748b",
                            cursor: "pointer", fontWeight: selected ? 600 : 400,
                            transition: "all 0.15s",
                          }}
                        >
                          {cat.categoryName}
                        </button>
                      );
                    })}
                    {categories.length === 0 && (
                      <span style={{ fontSize: 12.5, color: "#94a3b8" }}>No categories available</span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="id-form-group">
                  <label className="id-form-label">
                    Content <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <textarea
                    className="id-form-textarea"
                    rows="7"
                    placeholder="Describe your idea in detail..."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    maxLength={2000}
                  />
                  <span className="id-form-hint">{form.content.length}/2000 characters</span>
                </div>

                {/* File attachment */}
                <div className="id-form-group">
                  <label className="id-form-label">Attachment (optional)</label>
                  <input
                    type="file"
                    className="id-form-input"
                    onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                  {attachedFile && (
                    <span className="id-form-hint">📎 {attachedFile.name}</span>
                  )}
                </div>

                {/* Anonymous */}
                <div className="id-form-group">
                  <label
                    className="id-form-check"
                    onClick={() => setForm({ ...form, isAnonymous: !form.isAnonymous })}
                  >
                    <input
                      type="checkbox"
                      checked={form.isAnonymous}
                      onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <div className="id-form-check-label">Submit anonymously</div>
                      <div className="id-form-hint" style={{ marginTop: 1 }}>
                        Your name will not be displayed publicly
                      </div>
                    </div>
                  </label>
                </div>

                {/* Actions */}
                <div className="id-form-actions">
                  <button
                    type="button"
                    className="id-btn id-btn--ghost"
                    onClick={() => navigate("/ideas")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="id-btn id-btn--primary"
                    disabled={submitting}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    {submitting ? "Submitting..." : "Submit Idea"}
                  </button>
                </div>
              </form>
            </div>

            {/* ── Sidebar ────────────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="id-sidebar-card">
                <div className="id-sidebar-card-head">Academic Year</div>
                <div className="id-sidebar-card-body">
                  <div className="id-info-row">
                    <span className="id-info-key">Year</span>
                    <span className="id-info-value">{yearLabel}</span>
                  </div>
                  <div className="id-info-row">
                    <span className="id-info-key">Status</span>
                    {currentYear?.ideaOpen
                      ? <span className="id-status-open">● Open</span>
                      : <span className="id-status-closed">● Closed</span>
                    }
                  </div>
                  <div className="id-info-row">
                    <span className="id-info-key">Submission Deadline</span>
                    <span className="id-info-value">{closureDate}</span>
                  </div>
                  <div className="id-info-row">
                    <span className="id-info-key">Comment Deadline</span>
                    <span className="id-info-value">{finalDate}</span>
                  </div>
                </div>
              </div>

              <div className="id-sidebar-card">
                <div className="id-sidebar-card-head">Submitter Info</div>
                <div className="id-sidebar-card-body">
                  <div className="id-info-row">
                    <span className="id-info-key">Full Name</span>
                    <span className="id-info-value">{user.fullName || "—"}</span>
                  </div>
                  <div className="id-info-row">
                    <span className="id-info-key">Email</span>
                    <span className="id-info-value" style={{ fontSize: 12 }}>{user.email}</span>
                  </div>
                  <div className="id-info-row">
                    <span className="id-info-key">Department</span>
                    <span className="id-info-value">{user.deptName || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="id-tip-box">
                💡 <strong>Tip:</strong> Clear ideas with concrete evidence and actionable solutions are rated higher.
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SubmitIdea;