import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, ChevronLeft, ChevronRight, Pencil, Plus, Power, RefreshCw, Search, ShieldCheck, UserRound, Users, X } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuthStore } from "@/features/auth/auth.store"
import type { UserRole } from "@/features/auth/auth.types"
import { UserDialog } from "@/features/users/components/user-dialog"
import { getUserDisplayName } from "@/features/users/user-profile.utils"
import { usersService } from "@/features/users/users.service"
import type { AdminUser, CreateUserPayload, UserFormPayload } from "@/features/users/users.types"

const roleLabels: Record<UserRole, string> = { ADMIN: "Administrador", GESTOR: "Gestor", PROJETISTA: "Projetista", CONSULTA: "Consulta" }

export function UsersPage() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const setCurrentUser = useAuthStore((state) => state.setUser)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [role, setRole] = useState<UserRole | "all">("all")
  const [activity, setActivity] = useState<"all" | "active" | "inactive">("all")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [toggleTarget, setToggleTarget] = useState<AdminUser | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 350)
    return () => window.clearTimeout(timeout)
  }, [search])

  const filters = useMemo(() => ({ page, pageSize: 10, search: debouncedSearch || undefined, role: role === "all" ? undefined : role, active: activity === "all" ? undefined : activity === "active" }), [activity, debouncedSearch, page, role])
  const listQuery = useQuery({ queryKey: ["users", "management", filters], queryFn: () => usersService.list(filters), placeholderData: (previous) => previous })
  const summaryQuery = useQuery({ queryKey: ["users", "summary"], queryFn: () => usersService.list({ page: 1, pageSize: 100 }) })
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] })

  const saveMutation = useMutation({
    mutationFn: async (payload: UserFormPayload) => {
      if (!selected) return usersService.create(payload as CreateUserPayload)
      const updated = await usersService.update(selected.id, { name: payload.name, warName: payload.warName, email: payload.email, rank: payload.rank, cpf: payload.cpf })
      return payload.role === selected.role ? updated : usersService.updateRole(selected.id, payload.role)
    },
    onSuccess: (user) => {
      if (user.id === currentUser?.id) {
        const synchronizedUser = {
          ...currentUser,
          ...user,
          permissions: currentUser.permissions,
          access: currentUser.access,
        }
        setCurrentUser(synchronizedUser)
        queryClient.setQueryData(["auth", "me"], synchronizedUser)
        void queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      }
      toast.success(selected ? `${user.name} atualizado com sucesso.` : `${user.name} criado com sucesso.`)
      setFormOpen(false)
      setSelected(null)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })
  const toggleMutation = useMutation({
    mutationFn: (user: AdminUser) => usersService.updateStatus(user.id, !user.active),
    onSuccess: (user) => { toast.success(`${user.name} ${user.active ? "ativado" : "desativado"} com sucesso.`); setToggleTarget(null); invalidate() },
    onError: (error) => toast.error(error.message),
  })

  const allUsers = summaryQuery.data?.items ?? []
  const activeCount = allUsers.filter((user) => user.active).length
  const adminCount = allUsers.filter((user) => user.role === "ADMIN" && user.active).length
  const hasFilters = Boolean(search || role !== "all" || activity !== "all")
  const meta = listQuery.data?.meta
  const clearFilters = () => { setSearch(""); setDebouncedSearch(""); setRole("all"); setActivity("all"); setPage(1) }
  const openCreate = () => { setSelected(null); setFormOpen(true) }
  const openEdit = (user: AdminUser) => { setSelected(user); setFormOpen(true) }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><Badge className="mb-3">Administração</Badge><h1 className="text-3xl font-semibold tracking-tight">Usuários</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Gerencie contas, dados funcionais, perfis de acesso e disponibilidade dos usuários do SAGEP.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => { listQuery.refetch(); summaryQuery.refetch() }} disabled={listQuery.isFetching}><RefreshCw className={listQuery.isFetching ? "size-4 animate-spin" : "size-4"} />Atualizar</Button><Button onClick={openCreate}><Plus className="size-4" />Novo usuário</Button></div></div>

      <div className="grid gap-4 sm:grid-cols-3"><Card className="border-none shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">Contas cadastradas</p><p className="mt-2 text-2xl font-semibold">{summaryQuery.isLoading ? "—" : allUsers.length}</p></div><Users className="size-6 text-primary" /></CardContent></Card><Card className="border-none shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">Usuários ativos</p><p className="mt-2 text-2xl font-semibold">{summaryQuery.isLoading ? "—" : activeCount}</p></div><Power className="size-6 text-primary" /></CardContent></Card><Card className="border-none shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">Administradores ativos</p><p className="mt-2 text-2xl font-semibold">{summaryQuery.isLoading ? "—" : adminCount}</p></div><ShieldCheck className="size-6 text-primary" /></CardContent></Card></div>

      <Card className="border-none shadow-sm"><CardContent className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_220px_220px_auto]"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar por nome, nome de guerra, e-mail, posto ou CPF..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><Select value={role} onValueChange={(value) => { setRole(value as UserRole | "all"); setPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os perfis</SelectItem>{Object.entries(roleLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={activity} onValueChange={(value) => { setActivity(value as "all" | "active" | "inactive"); setPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Ativos e inativos</SelectItem><SelectItem value="active">Somente ativos</SelectItem><SelectItem value="inactive">Somente inativos</SelectItem></SelectContent></Select>{hasFilters && <Button variant="ghost" onClick={clearFilters}><X className="size-4" />Limpar</Button>}</CardContent></Card>

      {listQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar os usuários</AlertTitle><AlertDescription>{listQuery.error.message}</AlertDescription></Alert>}

      <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><UserRound className="size-5 text-primary" />Contas de acesso</CardTitle>{meta && <Badge variant="outline">{meta.totalItems} registro(s)</Badge>}</CardHeader><CardContent className="overflow-x-auto">
        {listQuery.isLoading ? <div className="space-y-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14" />)}</div> : listQuery.data?.items.length ? <Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Usuário</TableHead><TableHead>Dados funcionais</TableHead><TableHead>Perfil</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{listQuery.data.items.map((user) => <TableRow key={user.id}><TableCell className="font-mono text-xs">USR-{user.userCode}</TableCell><TableCell><div className="flex items-center gap-2"><p className="font-medium">{user.name}</p>{user.id === currentUser?.id && <Badge variant="outline">Você</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{user.email}</p></TableCell><TableCell><p className="text-sm">{getUserDisplayName(user)}</p><p className="mt-1 text-xs text-muted-foreground">CPF: {user.cpf || "não informado"}</p></TableCell><TableCell><Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{roleLabels[user.role]}</Badge></TableCell><TableCell><Badge variant={user.active ? "default" : "secondary"}>{user.active ? "Ativo" : "Inativo"}</Badge></TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => openEdit(user)}><Pencil className="size-4" />Editar</Button><Button variant="ghost" size="sm" disabled={user.id === currentUser?.id} title={user.id === currentUser?.id ? "Sua própria conta não pode ser desativada nesta tela" : undefined} className={user.active ? "text-destructive hover:text-destructive" : "text-primary hover:text-primary"} onClick={() => setToggleTarget(user)}><Power className="size-4" />{user.active ? "Desativar" : "Ativar"}</Button></div></TableCell></TableRow>)}</TableBody></Table> : <div className="flex flex-col items-center py-16 text-center"><Users className="size-10 text-muted-foreground" /><p className="mt-4 font-medium">Nenhum usuário encontrado</p><p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou crie uma nova conta.</p></div>}
        {meta && meta.totalItems > 0 && <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t pt-4"><span className="text-sm text-muted-foreground">Página {meta.page} de {meta.totalPages}</span><Button variant="outline" size="icon" disabled={!meta.hasPreviousPage} onClick={() => setPage((value) => value - 1)} aria-label="Página anterior"><ChevronLeft className="size-4" /></Button><Button variant="outline" size="icon" disabled={!meta.hasNextPage} onClick={() => setPage((value) => value + 1)} aria-label="Próxima página"><ChevronRight className="size-4" /></Button></div>}
      </CardContent></Card>

      <UserDialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setSelected(null) }} user={selected} currentUserId={currentUser?.id} pending={saveMutation.isPending} onSubmit={async (payload) => { await saveMutation.mutateAsync(payload) }} />
      <Dialog open={Boolean(toggleTarget)} onOpenChange={(open) => !open && setToggleTarget(null)}><DialogContent><DialogHeader><DialogTitle>{toggleTarget?.active ? "Desativar" : "Ativar"} usuário?</DialogTitle><DialogDescription>{toggleTarget?.active ? `${toggleTarget.name} perderá o acesso ao SAGEP até que a conta seja reativada.` : `${toggleTarget?.name} recuperará o acesso conforme o perfil ${toggleTarget ? roleLabels[toggleTarget.role] : "definido"}.`}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setToggleTarget(null)} disabled={toggleMutation.isPending}>Cancelar</Button><Button variant={toggleTarget?.active ? "destructive" : "default"} onClick={() => toggleTarget && toggleMutation.mutate(toggleTarget)} disabled={!toggleTarget || toggleMutation.isPending}>{toggleTarget?.active ? "Confirmar desativação" : "Confirmar ativação"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
