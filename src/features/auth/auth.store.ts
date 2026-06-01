import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { AuthUser } from "./auth.types"

type TokenPayload = {
  accessToken: string
  refreshToken: string
}

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (payload: TokenPayload & { user: AuthUser }) => void
  setUser: (user: AuthUser | null) => void
  setTokens: (tokens: TokenPayload) => void
  logout: () => void
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken, refreshToken }) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      setUser: (user) =>
        set({
          user,
          isAuthenticated: Boolean(user && get().accessToken),
        }),

      setTokens: ({ accessToken, refreshToken }) =>
        set({
          accessToken,
          refreshToken,
          isAuthenticated: Boolean(accessToken),
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      hasPermission: (permission) => {
        const user = get().user

        if (!user) return false
        if (user.role === "ADMIN") return true

        return user.permissions?.includes(permission) ?? false
      },
    }),
    {
      name: "sagep-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)