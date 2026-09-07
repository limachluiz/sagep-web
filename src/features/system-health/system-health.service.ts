import { api } from "@/lib/api"
import type { HealthWindow, MeasuredHealthSnapshot, SystemHealthDetails, SystemHealthSnapshot } from "./system-health.types"

export const systemHealthService = {
  async getStatus(force = false, window: HealthWindow = "3h"): Promise<MeasuredHealthSnapshot> {
    const startedAt = performance.now()
    const suffix = `?window=${window}${force ? "&refresh=true" : ""}`
    const snapshot = await api.get<SystemHealthSnapshot>(`/health/status${suffix}`, { skipAuth: true })

    return {
      snapshot,
      roundTripMs: Math.round((performance.now() - startedAt) * 10) / 10,
    }
  },

  getDetails(force = false, window: HealthWindow = "3h") {
    return api.get<SystemHealthDetails>(`/health/details?window=${window}${force ? "&refresh=true" : ""}`)
  },
}
