import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BellRing, CheckCheck, ChevronLeft, ChevronRight, CircleAlert, Trash2 } from "lucide-react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { notificationsService } from "../notifications.service"
import type { UserNotification } from "../notifications.types"
import { headerService } from "@/features/header/header.service"

const categoryLabels: Record<string, string> = {
  MENTION: "Menções", TASK_ASSIGNED: "Atribuições", TASK_ACTIVITY: "Andamentos", TASK_COMPLETED: "Tarefas concluídas",
  TASK_REOPENED: "Tarefas reabertas", TASK_UPDATED: "Atualizações de tarefas", TASK_ARCHIVED: "Tarefas arquivadas", TASK_DELETED: "Tarefas excluídas", PROJECT_MEMBER_ADDED: "Inclusões em projetos",
  PROJECT_MEMBER_REMOVED: "Remoções de projetos", PROJECT_STAGE_CHANGED: "Workflow de projetos",
  PROJECT_STALE: "Projetos parados", TASK_DUE_SOON: "Prazos próximos", TASK_OVERDUE: "Tarefas atrasadas", ATA_EXPIRING: "Vigência de ATAs",
}

function NotificationCard({ item, onOpen, onDismiss }: { item: UserNotification; onOpen: () => void; onDismiss: () => void }) {
  return <article className={`rounded-xl border p-4 ${item.readAt ? "bg-background" : "border-primary/35 bg-primary/5"}`}>
    <div className="flex items-start gap-3">
      <CircleAlert className={item.severity === "CRITICAL" ? "mt-1 size-5 text-destructive" : "mt-1 size-5 text-primary"} />
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onOpen}>
        <div className="flex flex-wrap items-center gap-2"><strong>{item.title}</strong>{!item.readAt && <Badge>Novo</Badge>}<Badge variant="outline">{categoryLabels[item.category] ?? item.category}</Badge></div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
        <p className="mt-2 text-xs text-muted-foreground">{new Date(item.occurredAt).toLocaleString("pt-BR")}{item.actor ? ` · por ${item.actor.warName || item.actor.name}` : ""}</p>
      </button>
      <Button variant="ghost" size="icon-sm" onClick={onDismiss} aria-label="Dispensar notificação"><Trash2 className="size-4" /></Button>
    </div>
  </article>
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const client = useQueryClient()
  const [status, setStatus] = useState("ALL")
  const [category, setCategory] = useState("ALL")
  const [page, setPage] = useState(1)
  const query = useQuery({ queryKey: ["notifications", status, category, page], queryFn: () => notificationsService.list({ status, category: category === "ALL" ? undefined : category, page, pageSize: 20 }) })
  const operational = useQuery({ queryKey: ["header", "operational-alerts"], queryFn: headerService.alerts, staleTime: 30_000 })
  const refresh = async () => { await Promise.all([client.invalidateQueries({ queryKey: ["notifications"] }), client.invalidateQueries({ queryKey: ["header", "notifications"] })]) }
  const read = useMutation({ mutationFn: notificationsService.markRead, onSuccess: refresh })
  const dismiss = useMutation({ mutationFn: notificationsService.dismiss, onSuccess: refresh, onError: (error) => toast.error(error.message) })
  const readAll = useMutation({ mutationFn: notificationsService.markAllRead, onSuccess: async ({ updated }) => { await refresh(); toast.success(`${updated} notificação(ões) marcada(s) como lida(s).`) } })
  const open = (item: UserNotification) => { if (!item.readAt) read.mutate(item.id); navigate(item.detailsPath) }
  const categories = Object.keys(query.data?.summary.byCategory ?? {})

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><Badge variant="outline">Comunicação e acompanhamento</Badge><h1 className="mt-3 text-3xl font-semibold">Central de Alertas</h1><p className="mt-2 text-muted-foreground">Menções, atribuições, mudanças de equipe e eventos do fluxo do SAGEP.</p></div><Button variant="outline" onClick={() => readAll.mutate()} disabled={!query.data?.summary.unread || readAll.isPending}><CheckCheck />Marcar todas como lidas</Button></div>
    <div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardDescription>Não lidas</CardDescription><CardTitle className="text-3xl">{query.data?.summary.unread ?? 0}</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription>Ativas</CardDescription><CardTitle className="text-3xl">{query.data?.summary.active ?? 0}</CardTitle></CardHeader></Card><Card><CardHeader><CardDescription>No filtro atual</CardDescription><CardTitle className="text-3xl">{query.data?.pagination.total ?? 0}</CardTitle></CardHeader></Card></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><BellRing className="size-5" />Caixa de notificações</CardTitle><CardDescription>Clicar em uma notificação marca como lida e abre o registro relacionado.</CardDescription></CardHeader><CardContent>
      <div className="mb-5 grid gap-3 md:grid-cols-2"><Select value={status} onValueChange={(value) => { setStatus(value); setPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Ativas</SelectItem><SelectItem value="UNREAD">Não lidas</SelectItem><SelectItem value="READ">Lidas</SelectItem><SelectItem value="DISMISSED">Dispensadas</SelectItem><SelectItem value="RESOLVED">Resolvidas</SelectItem></SelectContent></Select><Select value={category} onValueChange={(value) => { setCategory(value); setPage(1) }}><SelectTrigger><SelectValue placeholder="Todas as categorias" /></SelectTrigger><SelectContent><SelectItem value="ALL">Todas as categorias</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{categoryLabels[item] ?? item}</SelectItem>)}</SelectContent></Select></div>
      {query.isLoading && <p className="py-12 text-center text-muted-foreground">Carregando notificações...</p>}
      {query.isError && <p className="py-12 text-center text-destructive">{query.error.message}</p>}
      <div className="space-y-3">{query.data?.items.map((item) => <NotificationCard key={item.id} item={item} onOpen={() => open(item)} onDismiss={() => dismiss.mutate(item.id)} />)}</div>
      {!query.isLoading && !query.data?.items.length && <div className="py-14 text-center"><BellRing className="mx-auto size-9 text-muted-foreground" /><p className="mt-3 font-medium">Nenhuma notificação neste filtro</p></div>}
      <div className="mt-5 flex items-center justify-between"><span className="text-sm text-muted-foreground">Página {query.data?.pagination.page ?? 1} de {Math.max(query.data?.pagination.pages ?? 1, 1)}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft />Anterior</Button><Button variant="outline" size="sm" disabled={page >= (query.data?.pagination.pages ?? 1)} onClick={() => setPage((value) => value + 1)}>Próxima<ChevronRight /></Button></div></div>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Pendências operacionais ativas</CardTitle><CardDescription>Condições calculadas a partir do workflow, prazos, execução financeira, ATAs e infraestrutura. Elas desaparecem quando a causa é resolvida.</CardDescription></CardHeader><CardContent className="space-y-3">
      {(operational.data?.alerts ?? []).map((item) => <button type="button" key={item.id} onClick={() => navigate(item.detailsPath)} className="flex w-full items-start gap-3 rounded-xl border p-4 text-left transition hover:border-primary/40 hover:bg-muted/30"><CircleAlert className={item.severity === "CRITICAL" ? "mt-0.5 size-5 text-destructive" : "mt-0.5 size-5 text-status-warning"} /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong>{item.title}</strong><Badge variant={item.severity === "CRITICAL" ? "destructive" : "outline"}>{item.severity === "CRITICAL" ? "Crítico" : item.severity === "WARNING" ? "Atenção" : "Informativo"}</Badge></span><span className="mt-1 block text-sm text-muted-foreground">{item.description}</span></span></button>)}
      {(operational.data?.inventoryAlerts.lowStock.length ?? 0) > 0 && <button type="button" onClick={() => navigate("/atas")} className="flex w-full items-start gap-3 rounded-xl border p-4 text-left transition hover:border-primary/40 hover:bg-muted/30"><CircleAlert className="mt-0.5 size-5 text-status-warning" /><span><strong>{operational.data?.inventoryAlerts.lowStock.length} item(ns) de ATA com saldo crítico</strong><span className="mt-1 block text-sm text-muted-foreground">Consulte os itens e os saldos disponíveis nas ATAs.</span></span></button>}
      {!operational.isLoading && !(operational.data?.alerts.length ?? 0) && !(operational.data?.inventoryAlerts.lowStock.length ?? 0) && <p className="py-10 text-center text-muted-foreground">Nenhuma pendência operacional ativa.</p>}
    </CardContent></Card>
    <p className="text-xs text-muted-foreground">Para mencionar alguém em um andamento, use @USR-código. Exemplo: @USR-12.</p>
  </div>
}

