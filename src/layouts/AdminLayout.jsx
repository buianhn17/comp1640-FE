import { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import "../styles/AdminLayout.css";
import { logout } from "../redux/slices/authSlice";

const NAV_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    key: "users",
    label: "User Management",
    path: "/admin/users",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    key: "departments",
    label: "Departments",
    path: "/admin/departments",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
  },
  {
    key: "academic-years",
    label: "Academic Years",
    path: "/admin/academic-years",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    key: "terms",
    label: "Terms & Conditions",
    path: "/admin/terms",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    key: "attachments",
    label: "Documents",
    path: "/admin/attachments",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
      </svg>
    ),
  },
];

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  // Hỗ trợ cả schema mới (full_name, role_name) lẫn mock cũ (fullName, role)
  const displayName    = user?.full_name    || user?.fullName    || "Admin";
  const displayEmail   = user?.email                             || "administrator";
  const displayRole    = user?.role_name    || user?.role        || "ADMIN";
  const displayInitial = displayName[0]?.toUpperCase()          || "A";

  const handleLogout = () => {
    dispatch(logout());
    // Sau khi logout → về trang chủ và mở modal Login ngay lập tức
    navigate("/", { state: { background: { pathname: "/" } } });
    // Delay nhỏ để navigate hoàn thành rồi mới push modal route
    setTimeout(() => {
      navigate("/login", { state: { background: { pathname: "/" } } });
    }, 50);
  };

  return (
    <div className={collapsed ? "admin-shell sidebar-collapsed" : "admin-shell"}>

      {/* ── SIDEBAR ── */}
      <aside className="admin-sidebar">

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#6366f1"/>
              <path d="M8 16l5 5 11-11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="brand-text">
              <span className="brand-title">IdeaHub</span>
              <span className="brand-sub">Admin Portal</span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          className="collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed
              ? <path d="M9 18l6-6-6-6"/>
              : <path d="M15 18l-6-6 6-6"/>
            }
          </svg>
        </button>

        {/* Nav */}
        <nav className="sidebar-nav">
          {!collapsed && <span className="nav-section-label">MANAGEMENT</span>}
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `nav-item${isActive ? " nav-item--active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{displayInitial}</div>
            {!collapsed && (
              <div className="user-info">
                <span className="user-name">{displayName}</span>
                <span className="user-role">{displayEmail}</span>
              </div>
            )}
          </div>
        </div>

      </aside>

      {/* ── MAIN ── */}
      <main className="admin-main">

        {/* Topbar */}
        <div className="admin-topbar">
          <div className="topbar-breadcrumb">
            <span className="topbar-title">Admin Panel</span>
          </div>

          <div className="topbar-actions">
            {/* Badge role + tên */}
            <div className="topbar-user-badge">
              <span className="topbar-role-chip">{displayRole}</span>
              <span className="topbar-username">{displayName}</span>
            </div>

            {/* Notification */}
            <button className="topbar-notif" title="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>

            {/* Sign Out */}
            <button className="topbar-logout" onClick={handleLogout} title="Sign out">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="admin-content">
          <Outlet />
        </div>

      </main>
    </div>
  );
};

export default AdminLayout;