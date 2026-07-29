import { describe, expect, it } from "vitest"
import { normalizeDisplayText } from "@/lib/display-text"

describe("normalizeDisplayText", () => {
  it("decodifica entidades HTML importadas", () => {
    expect(normalizeDisplayText("Cabo &Oacute;ptico &amp; conector &#x2013; 12 fibras")).toBe("Cabo óptico & conector – 12 fibras")
    expect(normalizeDisplayText("Caixa de emenda &#243;ptica")).toBe("Caixa de emenda óptica")
  })
  it("remove controles e espaços que quebram a apresentação", () => {
    expect(normalizeDisplayText("Instalação\r\n\t de cabo\u0007  óptico")).toBe("Instalação de cabo óptico")
  })
})
