import { describe, expect, it } from "vitest"

import { previousPeriodFilters } from "../executive-period"

describe("previousPeriodFilters", () => {
  it("calcula o mês anterior", () => {
    expect(previousPeriodFilters("month", { periodType: "month", referenceDate: "2026-07-26" })).toEqual({
      periodType: "month",
      referenceDate: "2026-06-26",
    })
  })

  it("calcula o trimestre anterior", () => {
    expect(previousPeriodFilters("quarter", { periodType: "quarter", referenceDate: "2026-07-26" })).toEqual({
      periodType: "quarter",
      referenceDate: "2026-04-26",
    })
  })

  it("calcula intervalo anterior com a mesma duração", () => {
    expect(previousPeriodFilters("interval", { startDate: "2026-07-01", endDate: "2026-07-10" })).toEqual({
      startDate: "2026-06-21",
      endDate: "2026-06-30",
    })
  })

  it("preserva os filtros da carteira ao comparar períodos", () => {
    expect(previousPeriodFilters("year", {
      periodType: "year",
      referenceDate: "2026-07-26",
      stateUf: "AM",
      projectType: "CFTV",
      ownerId: "user-test",
    })).toEqual({
      periodType: "year",
      referenceDate: "2025-07-26",
      stateUf: "AM",
      projectType: "CFTV",
      ownerId: "user-test",
    })
  })

  it("não compara visão acumulada nem posição histórica", () => {
    expect(previousPeriodFilters("all", {})).toBeNull()
    expect(previousPeriodFilters("as_of", { asOfDate: "2026-07-26" })).toBeNull()
  })
})
