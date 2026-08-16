import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { MemoryRouter } from "react-router"

import { useAuthStore } from "@/features/auth/auth.store"
import { SettingsNavigation } from "./settings-navigation"

describe("SettingsNavigation", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().logout()
  })

  it("mantém a saúde do sistema disponível sem depender da matriz persistida", () => {
    useAuthStore.getState().setAuth({
      user: {
        id: "user-1",
        name: "Usuário",
        email: "usuario@sagep.test",
        role: "CONSULTA",
        permissions: [],
      },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    })

    render(
      <MemoryRouter initialEntries={["/settings"]}>
        <SettingsNavigation />
      </MemoryRouter>,
    )

    expect(screen.getByRole("link", { name: /saúde do sistema/i })).toHaveAttribute("href", "/settings")
    expect(screen.queryByRole("link", { name: /acessos e permissões/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /backup e restauração/i })).not.toBeInTheDocument()
  })

  it("exibe backup somente com a permissão crítica", () => {
    useAuthStore.getState().setAuth({
      user: { id: "admin-1", email: "admin@sagep.test", role: "ADMIN", permissions: ["backups.manage"] },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    })

    render(<MemoryRouter><SettingsNavigation /></MemoryRouter>)

    expect(screen.getByRole("link", { name: /backup e restauração/i })).toHaveAttribute("href", "/settings/backups")
  })
})
