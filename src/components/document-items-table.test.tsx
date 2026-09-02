import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DocumentItemsTable } from "@/components/document-items-table"

describe("DocumentItemsTable", () => {
  it("mantém colunas dimensionadas e permite quebra na descrição longa", () => {
    render(<DocumentItemsTable containerLabel="Itens requisitados" items={[{
      id: "item-1",
      code: "00001",
      description: "Serviço com uma descrição extensa que precisa permanecer dentro da coluna destinada ao texto",
      unit: "UND",
      quantity: "200",
      unitPrice: "R$ 5,22",
      totalPrice: "R$ 1.044,00",
    }]} />)

    const table = screen.getByRole("table")
    const descriptionCell = screen.getByText(/Serviço com uma descrição extensa/).closest("td")

    expect(table).toHaveClass("w-full", "table-fixed")
    expect(table).not.toHaveClass("min-w-[58rem]")
    expect(descriptionCell).toHaveClass("whitespace-normal")
    expect(screen.getByRole("region", { name: "Itens requisitados" })).toBeInTheDocument()
  })
})
