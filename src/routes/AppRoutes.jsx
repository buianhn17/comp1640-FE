import { Routes, Route, Navigate } from "react-router-dom";
/* AUTH */
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
/* LAYOUT */
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
/* GUARD */
import ProtectedRoute from "./ProtectedRoute";
/* ROLES */
import { ROLES } from "../constants/roles";
/* PAGES */
import IdeaList from "../pages/ideas/IdeaList";
import IdeaDetail from "../pages/ideas/IdeaDetail";
import SubmitIdea from "../pages/ideas/SubmitIdea";
import TermsAccept from "../pages/terms/TermsAccept";
import Statistics from "../pages/statistics/Statistics";
import CategoryManagement from "../pages/manager/CategoryManagement";
import ExceptionReports from "../pages/manager/ExceptionReports";
import ExportData from "../pages/manager/ExportData";
import AdminDashboard from "../pages/admin/AdminDashboard";
import UsersManagement from "../pages/admin/UsersManagement";
import DepartmentManagement from "../pages/admin/DepartmentManagement";
import AcademicYearManagement from "../pages/admin/AcademicYearManagement";
import TermsConditions from "../pages/admin/TermsConditions";
import AttachmentManagement from "../pages/admin/AttachmentManagement";
import CoordinatorDashboard from "../pages/coordinator/CoordinatorDashboard";
import CoordinatorNotifications from "../pages/coordinator/CoordinatorNotifications";

// Roles được submit idea (Cột Academic & Support)
const SUBMIT_ROLES = [ROLES.ACADEMIC, ROLES.SUPPORT];

// Roles được xem statistics (Theo bảng)
const STATS_ROLES = [
  ROLES.ADMIN,
  ROLES.QA_MANAGER,
  ROLES.QA_COORDINATOR, 
  ROLES.DEPT_MANAGER,   
  ROLES.HR_MANAGER,     
  ROLES.HEAD,           
];

const AppRoutes = () => {
  return (
    <Routes>
      {/* ── AUTH ── */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ── MAIN LAYOUT ── */}
      <Route element={<MainLayout />}>
        <Route
          path="/ideas"
          element={
            <ProtectedRoute roles={Object.values(ROLES)}>
              <IdeaList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ideas/:id"
          element={
            <ProtectedRoute roles={Object.values(ROLES)}>
              <IdeaDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/submit-idea"
          element={
            <ProtectedRoute roles={SUBMIT_ROLES}>
              <SubmitIdea />
            </ProtectedRoute>
          }
        />

        <Route
          path="/terms"
          element={
            <ProtectedRoute roles={SUBMIT_ROLES}>
              <TermsAccept />
            </ProtectedRoute>
          }
        />

        <Route
          path="/coordinator/dashboard"
          element={
            <ProtectedRoute roles={[ROLES.QA_COORDINATOR]}>
              <CoordinatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/notifications"
          element={
            <ProtectedRoute roles={[ROLES.QA_COORDINATOR]}>
              <CoordinatorNotifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/statistics"
          element={
            <ProtectedRoute roles={STATS_ROLES}>
              <Statistics />
            </ProtectedRoute>
          }
        />

        {/* QA MANAGER ONLY: Category, Exceptions, Export */}
        <Route
          path="/manager/categories"
          element={
            <ProtectedRoute roles={[ROLES.QA_MANAGER]}>
              <CategoryManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/exceptions"
          element={
            <ProtectedRoute roles={[ROLES.QA_MANAGER]}>
              <ExceptionReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/export"
          element={
            <ProtectedRoute roles={[ROLES.QA_MANAGER]}>
              <ExportData />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ── ADMIN LAYOUT ── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="academic-years" element={<AcademicYearManagement />} />
        <Route path="terms" element={<TermsConditions />} />
        <Route path="attachments" element={<AttachmentManagement />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;