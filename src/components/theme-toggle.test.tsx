import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ThemeToggle } from "@/components/theme-toggle"

const themeState = vi.hoisted(() => ({
  resolvedTheme: "dark",
  setTheme: vi.fn(),
}))

vi.mock("next-themes", () => ({
  useTheme: () => themeState,
}))

describe("ThemeToggle", () => {
  beforeEach(() => {
    themeState.resolvedTheme = "dark"
    themeState.setTheme.mockReset()
  })

  it("alterna do tema escuro para o claro", async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole("button", { name: "Ativar tema claro" }))

    expect(themeState.setTheme).toHaveBeenCalledWith("light")
  })

  it("alterna do tema claro para o escuro", async () => {
    themeState.resolvedTheme = "light"
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(screen.getByRole("button", { name: "Ativar tema escuro" }))

    expect(themeState.setTheme).toHaveBeenCalledWith("dark")
  })
})
