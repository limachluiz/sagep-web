import { afterEach, describe, expect, it, vi } from "vitest"

import { openPdfPreview } from "@/lib/pdf-preview"

describe("openPdfPreview", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("abre a aba antes de aguardar a resposta e exibe o blob como PDF", async () => {
    vi.useFakeTimers()
    const replace = vi.fn()
    const close = vi.fn()
    const popup = {
      opener: window,
      document: { title: "", body: { textContent: "", style: {} } },
      location: { replace },
      close,
    } as unknown as Window
    const open = vi.spyOn(window, "open").mockReturnValue(popup)
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:pdf")
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined)
    const loadPdf = vi.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" }))

    await openPdfPreview(loadPdf, "Estimativa")

    expect(open).toHaveBeenCalledBefore(loadPdf)
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(replace).toHaveBeenCalledWith("blob:pdf")
    expect(close).not.toHaveBeenCalled()

    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:pdf")
  })

  it("informa quando o navegador bloqueia a nova aba sem iniciar a requisição", async () => {
    vi.spyOn(window, "open").mockReturnValue(null)
    const loadPdf = vi.fn()

    await expect(openPdfPreview(loadPdf, "Documento")).rejects.toThrow("bloqueou a nova aba")
    expect(loadPdf).not.toHaveBeenCalled()
  })
})
