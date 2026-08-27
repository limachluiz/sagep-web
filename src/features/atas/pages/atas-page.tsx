import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CloudDownload, FileStack, Search, ShieldCheck } from "lucide-react"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ComprasGovImportDialog } from "@/features/atas/components/compras-gov-import-dialog"
import { pregoesService } from "@/features/atas/atas.service"
import type { AtaType } from "@/features/atas/atas.types"
import { useAuthStore } from "@/features/auth/auth.store"

const typeLabels: Record<AtaType, string> = { CFTV: "CFTV", FIBRA_OPTICA: "Fibra óptica" }

export function AtasPage() {
  const queryClient = useQueryClient()
  const canManage = useAuthStore((state) => state.hasPermission("atas.manage"))
  const [search, setSearch] = useState("")
  const [year, setYear] = useState("all")
  const [type, setType] = useState<AtaType | "all">("all")
  const [page, setPage] = useState(1)
  const [importOpen, setImportOpen] = useState(false)
  const query = useQuery({
    queryKey: ["pregoes", { page, search, year, type }],
    queryFn: () => pregoesService.list({
      page, pageSize: 10,
      ...(search.trim() && { search: search.trim() }),
      ...(year !== "all" && { year }),
      ...(type !== "all" && { type }),
    }),
  })
  const years = Array.from({ length: 6 }, (_, index) => String(new Date().getFullYear() - index))
  const pregoes = query.data?.items ?? []
  const totalAtas = pregoes.reduce((sum, pregao) => sum + pregao._count.atas, 0)
  const activeAtas = pregoes.reduce((sum, pregao) => sum + pregao.atas.filter((ata) => ata.isActive).length, 0)

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div><Badge variant="outline" className="mb-3">Catálogo e saldo</Badge><h1 className="text-3xl font-semibold tracking-tight">Pregões e Atas</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Consulte cada pregão como um processo único e acompanhe suas Atas de Registro de Preços, fornecedores, cobertura e saldos.</p></div>
      {canManage && <Button onClick={() => setImportOpen(true)}><CloudDownload className="size-4" />Importar do Compras.gov.br</Button>}
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pregões encontrados</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{query.data?.meta.totalItems ?? 0}</p></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">ATAs nesta página</CardTitle></CardHeader><CardContent className="flex items-center gap-3"><FileStack className="size-6 text-primary" /><p className="text-3xl font-semibold">{totalAtas}</p></CardContent></Card>
      <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">ATAs ativas</CardTitle></CardHeader><CardContent className="flex items-center gap-3"><ShieldCheck className="size-6 text-primary" /><p className="text-3xl font-semibold">{activeAtas}</p></CardContent></Card>
    </div>
    <Card><CardContent className="grid gap-3 pt-6 md:grid-cols-[1fr_180px_200px]">
      <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Buscar número, UASG, objeto ou fornecedor..." /></div>
      <Select value={year} onValueChange={(value) => { setYear(value); setPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os anos</SelectItem>{years.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
      <Select value={type} onValueChange={(value) => { setType(value as AtaType | "all"); setPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os tipos</SelectItem><SelectItem value="CFTV">CFTV</SelectItem><SelectItem value="FIBRA_OPTICA">Fibra óptica</SelectItem></SelectContent></Select>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Catálogo de pregões</CardTitle></CardHeader><CardContent>
      {query.isLoading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16" />)}</div>
        : query.isError ? <p className="text-sm text-destructive">{query.error.message}</p>
          : !pregoes.length ? <div className="py-12 text-center"><FileStack className="mx-auto size-10 text-muted-foreground" /><p className="mt-3 font-medium">Nenhum pregão encontrado</p><p className="mt-1 text-sm text-muted-foreground">Importe um pregão do Compras.gov.br para iniciar o catálogo.</p></div>
            : <Table><TableHeader><TableRow><TableHead>Pregão</TableHead><TableHead>Órgão gerenciador</TableHead><TableHead>Tipo</TableHead><TableHead>ATAs</TableHead><TableHead>Fornecedores</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader><TableBody>{pregoes.map((pregao) => {
              const vendors = new Set(pregao.atas.map((ata) => ata.vendorName).filter(Boolean)).size
              return <TableRow key={pregao.id}><TableCell><p className="font-semibold">PE {pregao.number}/{pregao.year}</p><p className="mt-1 text-xs text-muted-foreground">UASG {pregao.uasg} · PRG-{pregao.pregaoCode}</p></TableCell><TableCell className="max-w-72"><p className="truncate">{pregao.managingAgency || "Não informado"}</p></TableCell><TableCell>{pregao.type ? typeLabels[pregao.type] : "Não classificado"}</TableCell><TableCell><Badge variant="outline">{pregao._count.atas}</Badge></TableCell><TableCell>{vendors}</TableCell><TableCell><Badge variant={pregao.isActive ? "default" : "secondary"}>{pregao.isActive ? "Ativo" : "Inativo"}</Badge></TableCell><TableCell className="text-right"><Button asChild variant="ghost" size="sm"><Link to={`/pregoes/${pregao.id}`}>Visualizar</Link></Button></TableCell></TableRow>
            })}</TableBody></Table>}
      {query.data && query.data.meta.totalPages > 1 && <div className="mt-5 flex items-center justify-end gap-3"><span className="text-sm text-muted-foreground">Página {query.data.meta.page} de {query.data.meta.totalPages}</span><Button variant="outline" size="sm" disabled={!query.data.meta.hasPreviousPage} onClick={() => setPage((value) => value - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={!query.data.meta.hasNextPage} onClick={() => setPage((value) => value + 1)}>Próxima</Button></div>}
    </CardContent></Card>
    <ComprasGovImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={() => { queryClient.invalidateQueries({ queryKey: ["pregoes"] }); queryClient.invalidateQueries({ queryKey: ["atas"] }) }} />
  </div>
}
