// import { NavLink } from "react-router-dom";
// import { useSelector } from "react-redux";
// import { ROLES } from "../constants/roles";
// import "../styles/main-layout.css";
// import {
//   BulbOutlined,
//   PlusOutlined,
//   BarChartOutlined,
//   TeamOutlined,
//   ApartmentOutlined,
//   CalendarOutlined,
//   DashboardOutlined,
// } from "@ant-design/icons";

// const Sidebar = () => {
//   const user = useSelector((state) => state.auth.user);

//   const navClass = ({ isActive }) =>
//     `nav-item ${isActive ? "active" : ""}`;

//   return (
//     <aside className="main-sidebar">

//       {/* LOGO */}
//       <div className="sidebar-logo">
//         <h2>Idea System</h2>
//       </div>

//       {/* MENU */}
//       <nav className="sidebar-menu">

//         {/* STAFF */}
//         {user?.role === ROLES.STAFF && (
//           <div className="menu-section">

//             <p className="menu-section-title">
//               Staff
//             </p>

//             <NavLink to="/ideas" className={navClass}>
//               <BulbOutlined />
//               <span>Idea List</span>
//             </NavLink>

//             <NavLink to="/submit-idea" className={navClass}>
//               <PlusOutlined />
//               <span>Submit Idea</span>
//             </NavLink>

//           </div>
//         )}

//         {/* QA COORDINATOR */}
//         {user?.role === ROLES.QA_COORDINATOR && (
//           <div className="menu-section">

//             <p className="menu-section-title">
//               QA Coordinator
//             </p>

//             <NavLink to="/ideas" className={navClass}>
//               <BulbOutlined />
//               <span>Department Ideas</span>
//             </NavLink>

//             <NavLink to="/coordinator/dashboard" className={navClass}>
//               <DashboardOutlined />
//               <span>Department Dashboard</span>
//             </NavLink>

//           </div>
//         )}

//         {/* QA MANAGER */}
//         {user?.role === ROLES.QA_MANAGER && (
//           <div className="menu-section">

//             <p className="menu-section-title">
//               QA Manager
//             </p>

//             <NavLink to="/ideas" className={navClass}>
//               <BulbOutlined />
//               <span>All Ideas</span>
//             </NavLink>

//             <NavLink to="/statistics" className={navClass}>
//               <BarChartOutlined />
//               <span>Statistics</span>
//             </NavLink>

//           </div>
//         )}

//         {/* ADMIN */}
//         {user?.role === ROLES.ADMIN && (
//           <div className="menu-section">

//             <p className="menu-section-title">
//               Admin
//             </p>

//             <NavLink to="/admin" className={navClass}>
//               <DashboardOutlined />
//               <span>Admin Dashboard</span>
//             </NavLink>

//             <NavLink to="/admin/users" className={navClass}>
//               <TeamOutlined />
//               <span>User Management</span>
//             </NavLink>

//             <NavLink to="/admin/departments" className={navClass}>
//               <ApartmentOutlined />
//               <span>Departments</span>
//             </NavLink>

//             <NavLink to="/admin/academic-years" className={navClass}>
//               <CalendarOutlined />
//               <span>Academic Years</span>
//             </NavLink>

//           </div>
//         )}

//       </nav>

//       {/* FOOTER */}
//       <div className="sidebar-footer">
//         <p className="sidebar-footer-text">
//           Enterprise Idea System v1.0
//         </p>
//       </div>

//     </aside>
//   );
// };

// export default Sidebar;