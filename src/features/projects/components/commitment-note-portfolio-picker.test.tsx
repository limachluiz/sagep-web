import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CommitmentNotePortfolioPicker } from "./commitment-note-portfolio-picker"

afterEach(() => vi.unstubAllGlobals())

describe("seleção de NE da Carteira", () => {
  it("mostra a situação financeira e devolve a NE escolhida", async () => {
    const entry = {
      externalCode: "160016000012026NE000534",
      origin: "IMPORTED",
      observation: "Projeto executado",
      attendedOm: { sigla: "4º CTA", name: "4º Centro de Telemática de Área" },
      financial: { current: 33698.4, liquidated: 33698.4, paid: 33698.4, issuedAt: "2026-08-13", status: "PAGA" },
    }
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [entry], total: 1 }), { status: 200, headers: { "Content-Type": "application/json" } })))
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(<QueryClientProvider client={new QueryClient()}><CommitmentNotePortfolioPicker open onOpenChange={() => undefined} onSelect={onSelect} /></QueryClientProvider>)

    expect(await screen.findByText(/Empenhado:/)).toBeInTheDocument()
    expect(screen.getByText("Paga")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /2026NE000534/ }))
    expect(onSelect).toHaveBeenCalledWith(entry)
  })
})
