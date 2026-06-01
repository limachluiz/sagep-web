import { Navigate, Route, Routes } from "react-router"

import { ProtectedRoute } from "@/features/auth/components/protected-route"
import { LoginPage } from "@/features/auth/pages/login-page"
import { OperationalDashboardPage } from "@/features/dashboard/pages/operational-dashboard-page"
import { AuthenticatedLayout } from "@/layouts/authenticated-layout"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<OperationalDashboardPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}