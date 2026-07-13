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

const statusVariant: Record<SessionStatus, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  REVOKED: "secondary",
  EXPIRED: "outline",
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
          <div>
            <div className="flex items-center gap-2 font-medium">
              {getDeviceLabel(session.securityContext.userAgent)}
              {session.currentSession && <Badge variant="outline">Esta sessão</Badge>}
            </div>
            <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">
              {session.securityContext.userAgent ?? "Agente não informado"}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant[session.status]}>
          {session.statusDetail.label}
        </Badge>
      </TableCell>
      <TableCell>
        <p>{session.securityContext.ipAddress ?? "Não informado"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Atividade: {formatDate(session.lastActivityAt)}
        </p>
      </TableCell>
      <TableCell>{formatDate(session.createdAt)}</TableCell>
      <TableCell className="text-right">
        {session.status === "ACTIVE" ? (
          <Button
            variant={session.currentSession ? "default" : "outline"}
            size="sm"
            className="gap-2"
            disabled={pending}
            onClick={() => onRevoke(session)}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            Encerrar
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {session.statusDetail.reasonLabel ?? "Sessão inativa"}
          </span>
        )}
      </TableCell>
    </TableRow>
  )
}

export function SessionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useAuthStore((state) => state.logout)
  const [selectedSession, setSelectedSession] = useState<AuthSession | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)

  const sessionsQuery = useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: authService.listSessions,
    refetchOnWindowFocus: false,
  })

  const activeSessions = useMemo(
    () => sessionsQuery.data?.sessions.filter((session) => session.status === "ACTIVE") ?? [],
    [sessionsQuery.data],
  )

  const sessionMetrics: Array<{
    label: string
    value: number
    icon: LucideIcon
  }> = [
    {
      label: "Sessões ativas",
      value: sessionsQuery.data?.summary.active ?? 0,
      icon: ShieldCheck,
    },
    {
      label: "Sessões encerradas",
      value: sessionsQuery.data?.summary.revoked ?? 0,
      icon: LogOut,
    },
    {
      label: "Sessões expiradas",
      value: sessionsQuery.data?.summary.expired ?? 0,
      icon: Clock3,
    },
  ]

  const finishCurrentSession = () => {
    logout()
    queryClient.clear()
    navigate("/login", { replace: true })
  }

  const revokeMutation = useMutation({
    mutationFn: (session: AuthSession) => authService.revokeSession(session.id),
    onSuccess: (response, session) => {
      toast.success(response.message)
      setSelectedSession(null)

      if (session.currentSession) {
        finishCurrentSession()
        return
      }

      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] })
    },
    onError: (error) => toast.error(error.message),
  })

  const revokeAllMutation = useMutation({
    mutationFn: authService.revokeAllSessions,
    onSuccess: (response) => {
      toast.success(response.message)
      setConfirmAll(false)
      finishCurrentSession()
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge className="mb-3">Segurança da conta</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Sessões e dispositivos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Consulte os acessos vinculados à sua conta e encerre sessões que não reconhece.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => sessionsQuery.refetch()}
            disabled={sessionsQuery.isFetching}
          >
            <RefreshCw className={sessionsQuery.isFetching ? "size-4 animate-spin" : "size-4"} />
            Atualizar
          </Button>
          <Button
            variant="destructive"
            className="gap-2"
            disabled={activeSessions.length === 0}
            onClick={() => setConfirmAll(true)}
          >
            <LogOut className="size-4" />
            Encerrar todas
          </Button>
        </div>
      </div>

      {sessionsQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Não foi possível carregar as sessões</AlertTitle>
          <AlertDescription>{sessionsQuery.error.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {sessionsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)
        ) : (
          sessionMetrics.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-none shadow-sm">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-3xl font-semibold">{value}</p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MonitorSmartphone className="size-5 text-primary" />
            Histórico de sessões
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16" />)}
            </div>
          ) : sessionsQuery.data?.sessions.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Origem e atividade</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionsQuery.data.sessions.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    onRevoke={setSelectedSession}
                    pending={revokeMutation.isPending && selectedSession?.id === session.id}
                  />
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma sessão foi encontrada.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedSession)} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar sessão?</DialogTitle>
            <DialogDescription>
              {selectedSession?.currentSession
                ? "Você será desconectado deste dispositivo e precisará entrar novamente."
                : "O dispositivo selecionado perderá o acesso quando tentar renovar a sessão."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button
              variant="destructive"
              disabled={!selectedSession || revokeMutation.isPending}
              onClick={() => selectedSession && revokeMutation.mutate(selectedSession)}
            >
              {revokeMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Encerrar sessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmAll} onOpenChange={setConfirmAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar todas as sessões?</DialogTitle>
            <DialogDescription>
              Todas as sessões ativas, inclusive esta, serão revogadas. Você precisará fazer login novamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button
              variant="destructive"
              disabled={revokeAllMutation.isPending}
              onClick={() => revokeAllMutation.mutate()}
            >
              {revokeAllMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Encerrar todas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
