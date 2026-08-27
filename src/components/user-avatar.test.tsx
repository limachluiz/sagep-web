import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, ...props }: React.ComponentProps<"span">) => <span {...props}>{children}</span>,
  AvatarImage: (props: React.ComponentProps<"img">) => <img {...props} />,
  AvatarFallback: ({ children, ...props }: React.ComponentProps<"span">) => <span {...props}>{children}</span>,
}))
import { UserAvatar } from "./user-avatar"

describe("UserAvatar", () => {
  it("exibe a foto cadastrada com descrição acessível", () => {
    render(<UserAvatar user={{ name: "Luiz Lima", avatarDataUrl: "data:image/png;base64,AAAA" }} />)
    expect(screen.getByRole("img", { name: "Foto de Luiz Lima" })).toHaveAttribute("src", "data:image/png;base64,AAAA")
  })

  it("mantém as iniciais quando não existe foto", () => {
    render(<UserAvatar user={{ name: "Luiz Lima" }} />)
    expect(screen.getByText("LL")).toBeInTheDocument()
  })
})
