import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { notification } from "antd";
import illustration from "../../assets/Investment data-rafiki 1.png";
import logo from "../../assets/Logo.png";
import "./../../styles/forgot-password.css";

const ForgotPassword = () => {
  const navigate = useNavigate();

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
      setTimeout(() => navigate("/login"), 1500);
    }, 1500);
  };

  /* ══════════════════════════════════════════════════════════
     FULL-PAGE VERSION
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