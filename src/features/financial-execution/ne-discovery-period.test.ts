import { describe, expect, it } from "vitest"
import { suggestedPeriod, type Pregao } from "./ne-discovery-period"
const pregao = (start: string | null, end: string | null): Pregao => ({ id: "1", number: "1", year: "2026", uasg: "160016", type: "CFTV", atas: [{ number: "1", vendorName: "Fornecedor", vendorCnpj: "12345678000190", validFrom: start, validUntil: end }] })
describe("intervalo da busca de NEs", () => {
  it("combina três pregões independentemente da ordem", () => {
    expect(suggestedPeriod([pregao("2026-01-01", "2027-01-01"), pregao("2025-06-01", "2026-06-01"), pregao("2026-03-01", "2028-03-01")])).toEqual({ start: "2025-06-01", end: "2028-03-01", incomplete: false })
  })
  it("sinaliza dados ausentes sem inventar vigência", () => {
    expect(suggestedPeriod([pregao(null, "2026-06-01")])).toEqual({ start: "", end: "2026-06-01", incomplete: true })
    expect(suggestedPeriod([]).incomplete).toBe(true)
  })
})
