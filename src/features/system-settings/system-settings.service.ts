import { api } from "@/lib/api"
import type { ConnectionCheck, IntegrationProvider, SystemSettings, UpdateSystemSettings } from "./system-settings.types"

export const systemSettingsService = {
  get: () => api.get<SystemSettings>("/system-settings"),
  update: (input: UpdateSystemSettings) => api.put<SystemSettings>("/system-settings", input),
  test: (provider: IntegrationProvider) => api.post<ConnectionCheck>(`/system-settings/connections/${provider}/test`),
  testAll: () => api.post<{ checkedAt: string; results: ConnectionCheck[] }>("/system-settings/connections/test"),
}
