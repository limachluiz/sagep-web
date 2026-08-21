import { create } from "zustand"
import type { AuthUser, Permission } from "./auth.types"

type TokenPayload = {
  accessToken: string
}

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (payload: TokenPayload & { user: AuthUser }) => void
  setUser: (user: AuthUser | null) => void
  setTokens: (tokens: TokenPayload) => void
  logout: () => void
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
}

export const useAuthStore = create<AuthState>()(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: ({ user, accessToken }) =>
        set({
          user,
          accessToken,
          isAuthenticated: true,
        }),

      setUser: (user) =>
        set({
          user,
          isAuthenticated: Boolean(user && get().accessToken),
        }),

      setTokens: ({ accessToken }) =>
        set({
          accessToken,
          isAuthenticated: Boolean(accessToken),
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),

      hasPermission: (permission) => {
        const user = get().user

        if (!user) return false
        return user.permissions?.includes(permission) ?? false
      },

      hasAnyPermission: (permissions) =>
        permissions.some((permission) => get().hasPermission(permission)),
    }),
)
