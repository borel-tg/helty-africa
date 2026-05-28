import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

// Layouts
import { AppLayout } from "./components/layout/AppLayout";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";

// Learner pages
import LearnerDashboard from "./pages/learner/LearnerDashboard";
import ModulePage from "./pages/learner/ModulePage";
import LessonPage from "./pages/learner/LessonPage";
import ExamPage from "./pages/learner/ExamPage";
import ExamResultsPage from "./pages/learner/ExamResultsPage";
import CertificatePage from "./pages/learner/CertificatePage";
import MyCertificatesPage from "./pages/learner/MyCertificatesPage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ModulesPage from "./pages/admin/ModulesPage";
import ModuleEditorPage from "./pages/admin/ModuleEditorPage";
import EmployeesPage from "./pages/admin/EmployeesPage";
import EmployeeDetailPage from "./pages/admin/EmployeeDetailPage";
import StatisticsPage from "./pages/admin/StatisticsPage";
import CertificateTemplatePage from "./pages/admin/CertificateTemplatePage";
import NotificationsPage from "./pages/admin/NotificationsPage";

// Lead pages
import LeadDashboard from "./pages/lead/LeadDashboard";
import LearnerDetailPage from "./pages/lead/LearnerDetailPage";

// ── Route Guards ─────────────────────────────────────────────────────────────

function RequireAuth() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireRole({ roles }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(currentUser.role)) {
    // Redirect to appropriate default
    if (currentUser.role === "learner") return <Navigate to="/learn" replace />;
    if (currentUser.role === "lead") return <Navigate to="/lead" replace />;
    return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
}

function RootRedirect() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === "learner") return <Navigate to="/learn" replace />;
  if (currentUser.role === "lead") return <Navigate to="/lead" replace />;
  return <Navigate to="/admin" replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected app routes */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>

            {/* ── Learner ── */}
            <Route
              element={<RequireRole roles={["learner", "super_admin", "admin", "lead"]} />}
            >
              <Route path="/learn" element={<LearnerDashboard />} />
              <Route path="/learn/certificates" element={<MyCertificatesPage />} />
              <Route path="/learn/module/:moduleId" element={<ModulePage />} />
              <Route path="/learn/module/:moduleId/lesson/:lessonId" element={<LessonPage />} />
              <Route path="/learn/module/:moduleId/exam" element={<ExamPage />} />
              <Route path="/learn/module/:moduleId/results" element={<ExamResultsPage />} />
              <Route path="/learn/module/:moduleId/certificate" element={<CertificatePage />} />
            </Route>

            {/* ── Lead ── */}
            <Route
              element={<RequireRole roles={["lead", "admin", "super_admin"]} />}
            >
              <Route path="/lead" element={<LeadDashboard />} />
              <Route path="/lead/learner/:learnerId" element={<LearnerDetailPage />} />
              <Route path="/lead/notifications" element={<NotificationsPage />} />
            </Route>

            {/* ── Admin / Super Admin ── */}
            <Route
              element={<RequireRole roles={["admin", "super_admin"]} />}
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/modules" element={<ModulesPage />} />
              <Route path="/admin/modules/:moduleId" element={<ModuleEditorPage />} />
              <Route path="/admin/learners" element={<EmployeesPage />} />
              <Route path="/admin/learners/:empId" element={<EmployeeDetailPage />} />
              <Route path="/admin/employees" element={<Navigate to="/admin/learners" replace />} />
              <Route path="/admin/employees/:empId" element={<Navigate to="/admin/learners" replace />} />
              <Route path="/admin/stats" element={<StatisticsPage />} />
              <Route path="/admin/certificates" element={<CertificateTemplatePage />} />
              <Route path="/admin/notifications" element={<NotificationsPage />} />
            </Route>

          </Route>
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
