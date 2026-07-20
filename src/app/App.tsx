import { Navigate, Route, Routes } from "react-router"

import { ProtectedRoute } from "@/features/auth/components/protected-route"
import { PermissionRoute } from "@/features/auth/components/permission-route"
import { AtaDetailsPage } from "@/features/atas/pages/ata-details-page"
import { AtasPage } from "@/features/atas/pages/atas-page"
import { AccessDeniedPage } from "@/features/auth/pages/access-denied-page"
import { SessionsPage } from "@/features/auth/pages/sessions-page"
import { LoginPage } from "@/features/auth/pages/login-page"
import { OperationalDashboardPage } from "@/features/dashboard/pages/operational-dashboard-page"
import { ExecutiveDashboardPage } from "@/features/dashboard/pages/executive-dashboard-page"
import { DiexDetailsPage } from "@/features/diex/pages/diex-details-page"
import { DiexListPage } from "@/features/diex/pages/diex-list-page"
import { EstimateDetailsPage } from "@/features/estimates/pages/estimate-details-page"
import { EstimatesListPage } from "@/features/estimates/pages/estimates-list-page"
import { CreateEstimatePage } from "@/features/estimates/pages/create-estimate-page"
import { MilitaryOrganizationsPage } from "@/features/military-organizations/pages/military-organizations-page"
import { ProjectDetailsPage } from "@/features/projects/pages/project-details-page"
import { ProjectsKanbanPage } from "@/features/projects/pages/projects-kanban-page"
import { ProjectsListPage } from "@/features/projects/pages/projects-list-page"
import { ServiceOrdersGanttPage } from "@/features/service-orders/pages/service-orders-gantt-page"
import { ServiceOrderDetailsPage } from "@/features/service-orders/pages/service-order-details-page"
import { ServiceOrdersListPage } from "@/features/service-orders/pages/service-orders-list-page"
import { UsersPage } from "@/features/users/pages/users-page"
import { PermissionsSettingsPage } from "@/features/permissions/pages/permissions-settings-page"
import { ReportsPage } from "@/features/reports/pages/reports-page"
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
            path="/gantt"
            element={
              <PermissionRoute anyOf={["projects.view_all", "projects.edit_own"]}>
                <ServiceOrdersGanttPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/service-orders"
            element={
              <PermissionRoute anyOf={["service_orders.issue", "projects.view_all"]}>
                <ServiceOrdersListPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/service-orders/:serviceOrderId"
            element={
              <PermissionRoute anyOf={["service_orders.issue", "projects.view_all"]}>
                <ServiceOrderDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/estimates"
            element={
              <PermissionRoute anyOf={["estimates.view_all", "estimates.create", "estimates.edit"]}>
                <EstimatesListPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/estimates/:estimateId"
            element={
              <PermissionRoute anyOf={["estimates.view_all", "estimates.create", "estimates.edit"]}>
                <EstimateDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/estimates/new"
            element={
              <PermissionRoute anyOf={["estimates.create"]}>
                <CreateEstimatePage />
              </PermissionRoute>
            }
          />
          <Route
            path="/diex"
            element={
              <PermissionRoute anyOf={["diex.issue", "estimates.view_all"]}>
                <DiexListPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/diex/:diexId"
            element={
              <PermissionRoute anyOf={["diex.issue", "estimates.view_all"]}>
                <DiexDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/atas"
            element={
              <PermissionRoute anyOf={["atas.manage"]}>
                <AtasPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/atas/:ataId"
            element={
              <PermissionRoute anyOf={["atas.manage"]}>
                <AtaDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PermissionRoute anyOf={["users.manage"]}>
                <UsersPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/military-organizations"
            element={
              <PermissionRoute anyOf={["military_organizations.manage"]}>
                <MilitaryOrganizationsPage />
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
          <Route
            path="/settings"
            element={
              <PermissionRoute anyOf={["permissions.view"]}>
                <PermissionsSettingsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PermissionRoute anyOf={["reports.export"]}>
                <ReportsPage />
              </PermissionRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
