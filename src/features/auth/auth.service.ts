import { api } from "@/lib/api"
import type { AuthUser, LoginPayload, LoginResponse } from "./auth.types"

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
}