import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter } from "react-router"

import { useAuthStore } from "@/features/auth/auth.store"
import type { AuthUser } from "@/features/auth/auth.types"
import { UserProfilePage } from "./user-profile-page"

const profile: AuthUser = {
  id: "user-1",
  userCode: 7,
  name: "Luiz Henrique Chagas de Lima",
  warName: "Lima",
  email: "luiz@sagep.mil.br",
  rank: "3º Sgt",
  cpf: "12345678909",
  role: "ADMIN",
  active: true,
  createdAt: "2026-01-10T12:00:00.000Z",
  lastLoginAt: "2026-07-29T22:00:00.000Z",
  themePreference: "DARK",
  notifications: {
    taskAssignments: true,
    deadlines: true,
    workflowUpdates: false,
  },
  permissions: ["projects.view_all", "users.manage"],
  access: {
    role: "ADMIN",
    isAdmin: true,
    permissions: ["projects.view_all", "users.manage"],
    groups: [
      {
        name: "Projetos",
        permissions: [{
          code: "projects.view_all",
          module: "projects",
          action: "view_all",
          description: "Visualizar todos os projetos",
          critical: false,
        }],
      },
      {
        name: "Usuários",
        permissions: [{
          code: "users.manage",
          module: "users",
          action: "manage",
          description: "Administrar usuários",
          critical: true,
        }],
      },
    ],
  },
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UserProfilePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("UserProfilePage", () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth({
      user: profile,
      accessToken: "access-token",
      refreshToken: "refresh-token",
    })
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    useAuthStore.getState().logout()
    localStorage.clear()
  })

  it("shows account data, groups and searchable effective permissions", async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole("heading", { name: "Perfil e acessos" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "3º Sgt Lima" })).toBeInTheDocument()
    expect(screen.getByText("Nome de guerra")).toBeInTheDocument()
    expect(screen.getByText("***.456.789-**")).toBeInTheDocument()
    expect(screen.getByText("2 grupos de acesso")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Editar perfil" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Alterar senha" })).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: "Permissões (2)" }))
    expect(screen.getByText("Visualizar todos os projetos")).toBeInTheDocument()
    expect(screen.getByText("Administrar usuários")).toBeInTheDocument()

    await user.type(screen.getByRole("textbox", { name: "Buscar permissão" }), "projetos")
    expect(screen.getByText("Visualizar todos os projetos")).toBeInTheDocument()
    expect(screen.queryByText("Administrar usuários")).not.toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it("exposes personal preferences without allowing role editing", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole("tab", { name: "Preferências" }))
    expect(screen.getByLabelText("Tema da interface")).toBeInTheDocument()
    expect(screen.getByLabelText(/Atribuições de tarefas/)).toBeChecked()
    expect(screen.getByLabelText(/Mudanças no workflow/)).not.toBeChecked()

    await user.click(screen.getByRole("button", { name: "Editar perfil" }))
    expect(screen.getByLabelText("E-mail institucional")).toBeDisabled()
    expect(screen.getByLabelText("Nome de guerra")).toHaveValue("Lima")
    expect(screen.queryByRole("combobox", { name: /perfil|função|permiss/i })).not.toBeInTheDocument()
  })
})
