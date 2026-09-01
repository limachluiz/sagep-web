import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { Ata, AtaItem } from "../atas.types"
import { AtaItemDialog } from "./ata-item-dialog"

const ata: Ata = {
  id: "ata-1",
  ataCode: 1,
  number: "001/2026",
  type: "CFTV",
  vendorName: "Fornecedor",
  vendorCnpj: null,
  managingAgency: "4º CTA",
  validFrom: "2026-01-01",
  validUntil: "2026-12-31",
  notes: null,
  isActive: true,
  coverageGroups: [
    {
      id: "group-1",
      code: "MNS",
      name: "Manaus",
      description: null,
      localities: [{ cityName: "Manaus", stateUf: "AM" }],
    },
  ],
}

function existingItem(lastMovementAt: string | null): AtaItem {
  return {
    id: "item-1",
    ataItemCode: 1,
    ataId: ata.id,
    coverageGroupId: "group-1",
    referenceCode: "1",
    description: "Item de teste",
    unit: "UN",
    unitPrice: "100",
    initialQuantity: "10",
    notes: null,
    isActive: true,
    deletedAt: null,
    balance: {
      initialQuantity: "10",
      reservedQuantity: "1",
      consumedQuantity: "1",
      availableQuantity: "8",
      initialAmount: "1000",
      reservedAmount: "100",
      consumedAmount: "100",
      availableAmount: "800",
      lowStock: false,
      insufficient: false,
      lastMovementAt,
    },
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ata: {
      id: ata.id,
      ataCode: ata.ataCode,
      number: ata.number,
      type: ata.type,
      vendorName: ata.vendorName,
      isActive: ata.isActive,
      externalUasg: null,
    },
    coverageGroup: ata.coverageGroups[0],
  }
}

describe("AtaItemDialog", () => {
  it("bloqueia a base financeira depois da primeira movimentação", () => {
    render(
      <AtaItemDialog
        open
        onOpenChange={vi.fn()}
        ata={ata}
        item={existingItem("2026-07-20T12:00:00.000Z")}
        pending={false}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByDisplayValue("100")).toBeDisabled()
    expect(screen.getByDisplayValue("10")).toBeDisabled()
    expect(screen.getByText(/preserva a base financeira do histórico/i)).toBeInTheDocument()
  })

  it("mantém preço e saldo inicial editáveis quando não há movimentos", () => {
    render(
      <AtaItemDialog
        open
        onOpenChange={vi.fn()}
        ata={ata}
        item={existingItem(null)}
        pending={false}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByDisplayValue("100")).toBeEnabled()
    expect(screen.getByDisplayValue("10")).toBeEnabled()
  })
})
