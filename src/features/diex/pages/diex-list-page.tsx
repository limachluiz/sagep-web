import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, FileSignature, RefreshCw, X } from "lucide-react"
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
import { diexService } from "@/features/diex/diex.service"
import { useAuthStore } from "@/features/auth/auth.store"

function formatCurrency(value: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))
}

function formatDate(value: string | null) {
  if (!value) return "Pendente"
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value))
}

export function DiexListPage() {
  const canViewArchived = useAuthStore(
    (state) => state.hasPermission("diex.restore") || state.hasPermission("diex.delete"),
  )
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [visibility, setVisibility] = useState<"active" | "archived">("active")

  useEffect(() => {
    const timeout = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 400)
    return () => window.clearTimeout(timeout)
  }, [search])

  const filters = useMemo(() => ({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    onlyArchived: visibility === "archived" || undefined,
  }), [debouncedSearch, page, pageSize, visibility])
  const query = useQuery({
    queryKey: ["diex", "list", filters],
    queryFn: () => diexService.list(filters),
    placeholderData: (previous) => previous,
  })
  const meta = query.data?.meta

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fluxo documental"
        title="DIEx requisitórios"
        description="Consulte documentos, fornecedores, projetos, valores requisitados e a reserva correspondente na ATA."
        icon={FileSignature}
        actions={<Button variant="outline" className="gap-2" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} />Atualizar</Button>}
      />

      <FilterToolbar className="md:grid-cols-[minmax(280px,1fr)_180px_auto]">
        <SearchField aria-label="Buscar DIEx" placeholder="Buscar número, fornecedor, CNPJ ou requisitante..." value={search} onChange={(event) => setSearch(event.target.value)} />
        {canViewArchived && <Select value={visibility} onValueChange={(value) => { setVisibility(value as "active" | "archived"); setPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativos</SelectItem><SelectItem value="archived">Arquivados</SelectItem></SelectContent></Select>}
        {search && <Button variant="ghost" onClick={() => { setSearch(""); setDebouncedSearch(""); setPage(1) }}><X className="size-4" />Limpar</Button>}
      </FilterToolbar>

      {query.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar os DIEx</AlertTitle><AlertDescription>{query.error.message}</AlertDescription></Alert>}

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><FileSignature className="size-5 text-primary" />{visibility === "archived" ? "Documentos arquivados" : "Documentos cadastrados"}</CardTitle>{meta && <Badge variant="outline">{meta.totalItems} DIEx</Badge>}</CardHeader>
        <CardContent>
          {query.isLoading ? <DataTableSkeleton /> : query.data?.items.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>DIEx</TableHead><TableHead>Projeto</TableHead><TableHead>Estimativa</TableHead><TableHead>Fornecedor</TableHead><TableHead>Emissão</TableHead><TableHead>Total</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
              <TableBody>{query.data.items.map((diex) => (
                <TableRow key={diex.id}>
                  <TableCell><p className="font-medium">{diex.diexNumber ?? `DIEX-${diex.diexCode}`}</p><div className="mt-1 flex gap-1"><Badge variant={diex.diexNumber && diex.issuedAt ? "default" : "secondary"}>{diex.diexNumber && diex.issuedAt ? "Pronto" : "Aguardando SALC"}</Badge>{diex.archivedAt && <Badge variant="outline">Arquivado</Badge>}</div></TableCell>
                  <TableCell><p className="font-medium">PRJ-{diex.project.projectCode}</p><p className="max-w-52 truncate text-xs text-muted-foreground">{diex.project.title}</p></TableCell>
                  <TableCell>EST-{diex.estimate.estimateCode}</TableCell>
                  <TableCell><p className="max-w-48 truncate">{diex.supplierName}</p><p className="text-xs text-muted-foreground">{diex.supplierCnpj}</p></TableCell>
                  <TableCell>{formatDate(diex.issuedAt)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(diex.totalAmount)}</TableCell>
                  <TableCell className="text-right"><Button asChild size="sm" variant="outline"><Link to={`/diex/${diex.id}${visibility === "archived" ? "?includeArchived=true" : ""}`}>Detalhes</Link></Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          ) : <EmptyState icon={FileSignature} title="Nenhum DIEx encontrado" description="Ajuste a busca ou aguarde a emissão do primeiro DIEx requisitório." />}

          {meta && meta.totalItems > 0 && <ListPagination page={meta.page} totalPages={meta.totalPages} hasPreviousPage={meta.hasPreviousPage} hasNextPage={meta.hasNextPage} pageSize={pageSize} pageSizeOptions={[10, 20, 50]} itemLabel="DIEx" onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} onPrevious={() => setPage((value) => value - 1)} onNext={() => setPage((value) => value + 1)} />}
        </CardContent>
      </Card>
    </div>
  )
}
