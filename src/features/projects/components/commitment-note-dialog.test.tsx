import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CommitmentNoteDialog } from "@/features/projects/components/commitment-note-dialog"

describe("registro da Nota de Empenho", () => {
  it("exige confirmação do impacto financeiro antes de consumir o saldo", async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <CommitmentNoteDialog
          projectId="project-1"
          projectCode={42}
          open
          onOpenChange={() => undefined}
          onSaved={() => undefined}
        />
      </QueryClientProvider>,
    )

    const submit = screen.getByRole("button", { name: "Registrar e liberar OS" })
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole("checkbox", { name: /Confirmo que a Nota de Empenho/ }))

    expect(submit).toBeEnabled()
  })
})
