import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { notification } from "antd";
import illustration from "../../assets/Investment data-rafiki 1.png";
import logo from "../../assets/Logo.png";
import "./../../styles/forgot-password.css";

import AuthModal from "../../components/AuthModal"; // ← điều chỉnh path nếu cần

const ForgotPassword = ({ isModal = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const bgState = location.state?.background;
  const goToAuth = (path) =>
    navigate(path, isModal ? { state: { background: bgState } } : undefined);

  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      notification.warning({ title: "Thiếu email", description: "Vui lòng nhập email của bạn" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      notification.error({ title: "Email không hợp lệ", description: "Vui lòng nhập địa chỉ email hợp lệ" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      notification.success({
        title: "Đã gửi link đặt lại",
        description: "Nếu email tồn tại, link đặt lại mật khẩu đã được gửi.",
      });
      setLoading(false);
      setTimeout(() => goToAuth("/login"), 1500);
    }, 1500);
  };

  /* ══════════════════════════════════════════════════════════
     MODAL VERSION
  ══════════════════════════════════════════════════════════ */
  if (isModal) {
    return (
      <AuthModal>
        <img src={logo} alt="Logo" className="am-logo" />
        <h2 className="am-title">Quên mật khẩu?</h2>
        <p className="am-desc">
          Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="am-group">
            <label className="am-label">Email</label>
            <input type="email" className="am-input" placeholder="abc@university.edu"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <button type="submit" className="am-btn-primary" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi link đặt lại"}
          </button>

          <div className="am-footer">
            <button type="button" className="am-link am-link-secondary"
              onClick={() => goToAuth("/login")}>
              ← Quay lại đăng nhập
            </button>
          </div>
        </form>
      </AuthModal>
    );
  }

  /* ══════════════════════════════════════════════════════════
     FULL-PAGE VERSION — giữ nguyên 100% như cũ
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="forgot-password-container">
      <div className="forgot-password-form-section">
        <div className="forgot-password-form-wrapper">
          <img src={logo} alt="University Logo" className="forgot-password-logo" />
          <h1 className="forgot-password-title">Reset Your Password</h1>
          <p className="forgot-password-description">
            Enter your university email address and we will send you a password reset link.
          </p>
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="form-group">
              <label className="form-label">University Email</label>
              <input type="email" placeholder="abc@university.edu" value={email}
                onChange={(e) => setEmail(e.target.value)} className="form-input" />
            </div>
            <button type="submit" disabled={loading} className="forgot-password-button">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <div className="back-to-login">
              <button type="button" onClick={() => navigate("/login")} className="link-button secondary">
                ← Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="vertical-separator" />
      <div className="forgot-password-illustration-section">
        <img src={illustration} alt="Illustration" className="illustration-image" />
      </div>
    </div>
  );
};

export default ForgotPassword;