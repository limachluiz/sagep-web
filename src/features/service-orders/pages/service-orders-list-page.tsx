import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, ChevronLeft, ChevronRight, FileCheck2, RefreshCw, Search } from "lucide-react"
import { Link } from "react-router"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { serviceOrdersApi } from "@/features/service-orders/service-orders.api"
import { useAuthStore } from "@/features/auth/auth.store"

const money = (value: string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
const date = (value: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value)) : "Não definido"

export function ServiceOrdersListPage() {
  const canViewArchived = useAuthStore((state) => state.hasPermission("service_orders.restore"))
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [page, setPage] = useState(1)
  const [visibility, setVisibility] = useState<"active" | "archived">("active")
  useEffect(() => { const timer = window.setTimeout(() => { setDebounced(search.trim()); setPage(1) }, 400); return () => window.clearTimeout(timer) }, [search])
  const query = useQuery({ queryKey: ["service-orders", "list", page, debounced, visibility], queryFn: () => serviceOrdersApi.list({ page, pageSize: 10, search: debounced || undefined, onlyArchived: visibility === "archived" || undefined }), placeholderData: (old) => old })
  const meta = query.data?.meta
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><Badge className="mb-3">Execução contratual</Badge><h1 className="text-3xl font-semibold">Ordens de Serviço</h1><p className="mt-2 text-sm text-muted-foreground">Acompanhe emissão, contratadas, valores e prazos planejados.</p></div><Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} />Atualizar</Button></div>
    <Card className="border-none shadow-sm"><CardContent className="grid gap-3 p-5 md:grid-cols-[minmax(280px,1fr)_180px]"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar OS, contratada, CNPJ ou local..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>{canViewArchived && <Select value={visibility} onValueChange={(value) => { setVisibility(value as "active" | "archived"); setPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativas</SelectItem><SelectItem value="archived">Arquivadas</SelectItem></SelectContent></Select>}</CardContent></Card>
    {query.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar as OS</AlertTitle><AlertDescription>{query.error.message}</AlertDescription></Alert>}
    <Card className="border-none shadow-sm"><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><FileCheck2 className="size-5 text-primary" />{visibility === "archived" ? "Ordens arquivadas" : "Ordens emitidas"}</CardTitle>{meta && <Badge variant="outline">{meta.totalItems} OS</Badge>}</CardHeader><CardContent>{query.isLoading ? <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div> : query.data?.items.length ? <Table><TableHeader><TableRow><TableHead>OS</TableHead><TableHead>Projeto</TableHead><TableHead>Contratada</TableHead><TableHead>Emissão</TableHead><TableHead>Período planejado</TableHead><TableHead>Total</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader><TableBody>{query.data.items.map((order) => <TableRow key={order.id}><TableCell><p className="font-medium">{order.serviceOrderNumber}</p>{order.archivedAt && <Badge variant="outline" className="mt-1">Arquivada</Badge>}</TableCell><TableCell><p>PRJ-{order.project.projectCode}</p><p className="max-w-48 truncate text-xs text-muted-foreground">{order.project.title}</p></TableCell><TableCell><p className="max-w-48 truncate">{order.contractorName}</p><p className="text-xs text-muted-foreground">{order.contractorCnpj}</p></TableCell><TableCell>{date(order.issuedAt)}</TableCell><TableCell>{date(order.plannedStartDate)} — {date(order.plannedEndDate)}</TableCell><TableCell className="font-semibold">{money(order.totalAmount)}</TableCell><TableCell className="text-right"><Button asChild size="sm" variant="outline"><Link to={`/service-orders/${order.id}${visibility === "archived" ? "?includeArchived=true" : ""}`}>Detalhes</Link></Button></TableCell></TableRow>)}</TableBody></Table> : <div className="py-14 text-center"><FileCheck2 className="mx-auto size-10 text-muted-foreground/50" /><p className="mt-4 font-medium">Nenhuma Ordem de Serviço encontrada</p></div>}{meta && meta.totalItems > 0 && <div className="mt-5 flex items-center justify-end gap-3 border-t pt-4"><span className="text-sm text-muted-foreground">Página {meta.page} de {meta.totalPages}</span><Button size="icon" variant="outline" disabled={!meta.hasPreviousPage} onClick={() => setPage((v) => v - 1)}><ChevronLeft className="size-4" /></Button><Button size="icon" variant="outline" disabled={!meta.hasNextPage} onClick={() => setPage((v) => v + 1)}><ChevronRight className="size-4" /></Button></div>}</CardContent></Card>
  </div>
}
