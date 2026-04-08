import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { ROLES } from "../constants/roles";
import "../styles/main-layout.css";

/* ═══════════════════════════════════════════════════════════
   NAV ITEM DEFINITIONS theo từng role
═══════════════════════════════════════════════════════════ */

/* ── Icons dùng chung ── */
const IconIdea = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2a7 7 0 0 1 7 7c0 3-1.5 5-3.5 6.5V17a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1.5C6.5 14 5 12 5 9a7 7 0 0 1 7-7z"/>
    <line x1="9" y1="21" x2="15" y2="21"/>
    <line x1="10" y1="19" x2="14" y2="19"/>
  </svg>
);

const IconSubmit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const IconTerms = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

const IconStats = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconTag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconWarning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconExport = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconAdmin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4"/>
    <path d="M20 21a8 8 0 1 0-16 0"/>
    <polyline points="16 11 18 13 22 9"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   NAV ITEMS THEO ROLE
   Dựa theo bảng phân quyền:
   - ACADEMIC / SUPPORT  : Ideas, Submit Idea, Terms
   - QA_COORDINATOR      : Ideas, Dashboard, Notifications, Statistics (dept mình)
   - QA_MANAGER          : Ideas, Statistics (toàn trường), Categories, Exceptions, Export
   - DEPT_MANAGER        : Ideas, Statistics (dept mình)
   - HR_MANAGER          : Ideas, Statistics (HR dept)
   - HEAD                : Ideas, Statistics (Faculty)
   - ADMIN               : link sang /admin
═══════════════════════════════════════════════════════════ */

const NAV_ITEMS_STAFF = [
  { key: "ideas",       label: "Ideas",       path: "/ideas",       icon: <IconIdea />   },
  { key: "submit-idea", label: "Submit Idea", path: "/submit-idea", icon: <IconSubmit /> },
  { key: "terms",       label: "Terms",       path: "/terms",       icon: <IconTerms />  },
];

const NAV_ITEMS_COORDINATOR = [
  { key: "ideas",                    label: "Ideas",         path: "/ideas",                    icon: <IconIdea />      },
  { key: "coordinator-dashboard",    label: "Dashboard",     path: "/coordinator/dashboard",    icon: <IconDashboard /> },
  { key: "coordinator-notifications",label: "Notifications", path: "/coordinator/notifications",icon: <IconBell />      },
  { key: "statistics",               label: "Statistics",    path: "/statistics",               icon: <IconStats />     },
];

const NAV_ITEMS_QA_MANAGER = [
  { key: "ideas",      label: "Ideas",      path: "/ideas",               icon: <IconIdea />    },
  { key: "statistics", label: "Statistics", path: "/statistics",          icon: <IconStats />   },
  { key: "categories", label: "Categories", path: "/manager/categories",  icon: <IconTag />     },
  { key: "exceptions", label: "Exceptions", path: "/manager/exceptions",  icon: <IconWarning /> },
  { key: "export",     label: "Export Data",path: "/manager/export",      icon: <IconExport />  },
];

// DEPT_MANAGER và HEAD: xem ideas + statistics (giới hạn dept/faculty ở component)
const NAV_ITEMS_DEPT_MANAGER = [
  { key: "ideas",      label: "Ideas",      path: "/ideas",      icon: <IconIdea />  },
  { key: "statistics", label: "Statistics", path: "/statistics", icon: <IconStats /> },
];

// HR_MANAGER: xem ideas + statistics (giới hạn HR dept ở component)
const NAV_ITEMS_HR_MANAGER = [
  { key: "ideas",      label: "Ideas",      path: "/ideas",      icon: <IconIdea />  },
  { key: "statistics", label: "Statistics", path: "/statistics", icon: <IconStats /> },
];

// ADMIN: link shortcut sang admin panel (thường ADMIN dùng AdminLayout, nhưng nếu vào MainLayout thì có link)
const NAV_ITEMS_ADMIN = [
  { key: "admin",      label: "Admin Panel",path: "/admin",      icon: <IconAdmin />  },
  { key: "ideas",      label: "Ideas",      path: "/ideas",      icon: <IconIdea />   },
  { key: "statistics", label: "Statistics", path: "/statistics", icon: <IconStats />  },
];

/* ── Resolver ── */
function getNavItems(role) {
  switch (role) {
    case ROLES.ADMIN:
      return [
        { key: "admin", label: "Admin Panel", path: "/admin", icon: <IconAdmin /> },
        { key: "ideas", label: "Ideas", path: "/ideas", icon: <IconIdea /> },
        { key: "statistics", label: "Statistics", path: "/statistics", icon: <IconStats /> },
      ];
    case ROLES.QA_MANAGER:
      return [
        { key: "ideas", label: "Ideas", path: "/ideas", icon: <IconIdea /> },
        { key: "statistics", label: "Statistics", path: "/statistics", icon: <IconStats /> },
        { key: "categories", label: "Categories", path: "/manager/categories", icon: <IconTag /> },
        { key: "exceptions", label: "Exceptions", path: "/manager/exceptions", icon: <IconWarning /> },
        { key: "export", label: "Export Data", path: "/manager/export", icon: <IconExport /> },
      ];
    case ROLES.QA_COORDINATOR:
      return [
        { key: "ideas", label: "Ideas", path: "/ideas", icon: <IconIdea /> },
        { key: "coordinator-dashboard", label: "Dashboard", path: "/coordinator/dashboard", icon: <IconDashboard /> },
        { key: "coordinator-notifications", label: "Notifications", path: "/coordinator/notifications", icon: <IconBell /> },
        { key: "statistics", label: "Statistics", path: "/statistics", icon: <IconStats /> },
      ];
    case ROLES.DEPT_MANAGER:
    case ROLES.HR_MANAGER:
    case ROLES.HEAD:
      return [
        { key: "ideas", label: "Ideas", path: "/ideas", icon: <IconIdea /> },
        { key: "statistics", label: "Statistics", path: "/statistics", icon: <IconStats /> },
      ];
    case ROLES.ACADEMIC:
    case ROLES.SUPPORT:
      return [
        { key: "ideas", label: "Ideas", path: "/ideas", icon: <IconIdea /> },
        { key: "submit-idea", label: "Submit Idea", path: "/submit-idea", icon: <IconSubmit /> },
        { key: "terms", label: "Terms", path: "/terms", icon: <IconTerms /> },
      ];
    default:
      return [];
  }
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const displayName    = user?.fullName    || user?.full_name    || "User";
  const displayEmail   = user?.email                             || "";
  const displayRole    = user?.role        || user?.role_name    || "";
  const displayInitial = displayName[0]?.toUpperCase()          || "U";

  const navItems = getNavItems(displayRole);

  return (
    <div className={`main-shell${collapsed ? " sidebar-collapsed" : ""}`}>
      {/* ── SIDEBAR ── */}
      <aside className="main-sidebar">
        {/* Brand */}
        <div className="main-sidebar-brand">
          <div className="main-brand-icon">
            <svg viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#6366f1"/>
              <path d="M8 16l5 5 11-11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="main-brand-text">
              <span className="main-brand-title">IdeaHub</span>
              <span className="main-brand-sub">Staff Portal</span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          className="main-collapse-btn"
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
        <nav className="main-sidebar-nav">
          {!collapsed && <span className="main-nav-section-label">NAVIGATION</span>}
          {navItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `main-nav-item${isActive ? " main-nav-item--active" : ""}`
              }
            >
              <span className="main-nav-icon">{item.icon}</span>
              {!collapsed && <span className="main-nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer — user chip */}
        <div className="main-sidebar-footer">
          <div className="main-user-chip">
            <div className="main-user-avatar">{displayInitial}</div>
            {!collapsed && (
              <div className="main-user-info">
                <span className="main-user-name">{displayName}</span>
                <span className="main-user-role">{displayEmail || displayRole}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-body">
        {/* Topbar */}
        <div className="main-topbar">
          <div className="main-topbar-breadcrumb">
            <span className="main-topbar-title">Staff Panel</span>
          </div>
          <div className="main-topbar-actions">
            {/* Role + name badge */}
            <div className="main-topbar-user-badge">
              <span className="main-topbar-role-chip">{displayRole}</span>
              <span className="main-topbar-username">{displayName}</span>
            </div>
            {/* Notification */}
            <button className="main-topbar-notif" title="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            {/* Sign Out */}
            <button className="main-topbar-logout" onClick={handleLogout} title="Sign out">
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
        <div className="main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;