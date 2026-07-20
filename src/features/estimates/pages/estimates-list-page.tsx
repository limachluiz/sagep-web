import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react"
import { Link } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { estimatesService } from "@/features/estimates/estimates.service"
import type { EstimateStatus } from "@/features/estimates/estimates.types"
import { useAuthStore } from "@/features/auth/auth.store"
import type { FederativeUnit } from "@/features/projects/projects.types"

const statusLabels: Record<EstimateStatus, string> = {
  RASCUNHO: "Rascunho",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
}

const statusVariants: Record<EstimateStatus, "default" | "secondary" | "destructive"> = {
  RASCUNHO: "secondary",
  FINALIZADA: "default",
  CANCELADA: "destructive",
}

const stateLabels: Record<FederativeUnit, string> = {
  AM: "Amazonas",
  RO: "Rondônia",
  RR: "Roraima",
  AC: "Acre",
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value))
}

export function EstimatesListPage() {
  const canCreate = useAuthStore((state) => state.hasPermission("estimates.create"))
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState<EstimateStatus | "all">("all")
  const [stateUf, setStateUf] = useState<FederativeUnit | "all">("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 400)

    return () => window.clearTimeout(timeout)
  }, [search])

  const filters = useMemo(
    () => ({
      page,
      pageSize,
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : status,
      stateUf: stateUf === "all" ? undefined : stateUf,
    }),
    [debouncedSearch, page, pageSize, stateUf, status],
  )

  const estimatesQuery = useQuery({
    queryKey: ["estimates", "list", filters],
    queryFn: () => estimatesService.list(filters),
    placeholderData: (previousData) => previousData,
  })

  const hasActiveFilters = Boolean(search || status !== "all" || stateUf !== "all")
  const clearFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setStatus("all")
    setStateUf("all")
    setPage(1)
  }

  const meta = estimatesQuery.data?.meta

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge className="mb-3">Fluxo documental</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Estimativas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Consulte valores, itens de ATA, destino e situação das estimativas vinculadas aos projetos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => estimatesQuery.refetch()}
            disabled={estimatesQuery.isFetching}
          >
            <RefreshCw className={estimatesQuery.isFetching ? "size-4 animate-spin" : "size-4"} />
            Atualizar
          </Button>
          {canCreate && (
            <Button asChild className="gap-2">
              <Link to="/estimates/new"><Plus className="size-4" />Nova estimativa</Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_220px_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar projeto, ATA, OM ou observação..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Select value={status} onValueChange={(value) => { setStatus(value as EstimateStatus | "all"); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Todos os status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stateUf} onValueChange={(value) => { setStateUf(value as FederativeUnit | "all"); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Todos os estados" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              {Object.entries(stateLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" className="gap-2" onClick={clearFilters}>
              <X className="size-4" /> Limpar
            </Button>
          )}
        </CardContent>
      </Card>

      {estimatesQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Não foi possível carregar as estimativas</AlertTitle>
          <AlertDescription>{estimatesQuery.error.message}</AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            Estimativas cadastradas
          </CardTitle>
          {meta && <Badge variant="outline">{meta.totalItems} estimativa(s)</Badge>}
        </CardHeader>
        <CardContent>
          {estimatesQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-16" />)}
            </div>
          ) : estimatesQuery.data?.items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estimativa</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>ATA</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimatesQuery.data.items.map((estimate) => (
                  <TableRow key={estimate.id}>
                    <TableCell>
                      <p className="font-medium">EST-{estimate.estimateCode}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(estimate.createdAt)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-56 truncate font-medium">PRJ-{estimate.project.projectCode}</p>
                      <p className="max-w-56 truncate text-xs text-muted-foreground">{estimate.project.title}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{estimate.ata.number}</p>
                      <p className="max-w-44 truncate text-xs text-muted-foreground">{estimate.ata.vendorName}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{estimate.om?.sigla ?? estimate.omName ?? "OM não informada"}</p>
                      <p className="text-xs text-muted-foreground">{estimate.destinationCityName}/{estimate.destinationStateUf}</p>
                    </TableCell>
                    <TableCell>{estimate.items.length}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(estimate.totalAmount)}</TableCell>
                    <TableCell><Badge variant={statusVariants[estimate.status]}>{statusLabels[estimate.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/estimates/${estimate.id}`}>Detalhes</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-14 text-center">
              <FileSpreadsheet className="mx-auto size-10 text-muted-foreground/50" />
              <p className="mt-4 font-medium">Nenhuma estimativa encontrada</p>
              <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou aguarde o cadastro da primeira estimativa.</p>
            </div>
          )}

          {meta && meta.totalItems > 0 && (
            <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Itens por página</span>
                <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1) }}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((value) => <SelectItem key={value} value={String(value)}>{value}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Página {meta.page} de {meta.totalPages}</span>
                <Button size="icon" variant="outline" disabled={!meta.hasPreviousPage} onClick={() => setPage((value) => value - 1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button size="icon" variant="outline" disabled={!meta.hasNextPage} onClick={() => setPage((value) => value + 1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
