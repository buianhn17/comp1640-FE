import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { notification } from "antd";
import "antd/dist/reset.css";

import illustration from "../../assets/Investment data-rafiki 1.png";
import logo from "../../assets/Logo.png";
import "./../../styles/login.css";

import AuthModal from "../../components/AuthModal";
import { loginSuccess, normalizeRole } from "../../redux/slices/authSlice";
import { login as loginApi } from "../../services/authService";
import { ROLES } from "../../constants/roles";

const ROLE_ROUTE = {
  [ROLES.ADMIN]:          "/admin/dashboard",
  [ROLES.QA_MANAGER]:     "/manager",
  [ROLES.QA_COORDINATOR]: "/coordinator",
  [ROLES.STAFF]:          "/ideas",
};

const Login = ({ isModal = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [loading,      setLoading]      = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const bgState  = location.state?.background;
  const goToAuth = (path) =>
    navigate(path, isModal ? { state: { background: bgState } } : undefined);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      notification.warning({ message: "Thiếu thông tin", description: "Vui lòng nhập email và mật khẩu" });
      return;
    }

    try {
      setLoading(true);

      // Gọi BE — apiClient tự gắn token + convert snake_case
      // BE trả về: { token, email, role }
      const data = await loginApi({ email, password });

      const role = normalizeRole(data.role);

      dispatch(loginSuccess({
        token: data.token,
        user: {
          email:    data.email,
          role,
          fullName: data.fullName || data.email, // BE login không trả fullName → fallback email
        },
      }));

      notification.success({ message: "Đăng nhập thành công" });
      navigate(ROLE_ROUTE[role] || "/ideas");

    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Email hoặc mật khẩu không đúng";
      notification.error({ message: "Đăng nhập thất bại", description: msg });
    } finally {
      setLoading(false);
    }
  };

  /* ══════════════════════════════════════════════════════════
     MODAL VERSION
  ══════════════════════════════════════════════════════════ */
  if (isModal) {
    return (
      <AuthModal>
        <img src={logo} alt="Logo" className="am-logo" />
        <h2 className="am-title">Đăng nhập</h2>

        <form onSubmit={handleLogin}>
          <div className="am-group">
            <label className="am-label">Email</label>
            <input
              type="email"
              className="am-input"
              placeholder="abc@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="am-group">
            <label className="am-label">Mật khẩu</label>
            <div className="am-pw-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className="am-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="am-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>

          <button type="submit" className="am-btn-primary" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <div className="am-footer">
            <button type="button" className="am-link am-link-secondary"
              onClick={() => goToAuth("/forgot-password")}>
              Quên mật khẩu?
            </button>
            <span className="am-link-row">
              Chưa có tài khoản?{" "}
              <button type="button" className="am-link am-link-primary"
                onClick={() => goToAuth("/register")}>
                Đăng ký ngay
              </button>
            </span>
          </div>
        </form>
      </AuthModal>
    );
  }

  /* ══════════════════════════════════════════════════════════
     FULL-PAGE VERSION
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="login-container">
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <img src={logo} alt="University Logo" className="login-logo" />
          <h1 className="login-title">University Idea Management System</h1>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abc@university.edu"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="form-input password-input"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle" aria-label="Toggle password visibility">
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="login-button">
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="forgot-password-link">
              <button type="button" onClick={() => navigate("/forgot-password")}
                className="link-button secondary">
                Forgot Password?
              </button>
            </div>

            <div className="register-link">
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => navigate("/register")}
                className="link-button primary">
                Create one
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="vertical-separator" />
      <div className="login-illustration-section">
        <img src={illustration} alt="Illustration" className="illustration-image" />
      </div>
    </div>
  );
};

export default Login;