import { createBrowserRouter } from "react-router";

import { ProtectedRoute } from "./auth/ProtectedRoute";

// Auth
import LoginScreen from "./screens/auth/LoginScreen";
import TwoFactorVerifyScreen from "./screens/auth/TwoFactorVerifyScreen";

// Layouts
import Layout from "./components/layouts/Layout";
import TecnicoLayout from "./components/layouts/TecnicoLayout";
import AdminLayout from "./components/layouts/AdminLayout";

// Médico
import DashboardScreen from "./screens/medico/DashboardScreen";
import PatientListScreen from "./screens/medico/PatientListScreen";
import PatientRecordScreen from "./screens/medico/PatientRecordScreen";
import ExamViewerScreen from "./screens/medico/ExamViewerScreen";
import ExamComparisonScreen from "./screens/medico/ExamComparisonScreen";
import ReportGenerationScreen from "./screens/medico/ReportGenerationScreen";
import GlassBreakScreen from "./screens/medico/GlassBreakScreen";
import ExamUploadMedicoScreen from "./screens/medico/ExamUploadMedicoScreen";

// Técnico
import TecnicoDashboardScreen from "./screens/tecnico/TecnicoDashboardScreen";
import ExamUploadScreen from "./screens/tecnico/ExamUploadScreen";
import ExamQueueScreen from "./screens/tecnico/ExamQueueScreen";
import TecnicoPatientsScreen from "./screens/tecnico/TecnicoPatientsScreen";
import PatientEditScreen from "./screens/tecnico/PatientEditScreen";

// Admin
import AdminDashboardScreen from "./screens/admin/AdminDashboardScreen";
import AdminUsersScreen from "./screens/admin/AdminUsersScreen";
import AdminAuditScreen from "./screens/admin/AdminAuditScreen";
import AdminAIScreen from "./screens/admin/AdminAIScreen";

// Shared
import UIAuditScreen from "./screens/shared/UIAuditScreen";
import Error403Screen from "./screens/shared/Error403Screen";
import Error404Screen from "./screens/shared/Error404Screen";
import ProfileScreen from "./screens/shared/ProfileScreen";

export const router = createBrowserRouter([
  // ─── Público ────────────────────────────────────────────────────────────
  {
    path: "/login",
    Component: LoginScreen,
  },
  {
    path: "/auth/two-factor-verify",
    Component: TwoFactorVerifyScreen,
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
      { path: "patients/:id", Component: PatientRecordScreen },
      { path: "exam-viewer/:estudoId", Component: ExamViewerScreen },
      { path: "exam-comparison/:pacienteId", Component: ExamComparisonScreen },
      { path: "report-generation/:estudoId", Component: ReportGenerationScreen },
      { path: "glass-break/:pacienteId", Component: GlassBreakScreen },
      { path: "exam-upload/:pacienteId", Component: ExamUploadMedicoScreen },
      { path: "perfil", Component: ProfileScreen },
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
      { path: "patients/:id/edit", Component: PatientEditScreen },
      { path: "perfil", Component: ProfileScreen },
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
      { path: "ai", Component: AdminAIScreen },
      { path: "ui-audit", Component: UIAuditScreen },
      { path: "perfil", Component: ProfileScreen },
      { path: "*", Component: Error404Screen },
    ],
  },

  // ─── Catch-all ─────────────────────────────────────────────────────────
  {
    path: "*",
    Component: Error404Screen,
  },
]);
