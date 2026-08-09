import { api } from "@/lib/api"
import type {
  AuthUser,
  ChangeOwnPasswordPayload,
  ChangeOwnPasswordResponse,
  LoginPayload,
  LoginResponse,
  SessionCleanupResponse,
  SessionMutationResponse,
  SessionsResponse,
  UpdateOwnProfilePayload,
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

  updateProfile(payload: UpdateOwnProfilePayload) {
    return api.patch<AuthUser>("/auth/profile", payload)
  },

  changePassword(payload: ChangeOwnPasswordPayload) {
    return api.post<ChangeOwnPasswordResponse>("/auth/change-password", payload)
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
    return api.get<SessionsResponse>("/auth/sessions?status=ALL&pageSize=100")
  },

  listUserSessions(userId: string) {
    return api.get<SessionsResponse>(`/auth/users/${userId}/sessions?status=ALL&pageSize=100`)
  },

  revokeSession(sessionId: string) {
    return api.post<SessionMutationResponse>(
      `/auth/sessions/${sessionId}/revoke`,
    )
  },

  revokeAllSessions() {
    return api.post<SessionMutationResponse>("/auth/sessions/revoke-all")
  },

  revokeUserSession(userId: string, sessionId: string) {
    return api.post<SessionMutationResponse>(
      `/auth/users/${userId}/sessions/${sessionId}/revoke`,
    )
  },

  revokeAllUserSessions(userId: string) {
    return api.post<SessionMutationResponse>(
      `/auth/users/${userId}/sessions/revoke-all`,
    )
  },

  cleanupSessions(refreshTokenRetentionDays = 90, auditRetentionDays = 180) {
    return api.post<SessionCleanupResponse>("/auth/sessions/cleanup", {
      refreshTokenRetentionDays,
      auditRetentionDays,
    })
  },
}
