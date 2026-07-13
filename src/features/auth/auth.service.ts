import { api } from "@/lib/api"
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  SessionMutationResponse,
  SessionsResponse,
} from "./auth.types"

export const authService = {
  login(payload: LoginPayload) {
    return api.post<LoginResponse>("/auth/login", payload, {
      skipAuth: true,
    })
  },

  me() {
    return api.get<AuthUser>("/auth/me")
  },

  logout(refreshToken: string) {
    return api.post<{ message: string }>(
      "/auth/logout",
      { refreshToken },
      {
        skipAuth: true,
      },
    )
  },

  listSessions() {
    return api.get<SessionsResponse>("/auth/sessions?status=ALL&limit=100")
  },

  revokeSession(sessionId: string) {
    return api.post<SessionMutationResponse>(
      `/auth/sessions/${sessionId}/revoke`,
    )
  },

  revokeAllSessions() {
    return api.post<SessionMutationResponse>("/auth/sessions/revoke-all")
  },
}
