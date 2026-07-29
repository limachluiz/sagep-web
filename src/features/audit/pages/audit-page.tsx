import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  AlertTriangle,
  CalendarRange,
  Eye,
  FileClock,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FilterToolbar, SearchField } from "@/components/filter-toolbar"
import { ListPagination } from "@/components/list-pagination"
import { PageHeader } from "@/components/page-header"
import { auditService } from "@/features/audit/audit.service"
import type { AuditAction, AuditEntityType, AuditLog } from "@/features/audit/audit.types"

const entityLabels: Record<AuditEntityType, string> = {
  PROJECT: "Projeto",
  ESTIMATE: "Estimativa",
  DIEX_REQUEST: "DIEx",
  SERVICE_ORDER: "Ordem de Serviço",
  TASK: "Tarefa",
  USER: "Usuário",
  AUTH: "Autenticação",
}

const actionLabels: Record<AuditAction, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
  ARCHIVE: "Arquivamento",
  RESTORE: "Restauração",
  STATUS_CHANGE: "Mudança de status",
  STAGE_CHANGE: "Mudança de etapa",
  ISSUE: "Emissão",
  FINALIZE: "Finalização",
  CANCEL: "Cancelamento",
  LOGIN: "Login",
  LOGIN_FAILED: "Falha de login",
  LOGOUT: "Logout",
  TOKEN_REFRESH: "Renovação de sessão",
  SESSION_REVOKE: "Revogação de sessão",
  SESSION_REVOKE_ALL: "Revogação geral",
  SESSION_EXPIRE: "Expiração de sessão",
  SESSION_CLEANUP: "Limpeza de sessões",
}

const entities = Object.keys(entityLabels) as AuditEntityType[]
const actions = Object.keys(actionLabels) as AuditAction[]

function localDateBoundary(value: string, endOfDay = false) {
  if (!value) return undefined
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`)
  return date.toISOString()
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatMetadata(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Não informado"
  if (typeof value === "boolean") return value ? "Sim" : "Não"
  if (typeof value === "object") return JSON.stringify(value, null, 2)
  return String(value)
}

export function AuditPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [actor, setActor] = useState("")
  const [debouncedActor, setDebouncedActor] = useState("")
  const [entityType, setEntityType] = useState<AuditEntityType | "all">("all")
  const [action, setAction] = useState<AuditAction | "all">("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [selected, setSelected] = useState<AuditLog | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setDebouncedActor(actor.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [actor, search])

  const filters = useMemo(() => ({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    actor: debouncedActor || undefined,
    entityType: entityType === "all" ? undefined : entityType,
    action: action === "all" ? undefined : action,
    startDate: localDateBoundary(startDate),
    endDate: localDateBoundary(endDate, true),
  }), [action, debouncedActor, debouncedSearch, endDate, entityType, page, pageSize, startDate])

  const query = useQuery({
    queryKey: ["audits", filters],
    queryFn: () => auditService.list(filters),
    placeholderData: (previous) => previous,
  })

  const items = query.data?.items ?? []
  const meta = query.data?.meta
  const hasFilters = Boolean(search || actor || entityType !== "all" || action !== "all" || startDate || endDate)
  const authEvents = items.filter((item) => item.entityType === "AUTH").length
  const criticalEvents = items.filter((item) =>
    ["DELETE", "CANCEL", "LOGIN_FAILED", "SESSION_REVOKE", "SESSION_REVOKE_ALL"].includes(item.action),
  ).length
  const actors = new Set(items.map((item) => item.actorName).filter(Boolean)).size

  const clearFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setActor("")
    setDebouncedActor("")
    setEntityType("all")
    setAction("all")
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governança"
        title="Auditoria"
        description="Consulte a trilha técnica das operações do SAGEP, identifique o responsável e inspecione o contexto registrado em cada evento."
        icon={ShieldCheck}
        actions={
          <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} />
            Atualizar
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Registros encontrados", value: meta?.totalItems ?? 0, icon: FileClock },
          { label: "Nesta página", value: items.length, icon: Activity },
          { label: "Eventos de acesso", value: authEvents, icon: ShieldCheck },
          { label: "Ações sensíveis", value: criticalEvents, icon: AlertTriangle },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-none shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{query.isLoading ? "—" : value}</p></div>
              <Icon className="size-6 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>

      <FilterToolbar className="xl:grid-cols-[minmax(260px,1fr)_minmax(220px,.7fr)_180px_210px_170px_170px_auto]">
        <SearchField
          placeholder="Resumo, entidade ou responsável..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Buscar na auditoria"
        />
        <div className="relative">
          <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Responsável ou ID" value={actor} onChange={(event) => setActor(event.target.value)} />
        </div>
        <Select value={entityType} onValueChange={(value) => { setEntityType(value as AuditEntityType | "all"); setPage(1) }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas as entidades</SelectItem>{entities.map((value) => <SelectItem key={value} value={value}>{entityLabels[value]}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={action} onValueChange={(value) => { setAction(value as AuditAction | "all"); setPage(1) }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas as ações</SelectItem>{actions.map((value) => <SelectItem key={value} value={value}>{actionLabels[value]}</SelectItem>)}</SelectContent>
        </Select>
        <div className="relative"><CalendarRange className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" type="date" aria-label="Data inicial" value={startDate} max={endDate || undefined} onChange={(event) => { setStartDate(event.target.value); setPage(1) }} /></div>
        <div className="relative"><CalendarRange className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" type="date" aria-label="Data final" value={endDate} min={startDate || undefined} onChange={(event) => { setEndDate(event.target.value); setPage(1) }} /></div>
        {hasFilters ? <Button variant="ghost" onClick={clearFilters}><X className="size-4" />Limpar</Button> : <span />}
      </FilterToolbar>

      {query.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar a auditoria</AlertTitle><AlertDescription>{query.error.message}</AlertDescription></Alert>}

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Trilha técnica</CardTitle><p className="mt-1 text-sm text-muted-foreground">{actors} responsável(is) nesta página</p></div>
          {meta && <Badge variant="outline">{meta.totalItems} registro(s)</Badge>}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {query.isLoading ? (
            <div className="space-y-3">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-14" />)}</div>
          ) : items.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Data e hora</TableHead><TableHead>Evento</TableHead><TableHead>Entidade</TableHead><TableHead>Responsável</TableHead><TableHead className="text-right">Detalhes</TableHead></TableRow></TableHeader>
              <TableBody>{items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap text-sm">{formatDate(item.createdAt)}</TableCell>
                  <TableCell><p className="max-w-xl font-medium">{item.summary}</p><Badge className="mt-2" variant={["DELETE", "CANCEL", "LOGIN_FAILED"].includes(item.action) ? "destructive" : "secondary"}>{actionLabels[item.action]}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{entityLabels[item.entityType]}</Badge><p className="mt-1 max-w-44 truncate font-mono text-xs text-muted-foreground" title={item.entityId}>{item.entityId}</p></TableCell>
                  <TableCell><p className="font-medium">{item.actorName ?? "Sistema"}</p><p className="mt-1 max-w-44 truncate font-mono text-xs text-muted-foreground">{item.actorUserId ?? "ação automática"}</p></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setSelected(item)}><Eye className="size-4" />Inspecionar</Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center py-16 text-center"><Search className="size-10 text-muted-foreground" /><p className="mt-4 font-medium">Nenhum evento encontrado</p><p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros para ampliar a consulta.</p></div>
          )}

          {meta && meta.totalItems > 0 && (
            <ListPagination
              page={meta.page}
              totalPages={meta.totalPages}
              hasPreviousPage={meta.hasPreviousPage}
              hasNextPage={meta.hasNextPage}
              onPrevious={() => setPage((value) => value - 1)}
              onNext={() => setPage((value) => value + 1)}
              pageSize={pageSize}
              onPageSizeChange={(value) => { setPageSize(value); setPage(1) }}
              itemLabel="registros"
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Detalhes do evento</DialogTitle><DialogDescription>Registro técnico imutável da ação selecionada.</DialogDescription></DialogHeader>
          {selected && <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2">
              <div><p className="text-xs text-muted-foreground">Ação</p><p className="mt-1 font-medium">{actionLabels[selected.action]}</p></div>
              <div><p className="text-xs text-muted-foreground">Entidade</p><p className="mt-1 font-medium">{entityLabels[selected.entityType]}</p></div>
              <div><p className="text-xs text-muted-foreground">Responsável</p><p className="mt-1 font-medium">{selected.actorName ?? "Sistema"}</p></div>
              <div><p className="text-xs text-muted-foreground">Data e hora</p><p className="mt-1 font-medium">{formatDate(selected.createdAt)}</p></div>
            </div>
            <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Resumo</p><p className="mt-2 text-sm">{selected.summary}</p></div>
            <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Identificadores</p><div className="mt-2 rounded-lg border bg-muted/30 p-3 font-mono text-xs"><p>evento: {selected.id}</p><p className="mt-1">entidade: {selected.entityId}</p><p className="mt-1">usuário: {selected.actorUserId ?? "sistema"}</p></div></div>
            <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Metadados</p><pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/30 p-3 text-xs">{formatMetadata(selected.metadata)}</pre></div>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
