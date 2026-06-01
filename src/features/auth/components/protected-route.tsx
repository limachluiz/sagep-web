import { useEffect } from "react"
import { Navigate, Outlet, useLocation } from "react-router"
import { useQuery } from "@tanstack/react-query"

import { authService } from "@/features/auth/auth.service"
import { useAuthStore } from "@/features/auth/auth.store"

export function ProtectedRoute() {
  const location = useLocation()
  const { accessToken, isAuthenticated, setUser, logout } = useAuthStore()

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
    enabled: Boolean(accessToken && isAuthenticated),
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data)
    }
  }, [meQuery.data, setUser])

  useEffect(() => {
    if (meQuery.isError) {
      logout()
    }
  }, [meQuery.isError, logout])

  if (!accessToken || !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (meQuery.isLoading || meQuery.isFetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/4 p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          <p className="text-sm font-medium">Validando sessão...</p>
          <p className="mt-1 text-xs text-slate-400">
            Carregando usuário e permissões.
          </p>
        </div>
      </div>
    )
  }

  if (meQuery.isError) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}