import { Navigate, Route, Routes } from "react-router"

import { ProtectedRoute } from "@/features/auth/components/protected-route"
import { PermissionRoute } from "@/features/auth/components/permission-route"
import { AccessDeniedPage } from "@/features/auth/pages/access-denied-page"
import { SessionsPage } from "@/features/auth/pages/sessions-page"
import { LoginPage } from "@/features/auth/pages/login-page"
import { OperationalDashboardPage } from "@/features/dashboard/pages/operational-dashboard-page"
import { ExecutiveDashboardPage } from "@/features/dashboard/pages/executive-dashboard-page"
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
