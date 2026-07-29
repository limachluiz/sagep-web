import { render, screen } from "@testing-library/react"
import { LayoutDashboard } from "lucide-react"
import { describe, expect, it } from "vitest"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"

describe("PageHeader", () => {
  it("organiza contexto, título, metadados e ações da página", () => {
    render(
      <PageHeader
        eyebrow="Visão operacional"
        title="Carteira de projetos"
        description="Acompanhamento consolidado."
        icon={LayoutDashboard}
        meta="Atualizado agora"
        actions={<Button>Atualizar</Button>}
      />,
    )

    expect(screen.getByRole("heading", { name: "Carteira de projetos" })).toBeInTheDocument()
    expect(screen.getByText("Visão operacional")).toBeInTheDocument()
    expect(screen.getByText("Acompanhamento consolidado.")).toBeInTheDocument()
    expect(screen.getByText("Atualizado agora")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Atualizar" })).toBeInTheDocument()
  })
})
