import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router"

import { Skeleton } from "@/components/ui/skeleton"
import { ProtectedRoute } from "@/features/auth/components/protected-route"
import { PermissionRoute } from "@/features/auth/components/permission-route"
import { AuthenticatedLayout } from "@/layouts/authenticated-layout"

const AtaDetailsPage = lazy(() => import("@/features/atas/pages/ata-details-page").then((module) => ({ default: module.AtaDetailsPage })))
const AtasPage = lazy(() => import("@/features/atas/pages/atas-page").then((module) => ({ default: module.AtasPage })))
const AccessDeniedPage = lazy(() => import("@/features/auth/pages/access-denied-page").then((module) => ({ default: module.AccessDeniedPage })))
const SessionsPage = lazy(() => import("@/features/auth/pages/sessions-page").then((module) => ({ default: module.SessionsPage })))
const LoginPage = lazy(() => import("@/features/auth/pages/login-page").then((module) => ({ default: module.LoginPage })))
const HomePage = lazy(() => import("@/features/home/pages/home-page").then((module) => ({ default: module.HomePage })))
const DashboardPage = lazy(() => import("@/features/dashboard/pages/dashboard-page").then((module) => ({ default: module.DashboardPage })))
const DiexDetailsPage = lazy(() => import("@/features/diex/pages/diex-details-page").then((module) => ({ default: module.DiexDetailsPage })))
const DiexListPage = lazy(() => import("@/features/diex/pages/diex-list-page").then((module) => ({ default: module.DiexListPage })))
const EstimateDetailsPage = lazy(() => import("@/features/estimates/pages/estimate-details-page").then((module) => ({ default: module.EstimateDetailsPage })))
const EstimatesListPage = lazy(() => import("@/features/estimates/pages/estimates-list-page").then((module) => ({ default: module.EstimatesListPage })))
const CreateEstimatePage = lazy(() => import("@/features/estimates/pages/create-estimate-page").then((module) => ({ default: module.CreateEstimatePage })))
const MilitaryOrganizationsPage = lazy(() => import("@/features/military-organizations/pages/military-organizations-page").then((module) => ({ default: module.MilitaryOrganizationsPage })))
const ProjectDetailsPage = lazy(() => import("@/features/projects/pages/project-details-page").then((module) => ({ default: module.ProjectDetailsPage })))
const ProjectsKanbanPage = lazy(() => import("@/features/projects/pages/projects-kanban-page").then((module) => ({ default: module.ProjectsKanbanPage })))
const ProjectsListPage = lazy(() => import("@/features/projects/pages/projects-list-page").then((module) => ({ default: module.ProjectsListPage })))
const ServiceOrdersGanttPage = lazy(() => import("@/features/service-orders/pages/service-orders-gantt-page").then((module) => ({ default: module.ServiceOrdersGanttPage })))
const ServiceOrderDetailsPage = lazy(() => import("@/features/service-orders/pages/service-order-details-page").then((module) => ({ default: module.ServiceOrderDetailsPage })))
const ServiceOrdersListPage = lazy(() => import("@/features/service-orders/pages/service-orders-list-page").then((module) => ({ default: module.ServiceOrdersListPage })))
const TaskDetailsPage = lazy(() => import("@/features/tasks/pages/task-details-page").then((module) => ({ default: module.TaskDetailsPage })))
const TasksListPage = lazy(() => import("@/features/tasks/pages/tasks-list-page").then((module) => ({ default: module.TasksListPage })))
const UserProfilePage = lazy(() => import("@/features/users/pages/user-profile-page").then((module) => ({ default: module.UserProfilePage })))
const UsersPage = lazy(() => import("@/features/users/pages/users-page").then((module) => ({ default: module.UsersPage })))
const PermissionsSettingsPage = lazy(() => import("@/features/permissions/pages/permissions-settings-page").then((module) => ({ default: module.PermissionsSettingsPage })))
const ReportsPage = lazy(() => import("@/features/reports/pages/reports-page").then((module) => ({ default: module.ReportsPage })))
const AuditPage = lazy(() => import("@/features/audit/pages/audit-page").then((module) => ({ default: module.AuditPage })))

function PageFallback() {
  return <div className="space-y-5 p-4" role="status" aria-live="polite"><span className="sr-only">Carregando página</span><Skeleton className="h-8 w-64" /><Skeleton className="h-24 w-full" /><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div></div>
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}><Routes>
      <Route path="/" element={<Navigate to="/inicio" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/inicio" element={<HomePage />} />
          <Route path="/user" element={<UserProfilePage />} />
          <Route
            path="/dashboard"
            element={
              <PermissionRoute anyOf={["dashboard.financial_view", "dashboard.view_operational", "dashboard.view_executive"]}>
                <DashboardPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/dashboard/executive"
            element={
              <PermissionRoute anyOf={["dashboard.view_executive"]}>
                <Navigate to="/dashboard?view=executive" replace />
              </PermissionRoute>
            }
          />
          <Route
            path="/dashboard/operational"
            element={
              <PermissionRoute anyOf={["dashboard.view_operational"]}>
                <Navigate to="/dashboard?view=operational" replace />
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
            path="/tasks"
            element={
              <PermissionRoute anyOf={["tasks.view_all", "tasks.create", "tasks.edit_all", "tasks.edit_own", "tasks.complete", "tasks.assign", "tasks.archive", "tasks.restore", "tasks.delete"]}>
                <TasksListPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/tasks/:taskId"
            element={
              <PermissionRoute anyOf={["tasks.view_all", "tasks.create", "tasks.edit_all", "tasks.edit_own", "tasks.complete", "tasks.assign", "tasks.archive", "tasks.restore", "tasks.delete"]}>
                <TaskDetailsPage />
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
              <PermissionRoute anyOf={["atas.manage", "projects.view_all", "estimates.view_all"]}>
                <AtasPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/atas/:ataId"
            element={
              <PermissionRoute anyOf={["atas.manage", "projects.view_all", "estimates.view_all"]}>
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
            path="/audit"
            element={
              <PermissionRoute anyOf={["audit.view"]}>
                <AuditPage />
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

      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes></Suspense>
  )
}
