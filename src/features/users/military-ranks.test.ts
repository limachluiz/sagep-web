import { describe, expect, it } from "vitest"

import { isMilitaryRank, militaryRanks } from "./military-ranks"

describe("militaryRanks", () => {
  it("expõe as opções na ordem definida para os formulários", () => {
    expect(militaryRanks).toEqual([
      "Sd",
      "Cb",
      "3º Sgt",
      "2º Sgt",
      "1º Sgt",
      "St",
      "Asp",
      "2º Ten",
      "1º Ten",
      "Cap",
      "Maj",
      "TC",
      "Cel",
    ])
  })

  it("distingue valores selecionáveis de texto livre", () => {
    expect(isMilitaryRank("1º Ten")).toBe(true)
    expect(isMilitaryRank("General")).toBe(false)
  })
})
