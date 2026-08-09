import { api } from "@/lib/api"
import type { MeasuredHealthSnapshot, SystemHealthDetails, SystemHealthSnapshot } from "./system-health.types"

export const systemHealthService = {
  async getStatus(force = false): Promise<MeasuredHealthSnapshot> {
    const startedAt = performance.now()
    const suffix = force ? "?refresh=true" : ""
    const snapshot = await api.get<SystemHealthSnapshot>(`/health/status${suffix}`, { skipAuth: true })

    return {
      snapshot,
      roundTripMs: Math.round((performance.now() - startedAt) * 10) / 10,
    }
  },

  getDetails(force = false) {
    return api.get<SystemHealthDetails>(`/health/details${force ? "?refresh=true" : ""}`)
  },
}
