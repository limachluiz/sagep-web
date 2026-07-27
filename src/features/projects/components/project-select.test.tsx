import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ProjectSelect } from "@/features/projects/components/project-select"
import { projectOptionLabel } from "@/features/projects/components/project-select.utils"
import type { ProjectListItem } from "@/features/projects/projects.types"

const project = {
  id: "project-1",
  projectCode: 42,
  title: "Projeto de teste",
  om: { sigla: "OM Teste" },
} as ProjectListItem

describe("ProjectSelect", () => {
  it("apresenta o projeto por código amigável, título e OM", () => {
    expect(projectOptionLabel(project)).toBe("PRJ-42 · Projeto de teste · OM Teste")
  })

  it("mantém o ID interno no valor selecionado", async () => {
    const onValueChange = vi.fn()
    render(
      <ProjectSelect
        projects={[project]}
        value=""
        onValueChange={onValueChange}
        allowAll
        ariaLabel="Filtrar por projeto"
      />,
    )

    fireEvent.click(screen.getByRole("combobox", { name: "Filtrar por projeto" }))
    fireEvent.click(await screen.findByRole("option", { name: /Projeto de teste/ }))

    expect(onValueChange).toHaveBeenCalledWith("project-1")
  })
})
