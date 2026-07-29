import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  Clock3,
  Laptop,
  Loader2,
  LogOut,
  MonitorSmartphone,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authService } from "@/features/auth/auth.service"
import { useAuthStore } from "@/features/auth/auth.store"
import type { AuthSession, SessionStatus } from "@/features/auth/auth.types"
import { usersService } from "@/features/users/users.service"

const statusVariant: Record<SessionStatus, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  REVOKED: "secondary",
  EXPIRED: "outline",
}

const statusLabels: Record<SessionStatus | "ALL", string> = {
  ALL: "Todos os estados",
  ACTIVE: "Ativas",
  REVOKED: "Encerradas",
  EXPIRED: "Expiradas",
}

function formatDate(value: string | null) {
  if (!value) return "Não informado"
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function getDeviceLabel(userAgent: string | null) {
  if (!userAgent) return "Dispositivo não identificado"
  if (/android/i.test(userAgent)) return "Dispositivo Android"
  if (/iphone|ipad/i.test(userAgent)) return "Dispositivo Apple"
  if (/windows/i.test(userAgent)) return "Computador Windows"
  if (/macintosh|mac os/i.test(userAgent)) return "Computador macOS"
  if (/linux/i.test(userAgent)) return "Computador Linux"
  return "Navegador web"
}

function SessionRow({
  session,
  onRevoke,
  pending,
}: {
  session: AuthSession
  onRevoke: (session: AuthSession) => void
  pending: boolean
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Laptop className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-medium">
              {getDeviceLabel(session.securityContext.userAgent)}
              {session.currentSession && <Badge variant="outline">Esta sessão</Badge>}
            </div>
            <p className="mt-1 max-w-md truncate text-xs text-muted-foreground" title={session.securityContext.userAgent ?? undefined}>
              {session.securityContext.userAgent ?? "Agente não informado"}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell><Badge variant={statusVariant[session.status]}>{session.statusDetail.label}</Badge></TableCell>
      <TableCell><p>{session.securityContext.ipAddress ?? "Não informado"}</p><p className="mt-1 text-xs text-muted-foreground">Atividade: {formatDate(session.lastActivityAt)}</p></TableCell>
      <TableCell>{formatDate(session.createdAt)}</TableCell>
      <TableCell className="text-right">
        {session.status === "ACTIVE" ? (
          <Button variant={session.currentSession ? "default" : "outline"} size="sm" disabled={pending} onClick={() => onRevoke(session)}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            Encerrar
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">{session.statusDetail.reasonLabel ?? "Sessão inativa"}</span>
        )}
      </TableCell>
    </TableRow>
  )
}

export function SessionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const logout = useAuthStore((state) => state.logout)
  const canManageAll = hasPermission("sessions.manage_all")
  const [selectedUserId, setSelectedUserId] = useState("self")
  const [status, setStatus] = useState<SessionStatus | "ALL">("ALL")
  const [selectedSession, setSelectedSession] = useState<AuthSession | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)
  const [cleanupOpen, setCleanupOpen] = useState(false)
  const [refreshRetention, setRefreshRetention] = useState(90)
  const [auditRetention, setAuditRetention] = useState(180)

  const managingOwn = selectedUserId === "self" || selectedUserId === currentUser?.id
  const targetUserId = managingOwn ? currentUser?.id : selectedUserId

  const usersQuery = useQuery({
    queryKey: ["users", "session-management"],
    queryFn: () => usersService.list({ page: 1, pageSize: 100 }),
    enabled: canManageAll,
  })

  const sessionsQuery = useQuery({
    queryKey: ["auth", "sessions", targetUserId ?? "self", managingOwn ? "own" : "admin"],
    queryFn: () => managingOwn
      ? authService.listSessions()
      : authService.listUserSessions(selectedUserId),
    refetchOnWindowFocus: false,
    enabled: Boolean(targetUserId),
  })

  const visibleSessions = useMemo(
    () => (sessionsQuery.data?.sessions ?? []).filter((session) => status === "ALL" || session.status === status),
    [sessionsQuery.data, status],
  )
  const activeSessions = useMemo(
    () => sessionsQuery.data?.sessions.filter((session) => session.status === "ACTIVE") ?? [],
    [sessionsQuery.data],
  )
  const selectedUser = usersQuery.data?.items.find((user) => user.id === selectedUserId)
  const targetLabel = managingOwn ? "sua conta" : selectedUser?.name ?? "usuário selecionado"

  const sessionMetrics: Array<{ label: string; value: number; icon: LucideIcon }> = [
    { label: "Sessões ativas", value: sessionsQuery.data?.summary.active ?? 0, icon: ShieldCheck },
    { label: "Sessões encerradas", value: sessionsQuery.data?.summary.revoked ?? 0, icon: LogOut },
    { label: "Sessões expiradas", value: sessionsQuery.data?.summary.expired ?? 0, icon: Clock3 },
  ]

  const finishCurrentSession = () => {
    logout()
    queryClient.clear()
    navigate("/login", { replace: true })
  }

  const revokeMutation = useMutation({
    mutationFn: (session: AuthSession) => managingOwn
      ? authService.revokeSession(session.id)
      : authService.revokeUserSession(selectedUserId, session.id),
    onSuccess: (response, session) => {
      toast.success(response.message)
      setSelectedSession(null)
      if (managingOwn && session.currentSession) {
        finishCurrentSession()
        return
      }
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] })
    },
    onError: (error) => toast.error(error.message),
  })

  const revokeAllMutation = useMutation({
    mutationFn: () => managingOwn
      ? authService.revokeAllSessions()
      : authService.revokeAllUserSessions(selectedUserId),
    onSuccess: (response) => {
      toast.success(response.message)
      setConfirmAll(false)
      if (managingOwn) {
        finishCurrentSession()
        return
      }
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] })
    },
    onError: (error) => toast.error(error.message),
  })

  const cleanupMutation = useMutation({
    mutationFn: () => authService.cleanupSessions(refreshRetention, auditRetention),
    onSuccess: (response) => {
      toast.success(`${response.message}: ${response.deleted.refreshTokens} sessão(ões) e ${response.deleted.auditLogs} registro(s) removidos.`)
      setCleanupOpen(false)
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] })
      queryClient.invalidateQueries({ queryKey: ["audits"] })
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><Badge className="mb-3">Segurança</Badge><h1 className="text-3xl font-semibold tracking-tight">Sessões e dispositivos</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{canManageAll ? "Administre acessos próprios ou de qualquer usuário e revogue dispositivos não reconhecidos." : "Consulte os acessos vinculados à sua conta e encerre sessões que não reconhece."}</p></div>
        <div className="flex flex-wrap gap-2">
          {canManageAll && <Button variant="outline" onClick={() => setCleanupOpen(true)}><Trash2 className="size-4" />Política de retenção</Button>}
          <Button variant="outline" onClick={() => sessionsQuery.refetch()} disabled={sessionsQuery.isFetching}><RefreshCw className={sessionsQuery.isFetching ? "size-4 animate-spin" : "size-4"} />Atualizar</Button>
          <Button variant="destructive" disabled={activeSessions.length === 0} onClick={() => setConfirmAll(true)}><LogOut className="size-4" />Encerrar ativas</Button>
        </div>
      </div>

      {canManageAll && (
        <Card className="border-primary/10 bg-card/80 shadow-sm">
          <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(320px,1fr)_220px_auto] lg:items-end">
            <div className="space-y-2"><Label>Conta consultada</Label><Select value={selectedUserId} onValueChange={(value) => { setSelectedUserId(value); setStatus("ALL"); setSelectedSession(null) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="self">Minha conta · {currentUser?.name ?? currentUser?.email}</SelectItem>{usersQuery.data?.items.filter((user) => user.id !== currentUser?.id).map((user) => <SelectItem key={user.id} value={user.id}>USR-{user.userCode} · {user.name}{user.active ? "" : " (inativo)"}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Situação</Label><Select value={status} onValueChange={(value) => setStatus(value as SessionStatus | "ALL")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-2.5 text-sm"><Users className="size-4 text-primary" /><span>Escopo: <strong>{managingOwn ? "próprio" : "administrativo"}</strong></span></div>
          </CardContent>
        </Card>
      )}

      {sessionsQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar as sessões</AlertTitle><AlertDescription>{sessionsQuery.error.message}</AlertDescription></Alert>}

      <div className="grid gap-4 md:grid-cols-3">
        {sessionsQuery.isLoading ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />) : sessionMetrics.map(({ label, value, icon: Icon }) => <Card key={label} className="border-none shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div><div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-5" /></div></CardContent></Card>)}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><MonitorSmartphone className="size-5 text-primary" />Histórico de sessões</CardTitle><Badge variant="outline">{visibleSessions.length} registro(s)</Badge></CardHeader>
        <CardContent className="overflow-x-auto">
          {sessionsQuery.isLoading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16" />)}</div> : visibleSessions.length ? (
            <Table><TableHeader><TableRow><TableHead>Dispositivo</TableHead><TableHead>Status</TableHead><TableHead>Origem e atividade</TableHead><TableHead>Início</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader><TableBody>{visibleSessions.map((session) => <SessionRow key={session.id} session={session} onRevoke={setSelectedSession} pending={revokeMutation.isPending && selectedSession?.id === session.id} />)}</TableBody></Table>
          ) : <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma sessão corresponde ao filtro selecionado.</div>}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedSession)} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent><DialogHeader><DialogTitle>Encerrar sessão?</DialogTitle><DialogDescription>{managingOwn && selectedSession?.currentSession ? "Você será desconectado deste dispositivo e precisará entrar novamente." : `O dispositivo vinculado a ${targetLabel} perderá o acesso quando tentar renovar a sessão.`}</DialogDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" disabled={!selectedSession || revokeMutation.isPending} onClick={() => selectedSession && revokeMutation.mutate(selectedSession)}>{revokeMutation.isPending && <Loader2 className="size-4 animate-spin" />}Encerrar sessão</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={confirmAll} onOpenChange={setConfirmAll}>
        <DialogContent><DialogHeader><DialogTitle>Encerrar todas as sessões ativas?</DialogTitle><DialogDescription>{managingOwn ? "Todas as suas sessões, inclusive esta, serão revogadas. Você precisará fazer login novamente." : `Todas as sessões ativas de ${targetLabel} serão revogadas. Sua sessão administrativa permanecerá ativa.`}</DialogDescription></DialogHeader><DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" disabled={revokeAllMutation.isPending} onClick={() => revokeAllMutation.mutate()}>{revokeAllMutation.isPending && <Loader2 className="size-4 animate-spin" />}Encerrar todas</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={cleanupOpen} onOpenChange={setCleanupOpen}>
        <DialogContent><DialogHeader><DialogTitle>Política de retenção</DialogTitle><DialogDescription>Exclua somente tokens revogados ou expirados e registros de autenticação anteriores aos prazos definidos. A operação será auditada.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="refresh-retention">Sessões inativas (dias)</Label><Input id="refresh-retention" type="number" min={1} max={3650} value={refreshRetention} onChange={(event) => setRefreshRetention(Number(event.target.value))} /></div><div className="space-y-2"><Label htmlFor="audit-retention">Auditoria de acesso (dias)</Label><Input id="audit-retention" type="number" min={1} max={3650} value={auditRetention} onChange={(event) => setAuditRetention(Number(event.target.value))} /></div></div><Alert><ShieldCheck /><AlertTitle>Escopo protegido</AlertTitle><AlertDescription>Registros operacionais de projetos e documentos não fazem parte desta limpeza.</AlertDescription></Alert><DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" disabled={cleanupMutation.isPending || refreshRetention < 1 || auditRetention < 1 || refreshRetention > 3650 || auditRetention > 3650} onClick={() => cleanupMutation.mutate()}>{cleanupMutation.isPending && <Loader2 className="size-4 animate-spin" />}Executar limpeza</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  )
}
