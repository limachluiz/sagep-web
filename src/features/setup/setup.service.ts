import { api } from "@/lib/api"
import type { SetupPayload, SetupStatus } from "./setup.types"

export const setupService = {
  status() {
    return api.get<SetupStatus>("/setup/status", { skipAuth: true })
  },
  initialize(payload: SetupPayload) {
    return api.post<{ initialized: true }>("/setup/initialize", payload, {
      skipAuth: true,
      skipRefresh: true,
      skipStepUp: true,
    })
  },
}
