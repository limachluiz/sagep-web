import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Check, KeyRound, RefreshCw, Save, Shield, ShieldAlert, UserCog, X } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/features/auth/auth.store"
import type { UserRole } from "@/features/auth/auth.types"
import { permissionsService } from "@/features/permissions/permissions.service"
import type { PermissionCatalogItem, UserPermissionItem } from "@/features/permissions/permissions.types"
import { cn } from "@/lib/utils"

const roles: UserRole[] = ["ADMIN", "GESTOR", "PROJETISTA", "CONSULTA"]
const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  PROJETISTA: "Projetista",
  CONSULTA: "Consulta",
}
const roleLevels: Record<UserRole, number> = { CONSULTA: 1, PROJETISTA: 2, GESTOR: 3, ADMIN: 4 }

function groupPermissions<T extends PermissionCatalogItem>(items: T[]) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    groups[item.group] = [...(groups[item.group] ?? []), item]
    return groups
  }, {})
}

function LoadingPermissions() {
  return <div className="space-y-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-20" />)}</div>
}

export function PermissionsSettingsPage() {
  const currentUser = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const [role, setRole] = useState<UserRole>("GESTOR")
  const [roleDrafts, setRoleDrafts] = useState<Partial<Record<UserRole, string[]>>>({})
  const [userId, setUserId] = useState("")

  const canManageRoles = hasPermission("permissions.manage_role_permissions")
  const canManageOverrides = hasPermission("permissions.manage_user_overrides")

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-3">Governança</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Configurações de acesso</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Consulte a matriz de permissões dos perfis e administre exceções individuais com proteção de hierarquia e registro em auditoria.
        </p>
      </div>

      <Alert>
        <ShieldAlert />
        <AlertTitle>Alterações sensíveis são protegidas</AlertTitle>
        <AlertDescription>O sistema impede autoedição, respeita a hierarquia dos perfis e reserva permissões críticas ao administrador.</AlertDescription>
      </Alert>

      <Tabs defaultValue="roles">
        <TabsList className="mb-5">
          <TabsTrigger value="roles"><Shield data-icon="inline-start" />Perfis</TabsTrigger>
          <TabsTrigger value="users"><UserCog data-icon="inline-start" />Exceções por usuário</TabsTrigger>
        </TabsList>
        <TabsContent value="roles">
          <RolePermissionsPanel
            role={role}
            onRoleChange={setRole}
            draft={roleDrafts[role]}
            onDraftChange={(permissions) => setRoleDrafts((current) => ({ ...current, [role]: permissions }))}
            onClearDraft={() => setRoleDrafts((current) => { const next = { ...current }; delete next[role]; return next })}
            currentRole={currentUser?.role}
            canManage={canManageRoles}
          />
        </TabsContent>
        <TabsContent value="users">
          <UserPermissionsPanel
            userId={userId}
            onUserChange={setUserId}
            currentUserId={currentUser?.id}
            currentRole={currentUser?.role}
            canManage={canManageOverrides}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RolePermissionsPanel({ role, onRoleChange, draft, onDraftChange, onClearDraft, currentRole, canManage }: {
  role: UserRole
  onRoleChange: (role: UserRole) => void
  draft?: string[]
  onDraftChange: (permissions: string[]) => void
  onClearDraft: () => void
  currentRole?: UserRole
  canManage: boolean
}) {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ["permissions", "role", role], queryFn: () => permissionsService.getRole(role) })
  const selected = useMemo(
    () => draft ?? query.data?.basePermissions ?? [],
    [draft, query.data?.basePermissions],
  )
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const groups = useMemo(() => groupPermissions(query.data?.items ?? []), [query.data?.items])
  const ownRole = role === currentRole
  const hierarchyBlocked = Boolean(currentRole && currentRole !== "ADMIN" && roleLevels[role] >= roleLevels[currentRole])
  const editable = canManage && !ownRole && !hierarchyBlocked
  const dirty = Boolean(draft) && JSON.stringify([...selected].sort()) !== JSON.stringify([...(query.data?.basePermissions ?? [])].sort())

  const mutation = useMutation({
    mutationFn: () => permissionsService.updateRole(role, selected),
    onSuccess: (response) => {
      toast.success(response.message ?? `Permissões de ${roleLabels[role]} atualizadas.`)
      queryClient.setQueryData(["permissions", "role", role], response)
      onClearDraft()
    },
    onError: (error) => toast.error(error.message),
  })

  const toggle = (item: PermissionCatalogItem) => {
    if (!editable || (item.critical && currentRole !== "ADMIN")) return
    onDraftChange(selectedSet.has(item.code) ? selected.filter((code) => code !== item.code) : [...selected, item.code])
  }

  return (
    <div className="space-y-5">
      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle>Matriz por perfil</CardTitle><CardDescription>As permissões base são herdadas por todos os usuários do perfil selecionado.</CardDescription></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={role} onValueChange={(value) => onRoleChange(value as UserRole)}><SelectTrigger className="sm:w-64"><SelectValue /></SelectTrigger><SelectContent>{roles.map((value) => <SelectItem key={value} value={value}>{roleLabels[value]}</SelectItem>)}</SelectContent></Select>
          <Badge variant="outline">{selected.length} de {query.data?.items.length ?? 0} permissões</Badge>
          {query.data && <Badge variant={query.data.source === "database" ? "default" : "secondary"}>{query.data.source === "database" ? "Matriz persistida" : "Matriz padrão"}</Badge>}
          <div className="sm:ml-auto flex gap-2"><Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={cn("size-4", query.isFetching && "animate-spin")} />Atualizar</Button><Button onClick={() => mutation.mutate()} disabled={!editable || !dirty || mutation.isPending}><Save className="size-4" />Salvar alterações</Button></div>
        </CardContent>
      </Card>

      {(ownRole || hierarchyBlocked || !canManage) && <Alert><ShieldAlert /><AlertTitle>Consulta somente</AlertTitle><AlertDescription>{ownRole ? "Sua própria matriz de perfil não pode ser alterada nesta tela." : hierarchyBlocked ? "Você não pode administrar um perfil do mesmo nível ou superior." : "Seu acesso permite consultar, mas não alterar a matriz de perfis."}</AlertDescription></Alert>}
      {query.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar a matriz</AlertTitle><AlertDescription>{query.error.message}</AlertDescription></Alert>}
      {query.isLoading ? <LoadingPermissions /> : Object.entries(groups).map(([group, items]) => (
        <Card key={group} className="border-none shadow-sm"><CardHeader className="border-b"><CardTitle>{group}</CardTitle><CardDescription>{items.filter((item) => selectedSet.has(item.code)).length} de {items.length} concedidas</CardDescription></CardHeader><CardContent className="divide-y p-0">{items.map((item) => {
          const checked = selectedSet.has(item.code)
          const blockedCritical = item.critical && currentRole !== "ADMIN"
          return <button type="button" key={item.code} disabled={!editable || blockedCritical} onClick={() => toggle(item)} className="flex w-full items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-70"><span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border", checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background")}>{checked && <Check className="size-3.5" />}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="font-medium">{item.description}</span>{item.critical && <Badge variant="destructive">Crítica</Badge>}</span><span className="mt-1 block font-mono text-xs text-muted-foreground">{item.code}</span></span></button>
        })}</CardContent></Card>
      ))}
    </div>
  )
}

function UserPermissionsPanel({ userId, onUserChange, currentUserId, currentRole, canManage }: {
  userId: string
  onUserChange: (userId: string) => void
  currentUserId?: string
  currentRole?: UserRole
  canManage: boolean
}) {
  const queryClient = useQueryClient()
  const usersQuery = useQuery({ queryKey: ["permissions", "users"], queryFn: permissionsService.listUsers })
  const userQuery = useQuery({ queryKey: ["permissions", "user", userId], queryFn: () => permissionsService.getUser(userId), enabled: Boolean(userId) })
  const groups = useMemo(() => groupPermissions(userQuery.data?.items ?? []), [userQuery.data?.items])
  const selectedUser = usersQuery.data?.items.find((user) => user.id === userId)
  const ownUser = userId === currentUserId
  const hierarchyBlocked = Boolean(selectedUser && currentRole && currentRole !== "ADMIN" && roleLevels[selectedUser.role] >= roleLevels[currentRole])
  const editable = canManage && !ownUser && !hierarchyBlocked

  const mutation = useMutation({
    mutationFn: ({ item, effect }: { item: UserPermissionItem; effect: "ALLOW" | "DENY" | null }) => effect ? permissionsService.setUserOverride(userId, item.code, effect) : permissionsService.removeUserOverride(userId, item.code),
    onSuccess: (response) => {
      toast.success(response.message)
      queryClient.setQueryData(["permissions", "user", userId], response.summary)
    },
    onError: (error) => toast.error(error.message),
  })

  const changeOverride = (item: UserPermissionItem, effect: "ALLOW" | "DENY" | null) => {
    if (!editable || (item.critical && currentRole !== "ADMIN") || item.overrideEffect === effect) return
    mutation.mutate({ item, effect })
  }

  return <div className="space-y-5">
    <Card className="border-none shadow-sm"><CardHeader><CardTitle>Exceções individuais</CardTitle><CardDescription>O padrão mantém a herança do perfil; permitir ou negar cria uma exceção auditável.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center"><Select value={userId} onValueChange={onUserChange}><SelectTrigger className="sm:w-[420px]"><SelectValue placeholder="Selecione um usuário" /></SelectTrigger><SelectContent>{usersQuery.data?.items.map((user) => <SelectItem key={user.id} value={user.id}>USR-{user.userCode} · {user.name} · {roleLabels[user.role]}{user.active ? "" : " (inativo)"}</SelectItem>)}</SelectContent></Select>{userQuery.data && <><Badge variant="outline">{userQuery.data.effectivePermissions.length} efetivas</Badge><Badge variant="secondary">{userQuery.data.overrides.length} exceções</Badge></>}</CardContent></Card>
    {usersQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar os usuários</AlertTitle><AlertDescription>{usersQuery.error.message}</AlertDescription></Alert>}
    {userId && (ownUser || hierarchyBlocked || !canManage) && <Alert><ShieldAlert /><AlertTitle>Consulta somente</AlertTitle><AlertDescription>{ownUser ? "Você não pode alterar suas próprias permissões." : hierarchyBlocked ? "Você não pode administrar um usuário do mesmo nível ou superior." : "Seu acesso permite consultar, mas não aplicar exceções."}</AlertDescription></Alert>}
    {!userId && <Card className="border-dashed bg-muted/20 shadow-none"><CardContent className="flex flex-col items-center py-14 text-center"><KeyRound className="size-10 text-muted-foreground" /><p className="mt-4 font-medium">Selecione um usuário</p><p className="mt-1 text-sm text-muted-foreground">A matriz efetiva e as exceções aparecerão aqui.</p></CardContent></Card>}
    {userQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar as permissões</AlertTitle><AlertDescription>{userQuery.error.message}</AlertDescription></Alert>}
    {userQuery.isLoading && <LoadingPermissions />}
    {Object.entries(groups).map(([group, items]) => <Card key={group} className="border-none shadow-sm"><CardHeader className="border-b"><CardTitle>{group}</CardTitle></CardHeader><CardContent className="divide-y p-0">{items.map((item) => {
      const blockedCritical = item.critical && currentRole !== "ADMIN"
      return <div key={item.code} className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{item.description}</span>{item.critical && <Badge variant="destructive">Crítica</Badge>}<Badge variant={item.effective ? "default" : "secondary"}>{item.effective ? "Acesso efetivo" : "Sem acesso"}</Badge></div><p className="mt-1 font-mono text-xs text-muted-foreground">{item.code} · perfil {item.grantedByRole ? "concede" : "não concede"}</p></div><div className="flex rounded-lg border bg-muted/30 p-1"><Button size="sm" variant={item.overrideEffect === null ? "default" : "ghost"} disabled={!editable || blockedCritical || mutation.isPending} onClick={() => changeOverride(item, null)}>Padrão</Button><Button size="sm" variant={item.overrideEffect === "ALLOW" ? "default" : "ghost"} disabled={!editable || blockedCritical || mutation.isPending} onClick={() => changeOverride(item, "ALLOW")}><Check className="size-4" />Permitir</Button><Button size="sm" variant={item.overrideEffect === "DENY" ? "destructive" : "ghost"} disabled={!editable || blockedCritical || mutation.isPending} onClick={() => changeOverride(item, "DENY")}><X className="size-4" />Negar</Button></div></div>
    })}</CardContent></Card>)}
  </div>
}
