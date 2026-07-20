import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"

import { useAuthStore } from "@/features/auth/auth.store"
import type { AuthUser, Permission } from "@/features/auth/auth.types"
import { PermissionRoute } from "./permission-route"

function authenticate(permissions: Permission[], role: AuthUser["role"] = "GESTOR") {
  useAuthStore.getState().setAuth({
    user: { id: "user-1", name: "Usuário", email: "usuario@sagep.test", role, permissions },
    accessToken: "access-token",
    refreshToken: "refresh-token",
  })
}

function AccessDenied() {
  const location = useLocation()
  return <p>Acesso negado para {(location.state as { requestedPath?: string } | null)?.requestedPath}</p>
}

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={["/administracao"]}>
      <Routes>
        <Route path="/administracao" element={<PermissionRoute anyOf={["users.manage", "military_organizations.manage"]}><p>Administração disponível</p></PermissionRoute>} />
        <Route path="/acesso-negado" element={<AccessDenied />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("PermissionRoute", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().logout()
  })

  it("libera a rota quando uma das permissões é efetiva", () => {
    authenticate(["military_organizations.manage"])
    renderRoute()
    expect(screen.getByText("Administração disponível")).toBeInTheDocument()
  })

  it("redireciona e preserva o caminho solicitado quando o acesso é negado", () => {
    authenticate(["projects.view_all"], "CONSULTA")
    renderRoute()
    expect(screen.getByText("Acesso negado para /administracao")).toBeInTheDocument()
  })

  it("não ignora a matriz efetiva somente por o perfil ser ADMIN", () => {
    authenticate(["dashboard.view_operational"], "ADMIN")
    renderRoute()
    expect(screen.getByText("Acesso negado para /administracao")).toBeInTheDocument()
  })
})
