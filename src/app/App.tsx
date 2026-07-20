import { Navigate, Route, Routes } from "react-router"

import { ProtectedRoute } from "@/features/auth/components/protected-route"
import { PermissionRoute } from "@/features/auth/components/permission-route"
import { AccessDeniedPage } from "@/features/auth/pages/access-denied-page"
import { SessionsPage } from "@/features/auth/pages/sessions-page"
import { LoginPage } from "@/features/auth/pages/login-page"
import { OperationalDashboardPage } from "@/features/dashboard/pages/operational-dashboard-page"
import { ExecutiveDashboardPage } from "@/features/dashboard/pages/executive-dashboard-page"
import { ProjectDetailsPage } from "@/features/projects/pages/project-details-page"
import { ProjectsKanbanPage } from "@/features/projects/pages/projects-kanban-page"
import { ProjectsListPage } from "@/features/projects/pages/projects-list-page"
import { AuthenticatedLayout } from "@/layouts/authenticated-layout"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route
            path="/dashboard"
            element={
              <PermissionRoute anyOf={["dashboard.view_operational"]}>
                <OperationalDashboardPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/dashboard/executive"
            element={
              <PermissionRoute anyOf={["dashboard.view_executive"]}>
                <ExecutiveDashboardPage />
              </PermissionRoute>
            }
          />
          <Route path="/acesso-negado" element={<AccessDeniedPage />} />
          <Route
            path="/projects"
            element={
              <PermissionRoute anyOf={["projects.view_all", "projects.edit_own"]}>
                <ProjectsListPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <PermissionRoute anyOf={["projects.view_all", "projects.edit_own"]}>
                <ProjectDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/kanban"
            element={
              <PermissionRoute anyOf={["projects.view_all", "projects.edit_own"]}>
                <ProjectsKanbanPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <PermissionRoute anyOf={["sessions.manage_own"]}>
                <SessionsPage />
              </PermissionRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
