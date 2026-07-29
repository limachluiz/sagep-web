import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter } from "react-router"

import { useAuthStore } from "@/features/auth/auth.store"
import { projectsService } from "@/features/projects/projects.service"
import type { ProjectListItem, ProjectsListResponse } from "@/features/projects/projects.types"
import { ProjectsListPage } from "./projects-list-page"

vi.mock("@/features/projects/projects.service", () => ({
  projectsService: { list: vi.fn(), create: vi.fn() },
}))

const project: ProjectListItem = {
  id: "project-1",
  projectCode: 42,
  title: "Lançamento de fibra",
  description: "Projeto da rede lógica",
  projectType: "FIBRA_OPTICA_PONTO_LOGICO",
  omId: "om-1",
  om: { id: "om-1", omCode: 1, sigla: "4º CTA", name: "4º Centro de Telemática de Área", cityName: "Manaus", stateUf: "AM", isActive: true },
  status: "EM_ANDAMENTO",
  stage: "DIEX_REQUISITORIO",
  ownerId: "user-1",
  owner: { id: "user-1", userCode: 1, name: "Gestor", email: "gestor@sagep.test", role: "GESTOR" },
  startDate: "2026-07-20T00:00:00.000Z",
  endDate: null,
  createdAt: "2026-07-20T00:00:00.000Z",
  updatedAt: "2026-07-20T00:00:00.000Z",
  archivedAt: null,
  deletedAt: null,
  _count: { members: 2, tasks: 3, estimates: 1 },
}

const response: ProjectsListResponse = {
  items: [project],
  meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  filters: {},
  links: { self: "/projects" },
}

describe("ProjectsListPage", () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().logout()
    useAuthStore.getState().setAuth({
      user: { id: "user-1", name: "Gestor", email: "gestor@sagep.test", role: "GESTOR", permissions: ["projects.view_all", "projects.edit_own"] },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    })
    vi.mocked(projectsService.list).mockResolvedValue(response)
  })

  it("oferece filtros acessíveis e versões móvel e tabular do projeto", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={queryClient}><MemoryRouter><ProjectsListPage /></MemoryRouter></QueryClientProvider>)

    expect(await screen.findByRole("heading", { name: "Projetos" })).toBeInTheDocument()
    expect(screen.getByRole("searchbox", { name: "Buscar projetos" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Filtrar por status" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Filtrar por etapa" })).toBeInTheDocument()
    expect(await screen.findAllByRole("link", { name: "Abrir projeto PRJ-42" })).toHaveLength(2)
    expect(screen.queryByText(/até não definida/i)).not.toBeInTheDocument()
  })

  it("aplica filtros recebidos por links do Dashboard", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={["/projects?status=CONCLUIDO"]}><ProjectsListPage /></MemoryRouter></QueryClientProvider>)

    await waitFor(() => expect(projectsService.list).toHaveBeenCalledWith(expect.objectContaining({
      status: "CONCLUIDO",
    })))
  })

  it("abre diretamente o cadastro ao receber o atalho da página inicial", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={["/projects?new=1"]}><ProjectsListPage /></MemoryRouter></QueryClientProvider>)

    expect(await screen.findByRole("heading", { name: "Novo projeto" })).toBeInTheDocument()
    expect(screen.getByLabelText("Título")).toBeInTheDocument()
  })
})
