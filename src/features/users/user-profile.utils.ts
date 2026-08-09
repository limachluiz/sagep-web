import type {
  AccessPermissionGroup,
  AuthUser,
  EffectivePermission,
  Permission,
  UserRole,
} from "@/features/auth/auth.types"

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  PROJETISTA: "Projetista",
  CONSULTA: "Consulta",
}

export const roleDescriptions: Record<UserRole, string> = {
  ADMIN: "Administração integral do sistema e da governança de acesso.",
  GESTOR: "Gestão da carteira, dos fluxos documentais e dos indicadores executivos.",
  PROJETISTA: "Atuação operacional nos projetos, tarefas e documentos sob sua responsabilidade.",
  CONSULTA: "Acesso de leitura às informações autorizadas do sistema.",
}

export function getUserDisplayName(
  user?: Pick<AuthUser, "name" | "warName" | "rank" | "email"> | null,
) {
  if (!user) return "Usuário"

  const rank = user.rank?.trim()
  const warName = user.warName?.trim()

  if (rank && warName) return `${rank} ${warName}`
  if (warName) return warName
  return user.name?.trim() || user.email || "Usuário"
}

const groupLabels: Record<string, string> = {
  audit: "Auditoria",
  projects: "Projetos",
  tasks: "Tarefas",
  estimates: "Estimativas",
  diex: "DIEx",
  service_orders: "Ordens de Serviço",
  atas: "ATAs",
  military_organizations: "Organizações Militares",
  sessions: "Sessões",
  permissions: "Permissões",
  dashboard: "Dashboards",
  reports: "Relatórios",
  users: "Usuários",
}

const actionLabels: Record<string, string> = {
  view: "Visualizar",
  view_all: "Visualizar todos",
  create: "Criar",
  edit: "Editar",
  edit_own: "Editar próprios",
  edit_all: "Editar todos",
  delete: "Excluir",
  restore: "Restaurar",
  complete: "Concluir",
  reopen: "Reabrir",
  assign: "Atribuir",
  archive: "Arquivar",
  finalize: "Finalizar",
  issue: "Emitir",
  cancel: "Cancelar",
  manage: "Administrar",
  manage_own: "Gerenciar próprias",
  manage_all: "Gerenciar todas",
  financial_view: "Visualizar financeiro",
  view_operational: "Visualizar operacional",
  view_executive: "Visualizar executivo",
  export: "Exportar",
  manage_user_overrides: "Administrar exceções individuais",
  manage_role_permissions: "Administrar perfis",
}

function fallbackPermission(code: Permission): EffectivePermission {
  const [module = "outros", action = code] = code.split(".")
  const group = groupLabels[module] ?? module
  const actionLabel = actionLabels[action] ?? action.replaceAll("_", " ")

  return {
    code,
    module,
    action,
    description: `${actionLabel} em ${group.toLocaleLowerCase("pt-BR")}`,
    critical: false,
  }
}

export function getAccessGroups(user: AuthUser): AccessPermissionGroup[] {
  if (user.access?.groups?.length) {
    return user.access.groups
  }

  const groups = new Map<string, EffectivePermission[]>()

  for (const code of user.permissions ?? []) {
    const permission = fallbackPermission(code)
    const name = groupLabels[permission.module] ?? permission.module
    groups.set(name, [...(groups.get(name) ?? []), permission])
  }

  return [...groups.entries()].map(([name, permissions]) => ({
    name,
    permissions,
  }))
}

export function maskCpf(cpf?: string | null) {
  const digits = cpf?.replace(/\D/g, "") ?? ""
  if (digits.length !== 11) return "Não informado"
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`
}

export function formatPhone(phone?: string | null) {
  const digits = phone?.replace(/\D/g, "") ?? ""
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  return "Não informado"
}

export function formatProfileDate(value?: string | null, includeTime = false) {
  if (!value) return "Não informado"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Não informado"

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    ...(includeTime && { timeStyle: "short" }),
    timeZone: "America/Manaus",
  }).format(date)
}
