import { createBrowserRouter, Outlet } from "react-router";

import { ProtectedRoute } from "./auth/ProtectedRoute";

// Auth
import LoginScreen from "./screens/auth/LoginScreen";

// Layouts
import Layout from "./components/layouts/Layout";
import TecnicoLayout from "./components/layouts/TecnicoLayout";
import AdminLayout from "./components/layouts/AdminLayout";

// Médico
import DashboardScreen from "./screens/medico/DashboardScreen";
import PatientListScreen from "./screens/medico/PatientListScreen";
import NewPatientScreen from "./screens/medico/NewPatientScreen";
import PatientRecordScreen from "./screens/medico/PatientRecordScreen";
import ExamViewerScreen from "./screens/medico/ExamViewerScreen";
import ExamComparisonScreen from "./screens/medico/ExamComparisonScreen";
import ReportGenerationScreen from "./screens/medico/ReportGenerationScreen";
import GlassBreakScreen from "./screens/medico/GlassBreakScreen";

// Técnico
import TecnicoDashboardScreen from "./screens/tecnico/TecnicoDashboardScreen";
import ExamUploadScreen from "./screens/tecnico/ExamUploadScreen";
import ExamQueueScreen from "./screens/tecnico/ExamQueueScreen";
import TecnicoPatientsScreen from "./screens/tecnico/TecnicoPatientsScreen";

// Admin
import AdminDashboardScreen from "./screens/admin/AdminDashboardScreen";
import AdminUsersScreen from "./screens/admin/AdminUsersScreen";
import AdminAuditScreen from "./screens/admin/AdminAuditScreen";
import AdminSettingsScreen from "./screens/admin/AdminSettingsScreen";
import AdminAIScreen from "./screens/admin/AdminAIScreen";
import AdminComplianceScreen from "./screens/admin/AdminComplianceScreen";

// Shared
import UIAuditScreen from "./screens/shared/UIAuditScreen";
import Error403Screen from "./screens/shared/Error403Screen";
import Error404Screen from "./screens/shared/Error404Screen";

// Mobile
import OnboardingScreen from "./screens/mobile/OnboardingScreen";
import MobileLoginScreen from "./screens/mobile/MobileLoginScreen";
import MobileHomeScreen from "./screens/mobile/MobileHomeScreen";
import ExamListScreen from "./screens/mobile/ExamListScreen";
import ExamDetailScreen from "./screens/mobile/ExamDetailScreen";
import ExamComparisonMobileScreen from "./screens/mobile/ExamComparisonMobileScreen";
import WellnessLogScreen from "./screens/mobile/WellnessLogScreen";
import AssistantScreen from "./screens/mobile/AssistantScreen";
import NotificationsScreen from "./screens/mobile/NotificationsScreen";
import ProfileScreen from "./screens/mobile/ProfileScreen";
import TwoFactorSetupScreen from "./screens/mobile/TwoFactorSetupScreen";

export const router = createBrowserRouter([
  // ─── Público ────────────────────────────────────────────────────────────
  {
    path: "/login",
    Component: LoginScreen,
  },
  {
    path: "/403",
    Component: Error403Screen,
  },

  // ─── Médico Especialista ───────────────────────────────────────────────
  {
    path: "/",
    element: (
      <ProtectedRoute perfis="MEDICO">
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: DashboardScreen },
      { path: "patients", Component: PatientListScreen },
      { path: "patients/new", Component: NewPatientScreen },
      { path: "patients/:id", Component: PatientRecordScreen },
      { path: "exam-viewer", Component: ExamViewerScreen },
      { path: "exam-comparison", Component: ExamComparisonScreen },
      { path: "report-generation", Component: ReportGenerationScreen },
      { path: "glass-break", Component: GlassBreakScreen },
      { path: "*", Component: Error404Screen },
    ],
  },

  // ─── Técnico de Saúde ──────────────────────────────────────────────────
  {
    path: "/tecnico",
    element: (
      <ProtectedRoute perfis="TECNICO">
        <TecnicoLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: TecnicoDashboardScreen },
      { path: "upload", Component: ExamUploadScreen },
      { path: "queue", Component: ExamQueueScreen },
      { path: "patients", Component: TecnicoPatientsScreen },
      { path: "*", Component: Error404Screen },
    ],
  },

  // ─── Administrador ─────────────────────────────────────────────────────
  {
    path: "/admin-panel",
    element: (
      <ProtectedRoute perfis="ADMIN">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: AdminDashboardScreen },
      { path: "users", Component: AdminUsersScreen },
      { path: "audit", Component: AdminAuditScreen },
      { path: "settings", Component: AdminSettingsScreen },
      { path: "ai", Component: AdminAIScreen },
      { path: "compliance", Component: AdminComplianceScreen },
      // Auditoria UI/UX — só admin tem acesso, e só por URL directo
      // (não aparece na sidebar por ser uma ferramenta interna de QA)
      { path: "ui-audit", Component: UIAuditScreen },
      { path: "*", Component: Error404Screen },
    ],
  },

  // ─── Mobile (Paciente) ─────────────────────────────────────────────────
  // Onboarding e MobileLogin ficam públicos; o resto é protegido para
  // pacientes autenticados.
  {
    path: "/mobile",
    children: [
      { index: true, Component: OnboardingScreen },
      { path: "login", Component: MobileLoginScreen },
      {
        element: (
          <ProtectedRoute perfis="PACIENTE">
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { path: "home", Component: MobileHomeScreen },
          { path: "exams", Component: ExamListScreen },
          { path: "exam-detail", Component: ExamDetailScreen },
          { path: "exam-comparison", Component: ExamComparisonMobileScreen },
          { path: "wellness-log", Component: WellnessLogScreen },
          { path: "assistant", Component: AssistantScreen },
          { path: "notifications", Component: NotificationsScreen },
          { path: "profile", Component: ProfileScreen },
          { path: "2fa-setup", Component: TwoFactorSetupScreen },
        ],
      },
      { path: "*", Component: Error404Screen },
    ],
  },

  // ─── Catch-all ─────────────────────────────────────────────────────────
  {
    path: "*",
    Component: Error404Screen,
  },
]);
