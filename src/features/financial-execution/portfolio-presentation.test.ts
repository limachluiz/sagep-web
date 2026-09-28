import { describe, expect, it } from "vitest"
import { formatNeDate } from "./portfolio-presentation"

describe("apresentação das datas financeiras", () => {
  it("preserva a data civil sem deslocamento de fuso", () => {
    expect(formatNeDate("2026-01-21T00:00:00.000Z")).toBe("21/01/2026")
    expect(formatNeDate("24/06/2026")).toBe("24/06/2026")
  })

  it("identifica datas ausentes", () => {
    expect(formatNeDate(null)).toBe("Data não informada")
  })
})
