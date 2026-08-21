import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useAuthStore } from "@/features/auth/auth.store"
import type { AuthUser } from "@/features/auth/auth.types"
import type { AdminUser } from "@/features/users/users.types"
import { UsersPage } from "./users-page"

const currentUser: AuthUser = {
  id: "user-admin",
  userCode: 1,
  name: "Administrador SAGEP",
  email: "admin@sagep.com",
  role: "ADMIN",
  rank: "2º Ten",
  permissions: ["users.manage"],
}

const adminUser: AdminUser = {
  id: currentUser.id,
  userCode: 1,
  name: currentUser.name!,
  warName: null,
  email: currentUser.email,
  role: "ADMIN",
  rank: currentUser.rank!,
  cpf: null,
  active: true,
  createdAt: "2026-01-01T12:00:00.000Z",
  updatedAt: "2026-07-29T12:00:00.000Z",
}

function usersResponse(user: AdminUser) {
  return {
    items: [user],
    meta: {
      page: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    },
    filters: {},
    links: {},
  }
}

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })}>
      <UsersPage />
    </QueryClientProvider>,
  )
}

describe("UsersPage", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().setAuth({
      user: currentUser,
      accessToken: "access-token",
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    useAuthStore.getState().logout()
    localStorage.clear()
  })

  it("atualiza a sessão ao salvar o nome de guerra do próprio admin", async () => {
    let savedUser = adminUser
    vi.stubGlobal("fetch", vi.fn(async (input, init) => {
      const url = String(input)
      if (url.includes("/users/user-admin") && init?.method === "PATCH") {
        const payload = JSON.parse(String(init.body))
        expect(payload.warName).toBe("Luiz")
        savedUser = { ...savedUser, ...payload }
        return Response.json(savedUser)
      }
      if (url.includes("/users?") && init?.method === "GET") {
        return Response.json(usersResponse(savedUser))
      }
      throw new Error(`Requisição inesperada: ${init?.method} ${url}`)
    }))

    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole("button", { name: "Editar" }))
    await user.type(screen.getByLabelText("Nome de guerra"), "Luiz")
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }))

    await waitFor(() => {
      expect(useAuthStore.getState().user?.warName).toBe("Luiz")
    })
    expect(useAuthStore.getState().user?.rank).toBe("2º Ten")
  })
})
