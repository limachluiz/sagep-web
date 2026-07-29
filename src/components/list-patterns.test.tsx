import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FolderSearch } from "lucide-react"
import { describe, expect, it, vi } from "vitest"

import { EmptyState } from "@/components/data-table-state"
import { FilterToolbar, SearchField } from "@/components/filter-toolbar"
import { ListPagination } from "@/components/list-pagination"

describe("padrões das listas", () => {
  it("expõe a busca dentro da barra de filtros", () => {
    render(
      <FilterToolbar>
        <SearchField aria-label="Buscar projetos" placeholder="Buscar..." />
      </FilterToolbar>,
    )

    expect(screen.getByText("Filtros da consulta")).toBeInTheDocument()
    expect(screen.getByRole("searchbox", { name: "Buscar projetos" })).toBeInTheDocument()
  })

  it("apresenta estado vazio com orientação e ação", () => {
    render(
      <EmptyState
        icon={FolderSearch}
        title="Nenhum projeto encontrado"
        description="Ajuste os filtros."
        action={<button type="button">Novo projeto</button>}
      />,
    )

    expect(screen.getByText("Nenhum projeto encontrado")).toBeInTheDocument()
    expect(screen.getByText("Ajuste os filtros.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Novo projeto" })).toBeInTheDocument()
  })

  it("navega e altera a quantidade de itens por página", async () => {
    const user = userEvent.setup()
    const onPrevious = vi.fn()
    const onNext = vi.fn()
    const onPageSizeChange = vi.fn()

    render(
      <ListPagination
        page={2}
        totalPages={4}
        hasPreviousPage
        hasNextPage
        pageSize={10}
        onPrevious={onPrevious}
        onNext={onNext}
        onPageSizeChange={onPageSizeChange}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Página anterior" }))
    await user.click(screen.getByRole("button", { name: "Próxima página" }))
    await user.click(screen.getByRole("combobox", { name: "itens por página" }))
    await user.click(screen.getByRole("option", { name: "25" }))

    expect(onPrevious).toHaveBeenCalledOnce()
    expect(onNext).toHaveBeenCalledOnce()
    expect(onPageSizeChange).toHaveBeenCalledWith(25)
  })
})
