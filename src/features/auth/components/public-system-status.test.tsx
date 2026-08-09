import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { PublicSystemStatus } from "@/features/auth/components/public-system-status"
import { systemHealthService } from "@/features/system-health/system-health.service"
import type { HealthStatus, MeasuredHealthSnapshot } from "@/features/system-health/system-health.types"

vi.mock("@/features/system-health/system-health.service", () => ({
  systemHealthService: { getStatus: vi.fn() },
}))

const getStatusMock = vi.mocked(systemHealthService.getStatus)

function measuredSnapshot(status: Exclude<HealthStatus, "not_monitored">): MeasuredHealthSnapshot {
  return {
    roundTripMs: 8.2,
    snapshot: {
      status,
      checkedAt: new Date().toISOString(),
      uptimeSeconds: 120,
      availabilityPercent: 100,
      observationWindowStartedAt: new Date().toISOString(),
      components: [],
      summary: { operational: 2, degraded: 0, unavailable: 0, notMonitored: 1 },
      history: [],
    },
  }
}

function renderStatus() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <PublicSystemStatus />
    </QueryClientProvider>,
  )
}

describe("PublicSystemStatus", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    ["operational", "Sistema operacional"],
    ["degraded", "Sistema instável"],
    ["unavailable", "Sistema indisponível"],
  ] as const)("exibe o estado público %s", async (status, label) => {
    getStatusMock.mockResolvedValueOnce(measuredSnapshot(status))

    renderStatus()

    expect(screen.getByRole("status", { name: "Verificando sistema…" })).toBeInTheDocument()
    expect(await screen.findByRole("status", { name: label })).toBeInTheDocument()
  })

  it("informa indisponibilidade quando não alcança a API", async () => {
    getStatusMock.mockRejectedValueOnce(new Error("API offline"))

    renderStatus()

    expect(await screen.findByRole("status", { name: "Sistema indisponível" })).toBeInTheDocument()
  })
})
