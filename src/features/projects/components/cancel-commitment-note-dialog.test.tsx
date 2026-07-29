import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CancelCommitmentNoteDialog } from "@/features/projects/components/cancel-commitment-note-dialog"

describe("cancelamento da Nota de Empenho", () => {
  it("exige motivo e confirmação explícita antes do rollback", async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <CancelCommitmentNoteDialog
          projectId="project-1"
          projectCode={42}
          commitmentNoteNumber="2026NE000456"
          hasServiceOrder
          open
          onOpenChange={() => undefined}
          onCancelled={() => undefined}
        />
      </QueryClientProvider>,
    )

    const rollback = screen.getByRole("button", { name: "Confirmar rollback" })
    expect(rollback).toBeDisabled()
    expect(screen.getByText(/a OS também será cancelada/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText("Motivo do cancelamento"), "Empenho anulado pela SALC")
    await user.type(screen.getByLabelText(/Digite/), "cancelar ne")

    expect(rollback).toBeEnabled()
  })
})
