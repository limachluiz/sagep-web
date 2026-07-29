import { describe, expect, it } from "vitest"

import type { AtaItem } from "./atas.types"
import {
  getAtaItemBalanceStatus,
  getAtaValidityStatus,
  summarizeAtaItems,
} from "./atas.utils"

function item(
  overrides: Omit<Partial<AtaItem>, "balance"> & {
    balance?: Partial<AtaItem["balance"]>
  } = {},
): AtaItem {
  const { balance, ...itemOverrides } = overrides

  return {
    id: "item-1",
    ataItemCode: 1,
    ataId: "ata-1",
    coverageGroupId: "group-1",
    referenceCode: "1",
    description: "Item de teste",
    unit: "UN",
    unitPrice: "10",
    initialQuantity: "10",
    notes: null,
    isActive: true,
    deletedAt: null,
    balance: {
      initialQuantity: "10",
      reservedQuantity: "2",
      consumedQuantity: "3",
      availableQuantity: "5",
      initialAmount: "100",
      reservedAmount: "20",
      consumedAmount: "30",
      availableAmount: "50",
      lowStock: false,
      insufficient: false,
      lastMovementAt: "2026-07-20T12:00:00.000Z",
      ...balance,
    },
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ata: {
      id: "ata-1",
      ataCode: 1,
      number: "001/2026",
      type: "CFTV",
      vendorName: "Fornecedor",
      isActive: true,
      externalUasg: null,
    },
    coverageGroup: {
      id: "group-1",
      code: "MNS",
      name: "Manaus",
      description: null,
      localities: [],
    },
    ...itemOverrides,
  }
}

describe("ATA validity", () => {
  const now = new Date("2026-07-28T12:00:00.000Z").getTime()

  it("prioritizes the inactive status", () => {
    expect(getAtaValidityStatus({ isActive: false, validUntil: "2027-01-01" }, now)).toBe("INACTIVE")
  })

  it("identifies expired and expiring ATAs", () => {
    expect(getAtaValidityStatus({ isActive: true, validUntil: "2026-07-20" }, now)).toBe("EXPIRED")
    expect(getAtaValidityStatus({ isActive: true, validUntil: "2026-08-20" }, now)).toBe("EXPIRING")
  })
})

describe("ATA item balances", () => {
  it("classifies inactive, exhausted and low-stock items", () => {
    expect(getAtaItemBalanceStatus(item({ isActive: false }))).toBe("INACTIVE")
    expect(getAtaItemBalanceStatus(item({ balance: { availableQuantity: "0", insufficient: true } }))).toBe("EXHAUSTED")
    expect(getAtaItemBalanceStatus(item({ balance: { availableQuantity: "1", lowStock: true } }))).toBe("LOW")
  })

  it("consolidates financial allocation and reconciliation indicators", () => {
    const result = summarizeAtaItems([
      item({
        latestExternalBalanceSnapshot: {
          source: "COMPRAS_GOV",
          status: "DIVERGENT",
          externalBalance: { availableQuantity: "4" },
          difference: "1",
          lastSyncAt: "2026-07-25T12:00:00.000Z",
          warnings: [],
        },
      }),
      item({
        id: "item-2",
        balance: {
          initialAmount: "200",
          reservedAmount: "40",
          consumedAmount: "60",
          availableAmount: "100",
          lastMovementAt: "2026-07-27T12:00:00.000Z",
        },
      }),
    ])

    expect(result.initialAmount).toBe(300)
    expect(result.allocatedAmount).toBe(150)
    expect(result.utilizationPercentage).toBe(50)
    expect(result.synchronizedCount).toBe(1)
    expect(result.divergentCount).toBe(1)
    expect(result.lastMovementAt).toBe("2026-07-27T12:00:00.000Z")
  })
})
