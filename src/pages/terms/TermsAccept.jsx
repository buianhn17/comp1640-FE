import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getTermsConditions } from "../../services/termsconditionsService";
import "../../styles/terms-modal.css";

/* ✅ Toggle mock */
const USE_MOCK = false;

/* ✅ Mock data */
const MOCK_TERMS = [
  {
    id: 1,
    version: 3,
    effectiveDate: "2025-01-01",
    content: `Terms & Conditions (Version 3)

1. All submitted ideas become the intellectual property of the university.
2. Staff must not submit content that violates copyright, law, or internal policy.
3. The university reserves the right to use, modify, or reject ideas without prior notice.
4. All submitted content must align with the university's ethical and cultural standards.
5. Staff must accept the latest Terms & Conditions version before submitting any subsequent ideas.
`
  },
  {
    id: 2,
    version: 2,
    effectiveDate: "2024-01-01",
    content: "Old version of terms..."
  }
];

const TermsAccept = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const returnTo  = location.state?.from ?? "/submit-idea";

  const [checked,  setChecked]  = useState(false);
  const [terms,    setTerms]    = useState(null);
  const [loading,  setLoading]  = useState(true);

  /* ── Load terms (mock hoặc BE) ───────────────────────── */
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        let data;

        if (USE_MOCK) {
          console.log("👉 Using MOCK data");
          data = MOCK_TERMS;
        } else {
          console.log("👉 Fetching from API");
          data = await getTermsConditions();
        }

        if (Array.isArray(data) && data.length > 0) {
          const latest = [...data].sort((a, b) => b.version - a.version)[0];
          setTerms(latest);
        }
      } catch (err) {
        console.error("Failed to load terms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  const handleAccept = () => {
    localStorage.setItem("acceptedTerms", "true");
    navigate(returnTo);
  };

  const handleCancel = () => navigate("/ideas");

  return (
    <div className="ta-page">
      <div className="ta-header">
        <div className="ta-header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div>
          <h1 className="ta-title">Terms &amp; Conditions</h1>
          <p className="ta-sub">
            {terms ? `Version ${terms.version} — Effective ${terms.effectiveDate}` : "Please read carefully before submitting your idea"}
          </p>
        </div>
      </div>

      <div className="ta-card">
        <div className="ta-card-head">University Idea Management — Policy Agreement</div>
        <div className="ta-card-body">
          {loading ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "#64748b" }}>
              Loading terms...
            </div>
          ) : terms ? (
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "#374151", fontSize: 14 }}>
              {terms.content}
            </div>
          ) : (
            <ul className="ta-rules">
              {[
                "All submitted ideas become the intellectual property of the university.",
                "Staff must not submit content that violates copyright, law, or internal policy.",
                "The university reserves the right to use, modify, or reject ideas without prior notice.",
                "All submitted content must align with the university's ethical and cultural standards.",
                "Staff must accept the latest Terms & Conditions version before submitting any subsequent ideas.",
              ].map((rule, i) => (
                <li key={i} className="ta-rule">
                  <span className="ta-rule-num">{i + 1}</span>
                  <span className="ta-rule-text">{rule}</span>
                </li>
              ))}
            </ul>
          )}

          <label className="ta-agree-row" onClick={() => setChecked((c) => !c)}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              disabled={loading}
            />
            <span className="ta-agree-label">
              I have read and agree to all Terms &amp; Conditions stated above.
            </span>
          </label>
        </div>
      </div>

      <div className="ta-actions">
        <button className="ta-btn-cancel" onClick={handleCancel}>
          Cancel
        </button>
        <button
          className="ta-btn-accept"
          onClick={handleAccept}
          disabled={!checked || loading}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          I Agree — Continue
        </button>
      </div>
    </div>
  );
};

export default TermsAccept;