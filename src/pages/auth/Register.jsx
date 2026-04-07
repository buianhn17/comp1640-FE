import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import illustration from "../../assets/Investment data-rafiki 1.png";
import logo from "../../assets/Logo.png";
import { notification } from "antd";
import "./../../styles/register.css";
import AuthModal from "../../components/AuthModal";
import { register as registerApi } from "../../services/authService";

const Register = ({ isModal = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const bgState = location.state?.background;

  const goToAuth = (path) =>
    navigate(path, isModal ? { state: { background: bgState } } : undefined);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    staffType: "ACADEMIC",
    agree: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  /* =========================
     VALIDATION (FIX)
  ========================= */
  const validate = () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      notification.warning({
        message: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ các trường bắt buộc",
      });
      return false;
    }

    // email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      notification.error({
        message: "Email không hợp lệ",
      });
      return false;
    }

    if (formData.password.length < 6) {
      notification.error({
        message: "Mật khẩu quá ngắn",
        description: "Tối thiểu 6 ký tự",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      notification.error({ message: "Mật khẩu không khớp" });
      return false;
    }

    if (!formData.agree) {
      notification.warning({
        message: "Bạn phải đồng ý với Điều khoản & Điều kiện",
      });
      return false;
    }

    return true;
  };

  /* =========================
     SUBMIT (FIX)
  ========================= */
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      // 🔥 FIX: chỉ gửi 2 role hợp lệ
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        staffType:
          formData.staffType === "SUPPORT" ? "SUPPORT" : "ACADEMIC",
      };

      await registerApi(payload);

      notification.success({
        message: "Đăng ký thành công",
        description: "Bạn có thể đăng nhập ngay bây giờ",
      });

      // reset form
      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        staffType: "ACADEMIC",
        agree: false,
      });

      goToAuth("/login");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Đăng ký thất bại, vui lòng thử lại";

      notification.error({
        message: "Đăng ký thất bại",
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI GIỮ NGUYÊN 100%
  ========================= */

  if (isModal) {
    return (
      <AuthModal>
        <img src={logo} alt="Logo" className="am-logo" />
        <h2 className="am-title">Tạo tài khoản</h2>

        <form onSubmit={handleRegister}>
          <div className="am-group">
            <label className="am-label">Họ và tên</label>
            <input
              type="text"
              name="fullName"
              className="am-input"
              placeholder="Nhập họ và tên"
              onChange={handleChange}
            />
          </div>

          <div className="am-group">
            <label className="am-label">Email</label>
            <input
              type="email"
              name="email"
              className="am-input"
              placeholder="abc@university.edu"
              onChange={handleChange}
            />
          </div>

          {/* 🔥 UI giữ nguyên nhưng logic đã fix */}
          <div className="am-group">
            <label className="am-label">Loại nhân viên</label>
            <select
              name="staffType"
              className="am-input am-select"
              onChange={handleChange}
              defaultValue="ACADEMIC"
            >
              <option value="ACADEMIC">Academic</option>
              <option value="SUPPORT">Support</option>
              <option value="MANAGEMENT">Management</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>

          <div className="am-group">
            <label className="am-label">Mật khẩu</label>
            <div className="am-pw-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="am-input"
                placeholder="••••••••"
                onChange={handleChange}
              />
              <button
                type="button"
                className="am-pw-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>

          <div className="am-group">
            <label className="am-label">Xác nhận mật khẩu</label>
            <div className="am-pw-wrap">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                className="am-input"
                placeholder="••••••••"
                onChange={handleChange}
              />
              <button
                type="button"
                className="am-pw-toggle"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>

          <div className="am-terms">
            <input
              type="checkbox"
              name="agree"
              id="am-terms-cb"
              onChange={handleChange}
            />
            <label htmlFor="am-terms-cb">
              Tôi đồng ý với Điều khoản &amp; Điều kiện
            </label>
          </div>

          <button
            type="submit"
            className="am-btn-primary"
            disabled={loading}
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>

          <div className="am-footer">
            <span className="am-link-row">
              Đã có tài khoản?{" "}
              <button
                type="button"
                className="am-link am-link-primary"
                onClick={() => goToAuth("/login")}
              >
                Đăng nhập
              </button>
            </span>
          </div>
        </form>
      </AuthModal>
    );
  }

  /* ===== PAGE VERSION (GIỮ NGUYÊN) ===== */
  return (
    <div className="register-container">
      <div className="register-form-section">
        <div className="register-form-wrapper">
          <img src={logo} alt="University Logo" className="register-logo" />
          <h1 className="register-title">
            University Idea Management System
          </h1>

          <form onSubmit={handleRegister} className="register-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                className="form-input"
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Staff Type</label>
              <select
                name="staffType"
                className="form-input form-select"
                onChange={handleChange}
              >
                <option value="ACADEMIC">Academic</option>
                <option value="SUPPORT">Support</option>
                <option value="MANAGEMENT">Management</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-input password-input"
                  onChange={handleChange}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  className="form-input password-input"
                  onChange={handleChange}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="terms-group">
              <input type="checkbox" name="agree" onChange={handleChange} />
              <label>I agree to the Terms & Conditions</label>
            </div>

            <button type="submit" className="register-button" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </div>

      <div className="vertical-separator" />

      <div className="register-illustration-section">
        <img src={illustration} alt="Illustration" />
      </div>
    </div>
  );
};

export default Register;