import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import illustration from "../../assets/Investment data-rafiki 1.png";
import logo from "../../assets/Logo.png";
import { notification } from "antd";
import "./../../styles/register.css";
import { register as registerApi } from "../../services/authService";

const Register = () => {
  const navigate = useNavigate();

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
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ các trường bắt buộc",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      notification.error({ title: "Email không hợp lệ" });
      return false;
    }

    if (formData.password.length < 6) {
      notification.error({
        title: "Mật khẩu quá ngắn",
        description: "Tối thiểu 6 ký tự",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      notification.error({ title: "Mật khẩu không khớp" });
      return false;
    }

    if (!formData.agree) {
      notification.warning({ title: "Bạn phải đồng ý với Điều khoản & Điều kiện" });
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
        title: "Đăng ký thành công",
        description: "Bạn có thể đăng nhập ngay bây giờ",
      });

      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        staffType: "ACADEMIC",
        agree: false,
      });

      navigate("/login");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Đăng ký thất bại, vui lòng thử lại";

      notification.error({
        title: "Đăng ký thất bại",
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI GIỮ NGUYÊN 100%
  ========================= */

  /* ===== PAGE VERSION ===== */
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