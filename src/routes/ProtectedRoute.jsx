import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  // Chưa đăng nhập → về login, lưu lại URL để redirect sau khi login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Đang load user (edge case)
  if (!user) {
    return null;
  }

  // Đã đăng nhập nhưng không có quyền → 403, KHÔNG về login
  // (tránh vòng lặp redirect và UX tốt hơn)
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default ProtectedRoute;