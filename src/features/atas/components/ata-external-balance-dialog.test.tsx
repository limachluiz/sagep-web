import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AtaExternalBalanceDialog } from "@/features/atas/components/ata-external-balance-dialog"
import type { AtaItem } from "@/features/atas/atas.types"
import { useAuthStore } from "@/features/auth/auth.store"

const item = {
  id: "item-1",
  referenceCode: "1",
  description: "Serviço de instalação",
  unit: "SERVIÇO",
  openingBalanceAppliedAt: null,
  externalBalanceSnapshot: {
    checkedAt: "2026-09-09T13:16:11.000Z",
    managerAvailableQuantity: "9",
  },
  balance: {
    availableQuantity: "10",
  },
} as unknown as AtaItem

const externalBalance = {
  checkedAt: "2026-09-09T13:16:11.000Z",
  retrieval: "SNAPSHOT_FALLBACK",
  identity: { uasg: "160016", pregaoNumber: "90004", pregaoYear: "2025", ataNumber: "00093/2025" },
  items: [{
    ataItemId: "item-1",
    itemNumber: "1",
    referenceCode: "1",
    description: "Serviço de instalação",
    unit: "SERVIÇO",
    managerAvailableQuantity: "9",
    commitments: [],
    detailUrl: "https://contratos.sistema.gov.br/item/1",
  }],
  warnings: ["Exibindo o último snapshot salvo."],
}

function renderDialog(implantationModeActive: boolean) {
  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = String(input)
    const body = url.endsWith("/system-settings")
      ? { implantationModeActive }
      : externalBalance
    return Promise.resolve(new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }))
  })
  vi.stubGlobal("fetch", fetchMock)
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AtaExternalBalanceDialog ataId="ata-1" items={[item]} open canManage onOpenChange={() => undefined} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("aplicação do saldo oficial da ATA", () => {
  beforeEach(() => {
    useAuthStore.getState().setAuth({
      accessToken: "token",
      user: { id: "admin-1", email: "admin@sagep.local", role: "ADMIN", permissions: ["atas.manage", "settings.manage"] },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    useAuthStore.getState().logout()
  })

  it("explica que o modo de implantação precisa ser ativado", async () => {
    renderDialog(false)

    expect(await screen.findByText("Ative o modo de implantação para aplicar este saldo")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Abrir modo de implantação/ })).toHaveAttribute("href", "/settings/integrations")
    expect(screen.queryByRole("button", { name: /Salvar consulta/ })).not.toBeInTheDocument()
  })

  it("exibe uma ação inequívoca quando a aplicação está autorizada", async () => {
    renderDialog(true)

    expect(await screen.findByText("Aplicar como saldo de abertura")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Aplicar snapshot salvo (1 itens)" })).toBeDisabled()
  })
})
