import { useEffect } from "react"
import { Navigate, Outlet, useLocation } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, LogOut, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { authService } from "@/features/auth/auth.service"
import { useAuthStore } from "@/features/auth/auth.store"
import { ApiError } from "@/lib/api"

export function ProtectedRoute() {
  const location = useLocation()
  const { accessToken, isAuthenticated, setUser, logout } = useAuthStore()

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const user = await authService.me()
      // Atualiza o usuário e suas permissões antes de liberar as rotas filhas.
      // Isso evita um redirecionamento indevido durante a restauração por cookie.
      setUser(user)
      return user
    },
    enabled: true,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    const sessionWasRejected =
      meQuery.error instanceof ApiError &&
      [401, 403].includes(meQuery.error.status)

    if (sessionWasRejected) {
      logout()
    }
  }, [meQuery.error, logout])

  if (meQuery.isPending) {
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
    // Sem access token em memória, esta consulta é apenas a tentativa silenciosa
    // de restaurar uma sessão pelo cookie HttpOnly. Se a API estiver fora ou o
    // cookie não existir, a tela pública de login deve continuar acessível.
    if (!accessToken) {
      return <Navigate to="/login" replace state={{ from: location }} />
    }

    const sessionWasRejected =
      meQuery.error instanceof ApiError &&
      [401, 403].includes(meQuery.error.status)

    if (sessionWasRejected) {
      return <Navigate to="/login" replace state={{ from: location }} />
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/4 p-7 text-center shadow-2xl">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-400/10 text-amber-300">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-base font-semibold">
            Não foi possível validar a sessão
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {meQuery.error.message ||
              "O backend do SAGEP não respondeu. Verifique o serviço e tente novamente."}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              onClick={() => void meQuery.refetch()}
            >
              <RefreshCw className="size-4" />
              Tentar novamente
            </Button>
            <Button
              className="flex-1 border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
              variant="outline"
              onClick={logout}
            >
              <LogOut className="size-4" />
              Voltar ao login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!accessToken || !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
