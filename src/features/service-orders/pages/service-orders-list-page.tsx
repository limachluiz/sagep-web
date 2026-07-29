import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, FileCheck2, RefreshCw, X } from "lucide-react"
import { Link } from "react-router"
import { DataTableSkeleton, EmptyState } from "@/components/data-table-state"
import { FilterToolbar, SearchField } from "@/components/filter-toolbar"
import { ListPagination } from "@/components/list-pagination"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { serviceOrdersApi } from "@/features/service-orders/service-orders.api"
import { useAuthStore } from "@/features/auth/auth.store"

const money = (value: string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
const date = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value)) : "Não definido"

export function ServiceOrdersListPage() {
  const canViewArchived = useAuthStore(
    (state) =>
      state.hasPermission("service_orders.restore") ||
      state.hasPermission("service_orders.delete"),
  )
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [visibility, setVisibility] = useState<"active" | "archived">("active")
  useEffect(() => { const timer = window.setTimeout(() => { setDebounced(search.trim()); setPage(1) }, 400); return () => window.clearTimeout(timer) }, [search])
  const filters = useMemo(() => ({ page, pageSize, search: debounced || undefined, onlyArchived: visibility === "archived" || undefined }), [debounced, page, pageSize, visibility])
  const query = useQuery({ queryKey: ["service-orders", "list", filters], queryFn: () => serviceOrdersApi.list(filters), placeholderData: (old) => old })
  const meta = query.data?.meta
  return <div className="space-y-6"><PageHeader eyebrow="Execução contratual" title="Ordens de Serviço" description="Acompanhe emissão, contratadas, valores, vínculos documentais e prazos planejados." icon={FileCheck2} actions={<Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} />Atualizar</Button>} />
    <FilterToolbar className="md:grid-cols-[minmax(280px,1fr)_180px_auto]"><SearchField aria-label="Buscar Ordens de Serviço" placeholder="Buscar OS, contratada, CNPJ ou local..." value={search} onChange={(e) => setSearch(e.target.value)} />{canViewArchived && <Select value={visibility} onValueChange={(value) => { setVisibility(value as "active" | "archived"); setPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativas</SelectItem><SelectItem value="archived">Arquivadas</SelectItem></SelectContent></Select>}{search && <Button variant="ghost" onClick={() => { setSearch(""); setDebounced(""); setPage(1) }}><X className="size-4" />Limpar</Button>}</FilterToolbar>
    {query.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar as OS</AlertTitle><AlertDescription>{query.error.message}</AlertDescription></Alert>}
    <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><FileCheck2 className="size-5 text-primary" />{visibility === "archived" ? "Ordens arquivadas" : "Ordens emitidas"}</CardTitle>{meta && <Badge variant="outline">{meta.totalItems} OS</Badge>}</CardHeader><CardContent>{query.isLoading ? <DataTableSkeleton /> : query.data?.items.length ? <Table><TableHeader><TableRow><TableHead>OS</TableHead><TableHead>Projeto</TableHead><TableHead>Contratada</TableHead><TableHead>Emissão</TableHead><TableHead>Período planejado</TableHead><TableHead>Total</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader><TableBody>{query.data.items.map((order) => <TableRow key={order.id}><TableCell><p className="font-medium">{order.serviceOrderNumber}</p>{order.archivedAt && <Badge variant="outline" className="mt-1">Arquivada</Badge>}</TableCell><TableCell><p>PRJ-{order.project.projectCode}</p><p className="max-w-48 truncate text-xs text-muted-foreground">{order.project.title}</p></TableCell><TableCell><p className="max-w-48 truncate">{order.contractorName}</p><p className="text-xs text-muted-foreground">{order.contractorCnpj}</p></TableCell><TableCell>{date(order.issuedAt)}</TableCell><TableCell>{date(order.plannedStartDate)} — {date(order.plannedEndDate)}</TableCell><TableCell className="font-semibold">{money(order.totalAmount)}</TableCell><TableCell className="text-right"><Button asChild size="sm" variant="outline"><Link to={`/service-orders/${order.id}${visibility === "archived" ? "?includeArchived=true" : ""}`}>Detalhes</Link></Button></TableCell></TableRow>)}</TableBody></Table> : <EmptyState icon={FileCheck2} title="Nenhuma Ordem de Serviço encontrada" description="Ajuste a busca ou aguarde a emissão da primeira OS." />}{meta && meta.totalItems > 0 && <ListPagination page={meta.page} totalPages={meta.totalPages} hasPreviousPage={meta.hasPreviousPage} hasNextPage={meta.hasNextPage} pageSize={pageSize} pageSizeOptions={[10, 20, 50]} itemLabel="Ordens de Serviço" onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} onPrevious={() => setPage((v) => v - 1)} onNext={() => setPage((v) => v + 1)} />}</CardContent></Card>
  </div>
}
