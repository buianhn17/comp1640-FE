import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/auth-modal.css";

const AuthModal = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const background = location.state?.background;
  const fallbackPath = background?.pathname || "/";

  const handleClose = () => {
    navigate(fallbackPath, { replace: true });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="am-backdrop" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="am-box" onClick={(e) => e.stopPropagation()}>
        <button className="am-close" onClick={handleClose} aria-label="Đóng">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
};

export default AuthModal;