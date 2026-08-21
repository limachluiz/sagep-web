import { env } from "@/config/env"
import { useAuthStore } from "@/features/auth/auth.store"

type RequestOptions = RequestInit & {
  skipAuth?: boolean
  responseType?: "json" | "blob"
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

let refreshRequest: Promise<{ accessToken: string }> | null = null

async function fetchApi(path: string, options: RequestInit) {
  try {
    return await fetch(`${env.apiUrl}${path}`, { ...options, credentials: "include" })
  } catch (error) {
    throw new ApiError(
      "Não foi possível conectar ao servidor do SAGEP. Verifique se o backend está em execução.",
      0,
      error,
    )
  }
}

async function refreshSession() {
  if (!refreshRequest) {
    refreshRequest = fetchApi("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  const { accessToken, setTokens, logout } = useAuthStore.getState()

  const headers = new Headers(options.headers)
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json")

  if (!options.skipAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  let response = await fetchApi(path, {
    ...options,
    headers,
  })

  if (response.status === 401 && !options.skipAuth) {
    let refreshed: { accessToken: string }

    try {
      refreshed = await refreshSession()
    } catch (error) {
      logout()
      throw error
    }

    setTokens({
      accessToken: refreshed.accessToken,
    })

    headers.set("Authorization", `Bearer ${refreshed.accessToken}`)

    response = await fetchApi(path, {
      ...options,
      headers,
    })
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null)

    throw new ApiError(
      error?.message ??
        error?.error ??
        (response.status >= 500
          ? "O servidor do SAGEP está indisponível no momento."
          : `Erro na requisição: ${response.status}`),
      response.status,
      error,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (options.responseType === "blob") {
    return response.blob() as Promise<T>
  }

  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  getBlob: (path: string, options?: RequestOptions) =>
    request<Blob>(path, { ...options, method: "GET", responseType: "blob" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  postBlob: (path: string, body?: unknown, options?: RequestOptions) =>
    request<Blob>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      responseType: "blob",
    }),

  upload: <T>(path: string, body: Blob, filename: string, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body,
      headers: {
        ...Object.fromEntries(new Headers(options?.headers).entries()),
        "Content-Type": "application/octet-stream",
        "X-Backup-Filename": encodeURIComponent(filename),
      },
    }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PUT",
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
