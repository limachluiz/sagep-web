import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, ChevronLeft, ChevronRight, FileSignature, RefreshCw, Search } from "lucide-react"
import { Link } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
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
  const canViewArchived = useAuthStore((state) => state.hasPermission("diex.restore"))
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [visibility, setVisibility] = useState<"active" | "archived">("active")

  useEffect(() => {
    const timeout = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 400)
    return () => window.clearTimeout(timeout)
  }, [search])

  const query = useQuery({
    queryKey: ["diex", "list", page, debouncedSearch, visibility],
    queryFn: () => diexService.list({ page, pageSize: 10, search: debouncedSearch || undefined, onlyArchived: visibility === "archived" || undefined }),
    placeholderData: (previous) => previous,
  })
  const meta = query.data?.meta

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><Badge className="mb-3">Fluxo documental</Badge><h1 className="text-3xl font-semibold tracking-tight">DIEx requisitórios</h1><p className="mt-2 text-sm text-muted-foreground">Consulte documentos, fornecedores, projetos e valores requisitados.</p></div>
        <Button variant="outline" className="gap-2" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} />Atualizar</Button>
      </div>

      <Card className="border-none shadow-sm"><CardContent className="grid gap-3 p-5 md:grid-cols-[minmax(280px,1fr)_180px]"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar número, fornecedor, CNPJ ou requisitante..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>{canViewArchived && <Select value={visibility} onValueChange={(value) => { setVisibility(value as "active" | "archived"); setPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativos</SelectItem><SelectItem value="archived">Arquivados</SelectItem></SelectContent></Select>}</CardContent></Card>

      {query.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar os DIEx</AlertTitle><AlertDescription>{query.error.message}</AlertDescription></Alert>}

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><FileSignature className="size-5 text-primary" />{visibility === "archived" ? "Documentos arquivados" : "Documentos cadastrados"}</CardTitle>{meta && <Badge variant="outline">{meta.totalItems} DIEx</Badge>}</CardHeader>
        <CardContent>
          {query.isLoading ? <div className="space-y-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-16" />)}</div> : query.data?.items.length ? (
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
          ) : <div className="py-14 text-center"><FileSignature className="mx-auto size-10 text-muted-foreground/50" /><p className="mt-4 font-medium">Nenhum DIEx encontrado</p></div>}

          {meta && meta.totalItems > 0 && <div className="mt-5 flex items-center justify-end gap-3 border-t pt-4"><span className="text-sm text-muted-foreground">Página {meta.page} de {meta.totalPages}</span><Button size="icon" variant="outline" disabled={!meta.hasPreviousPage} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="size-4" /></Button><Button size="icon" variant="outline" disabled={!meta.hasNextPage} onClick={() => setPage((value) => value + 1)}><ChevronRight className="size-4" /></Button></div>}
        </CardContent>
      </Card>
    </div>
  )
}
