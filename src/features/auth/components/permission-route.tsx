import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router"

import { useAuthStore } from "@/features/auth/auth.store"
import type { Permission } from "@/features/auth/auth.types"

type PermissionRouteProps = {
  anyOf: Permission[]
  children: ReactNode
}

export function PermissionRoute({ anyOf, children }: PermissionRouteProps) {
  const location = useLocation()
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)

  if (!hasAnyPermission(anyOf)) {
    return (
      <Navigate
        to="/acesso-negado"
        replace
        state={{ requestedPath: location.pathname }}
      />
    )
  }

  return children
}
