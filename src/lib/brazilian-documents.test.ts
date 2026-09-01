import { describe, expect, it } from "vitest"

import { cnpjDigits, formatCnpj } from "@/lib/brazilian-documents"

describe("documentos brasileiros", () => {
  it("formata e normaliza CNPJ sem perder os dígitos", () => {
    expect(formatCnpj("12345678000190")).toBe("12.345.678/0001-90")
    expect(cnpjDigits("12.345.678/0001-90")).toBe("12345678000190")
  })
})
