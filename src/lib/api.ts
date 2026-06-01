import { env } from "@/config/env"
import { useAuthStore } from "@/features/auth/auth.store"

type RequestOptions = RequestInit & {
  skipAuth?: boolean
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
    const refreshResponse = await fetch(`${env.apiUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (!refreshResponse.ok) {
      logout()
      throw new Error("Sessão expirada. Faça login novamente.")
    }

    const refreshed = await refreshResponse.json()

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

    throw new Error(
      error?.message ??
        error?.error ??
        `Erro na requisição: ${response.status}`,
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