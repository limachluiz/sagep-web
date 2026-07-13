import { env } from "@/config/env"
import { useAuthStore } from "@/features/auth/auth.store"

type RequestOptions = RequestInit & {
  skipAuth?: boolean
}

export class ApiError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

let refreshRequest: Promise<{ accessToken: string; refreshToken?: string }> | null = null

async function refreshSession(refreshToken: string) {
  if (!refreshRequest) {
    refreshRequest = fetch(`${env.apiUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.json().catch(() => null)
          throw new ApiError(
            error?.message ?? "Sessão expirada. Faça login novamente.",
            response.status,
            error,
          )
        }

        return response.json()
      })
      .finally(() => {
        refreshRequest = null
      })
  }

  return refreshRequest
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { accessToken, refreshToken, setTokens, logout } = useAuthStore.getState()

  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")

  if (!options.skipAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  let response = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401 && !options.skipAuth && refreshToken) {
    let refreshed: { accessToken: string; refreshToken?: string }

    try {
      refreshed = await refreshSession(refreshToken)
    } catch (error) {
      logout()
      throw error
    }

    setTokens({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? refreshToken,
    })

    headers.set("Authorization", `Bearer ${refreshed.accessToken}`)

    response = await fetch(`${env.apiUrl}${path}`, {
      ...options,
      headers,
    })
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null)

    throw new ApiError(
      error?.message ?? error?.error ?? `Erro na requisição: ${response.status}`,
      response.status,
      error,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
}
