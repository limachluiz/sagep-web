import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowUpRight,
  CloudDownload,
  FileStack,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  ShieldCheck,
  TimerReset,
  Trash2,
  X,
} from "lucide-react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"

import { DataTableSkeleton, EmptyState } from "@/components/data-table-state"
import { FilterToolbar, SearchField } from "@/components/filter-toolbar"
import { ListPagination } from "@/components/list-pagination"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AtaDialog } from "@/features/atas/components/ata-dialog"
import { ComprasGovImportDialog } from "@/features/atas/components/compras-gov-import-dialog"
import { atasService } from "@/features/atas/atas.service"
import type { Ata, AtaPayload, AtaType, AtaUpdatePayload } from "@/features/atas/atas.types"
import { formatAtaDate, getAtaValidityStatus } from "@/features/atas/atas.utils"
import { useAuthStore } from "@/features/auth/auth.store"
import type { FederativeUnit } from "@/features/projects/projects.types"

const typeLabels: Record<AtaType, string> = {
  CFTV: "CFTV",
  FIBRA_OPTICA: "Fibra Óptica / Ponto Lógico",
}

const validityPresentation = {
  ACTIVE: { label: "Vigente", variant: "default" as const },
  EXPIRING: { label: "Vence em até 90 dias", variant: "outline" as const },
  EXPIRED: { label: "Vencida", variant: "destructive" as const },
  INACTIVE: { label: "Inativa", variant: "secondary" as const },
  UNDATED: { label: "Sem vigência", variant: "outline" as const },
}

export function AtasPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const canManage = useAuthStore((state) => state.hasPermission("atas.manage"))
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [type, setType] = useState<AtaType | "all">("all")
  const [stateUf, setStateUf] = useState<FederativeUnit | "all">("all")
  const [activity, setActivity] = useState<"all" | "active" | "inactive">("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [selected, setSelected] = useState<Ata | null>(null)
  const [toggleTarget, setToggleTarget] = useState<Ata | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ata | null>(null)
  const [referenceTime] = useState(() => Date.now())

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
      type: type === "all" ? undefined : type,
      stateUf: stateUf === "all" ? undefined : stateUf,
      active: activity === "all" ? undefined : activity === "active",
    }),
    [activity, debouncedSearch, page, pageSize, stateUf, type],
  )

  const query = useQuery({
    queryKey: ["atas", "list", filters],
    queryFn: () => atasService.list(filters),
    placeholderData: (previous) => previous,
  })
  const summaryQuery = useQuery({
    queryKey: ["atas", "summary"],
    queryFn: () => atasService.list({ page: 1, pageSize: 100 }),
  })
  const activeSummaryQuery = useQuery({
    queryKey: ["atas", "summary", "active"],
    queryFn: () => atasService.list({ page: 1, pageSize: 1, active: true }),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["atas"] })
  const saveMutation = useMutation({
    mutationFn: (payload: AtaPayload | AtaUpdatePayload) =>
      selected
        ? atasService.update(selected.id, payload as AtaUpdatePayload)
        : atasService.create(payload as AtaPayload),
    onSuccess: (ata) => {
      toast.success(`${ata.number} ${selected ? "atualizada" : "cadastrada"} com sucesso.`)
      setFormOpen(false)
      setSelected(null)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })
  const toggleMutation = useMutation({
    mutationFn: (ata: Ata) => atasService.update(ata.id, { isActive: !ata.isActive }),
    onSuccess: (ata) => {
      toast.success(`${ata.number} ${ata.isActive ? "ativada" : "inativada"}.`)
      setToggleTarget(null)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })
  const deleteMutation = useMutation({
    mutationFn: (ata: Ata) => atasService.remove(ata.id),
    onSuccess: (result) => {
      toast.success(result.message)
      setDeleteTarget(null)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const summaryItems = summaryQuery.data?.items ?? []
  const totalCount = summaryQuery.data?.meta.totalItems
  const activeCount = activeSummaryQuery.data?.meta.totalItems
  const expiringCount = summaryItems.filter(
    (ata) => getAtaValidityStatus(ata, referenceTime) === "EXPIRING",
  ).length
  const importedCount = summaryItems.filter((ata) => ata.externalSource === "COMPRAS_GOV").length
  const hasFilters = Boolean(search || type !== "all" || stateUf !== "all" || activity !== "all")
  const meta = query.data?.meta

  const clearFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setType("all")
    setStateUf("all")
    setActivity("all")
    setPage(1)
  }

  const refresh = () => {
    query.refetch()
    summaryQuery.refetch()
    activeSummaryQuery.refetch()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Contratações e saldos"
        title="ATAs"
        description="Administre vigência, cobertura territorial, itens precificados e disponibilidade para novos projetos."
        icon={FileStack}
        actions={
          <>
            <Button variant="outline" onClick={refresh} disabled={query.isFetching}>
              <RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} />
              Atualizar
            </Button>
            {canManage && (
              <>
                <Button variant="outline" onClick={() => setImportOpen(true)}>
                  <CloudDownload className="size-4" />
                  Importar Compras.gov
                </Button>
                <Button onClick={() => { setSelected(null); setFormOpen(true) }}>
                  <Plus className="size-4" />
                  Nova ATA
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "ATAs cadastradas", value: totalCount, icon: FileStack },
          { label: "ATAs ativas", value: activeCount, icon: ShieldCheck },
          { label: "Vencem em até 90 dias", value: expiringCount, icon: TimerReset },
          { label: "Importadas do Compras.gov", value: importedCount, icon: CloudDownload },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-primary/10 bg-card/80 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {summaryQuery.isLoading ? "—" : (value ?? "—")}
                </p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <FilterToolbar className="xl:grid-cols-[minmax(280px,1fr)_210px_170px_210px_auto]">
        <SearchField
          aria-label="Buscar ATAs"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Número, fornecedor ou órgão..."
        />
        <Select value={type} onValueChange={(value) => { setType(value as AtaType | "all"); setPage(1) }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="CFTV">CFTV</SelectItem>
            <SelectItem value="FIBRA_OPTICA">Fibra Óptica</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stateUf} onValueChange={(value) => { setStateUf(value as FederativeUnit | "all"); setPage(1) }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            {["AM", "RO", "RR", "AC"].map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={activity} onValueChange={(value) => { setActivity(value as typeof activity); setPage(1) }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Ativas e inativas</SelectItem>
            <SelectItem value="active">Somente ativas</SelectItem>
            <SelectItem value="inactive">Somente inativas</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="size-4" />
            Limpar
          </Button>
        )}
      </FilterToolbar>

      {query.isError && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Não foi possível carregar as ATAs</AlertTitle>
          <AlertDescription>{query.error.message}</AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileStack className="size-5 text-primary" />
            Catálogo de ATAs
          </CardTitle>
          {meta && <Badge variant="outline">{meta.totalItems} registro(s)</Badge>}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {query.isLoading ? (
            <DataTableSkeleton />
          ) : query.data?.items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ATA</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Cobertura</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((ata) => {
                  const validity = validityPresentation[getAtaValidityStatus(ata, referenceTime)]
                  const states = new Set(
                    ata.coverageGroups.flatMap((group) =>
                      group.localities.map((locality) => locality.stateUf),
                    ),
                  )

                  return (
                    <TableRow key={ata.id}>
                      <TableCell>
                        <p className="font-medium">ATA-{ata.ataCode} · {ata.number}</p>
                        <p className="mt-1 text-xs text-primary">{typeLabels[ata.type]}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{ata.vendorName}</p>
                        <p className="mt-1 max-w-52 truncate text-xs text-muted-foreground">
                          {ata.managingAgency || "Órgão não informado"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p>{ata.coverageGroups.length} grupo(s)</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[...states].join(", ") || "Sem localidade"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatAtaDate(ata.validFrom)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">até {formatAtaDate(ata.validUntil)}</p>
                      </TableCell>
                      <TableCell>
                        {ata.externalSource === "COMPRAS_GOV" ? (
                          <div>
                            <Badge variant="outline">Compras.gov</Badge>
                            <p className="mt-1 text-xs text-muted-foreground">
                              UASG {ata.externalUasg || "não informada"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Cadastro manual</span>
                        )}
                      </TableCell>
                      <TableCell><Badge variant={validity.variant}>{validity.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/atas/${ata.id}`}>
                              Abrir
                              <ArrowUpRight className="size-4" />
                            </Link>
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelected(ata); setFormOpen(true) }}
                                title="Editar"
                                aria-label={`Editar ${ata.number}`}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setToggleTarget(ata)}
                                title={ata.isActive ? "Inativar" : "Ativar"}
                                aria-label={`${ata.isActive ? "Inativar" : "Ativar"} ${ata.number}`}
                              >
                                <Power className={ata.isActive ? "size-4 text-destructive" : "size-4 text-primary"} />
                              </Button>
                              {!ata.isActive && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setDeleteTarget(ata)}
                                  title="Excluir ATA"
                                  aria-label={`Excluir ${ata.number}`}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={FileStack}
              title="Nenhuma ATA encontrada"
              description={hasFilters ? "Revise os filtros aplicados à consulta." : "Cadastre ou importe a primeira ATA para iniciar o controle de saldos."}
              action={hasFilters ? <Button variant="outline" onClick={clearFilters}>Limpar filtros</Button> : undefined}
            />
          )}

          {meta && meta.totalItems > 0 && (
            <ListPagination
              page={meta.page}
              totalPages={meta.totalPages}
              hasPreviousPage={meta.hasPreviousPage}
              hasNextPage={meta.hasNextPage}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50]}
              itemLabel="ATAs"
              onPageSizeChange={(value) => { setPageSize(value); setPage(1) }}
              onPrevious={() => setPage((value) => value - 1)}
              onNext={() => setPage((value) => value + 1)}
            />
          )}
        </CardContent>
      </Card>

      {formOpen && (
        <AtaDialog
          open={formOpen}
          onOpenChange={(open) => { setFormOpen(open); if (!open) setSelected(null) }}
          ata={selected}
          pending={saveMutation.isPending}
          onSubmit={async (payload) => { await saveMutation.mutateAsync(payload) }}
        />
      )}
      {importOpen && (
        <ComprasGovImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImported={(result) => { invalidate(); navigate(`/atas/${result.ata.id}`) }}
        />
      )}

      <Dialog open={Boolean(toggleTarget)} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{toggleTarget?.isActive ? "Inativar" : "Ativar"} ATA?</DialogTitle>
            <DialogDescription>
              {toggleTarget?.isActive
                ? `${toggleTarget.number} deixará de ser oferecida em novas estimativas. Os vínculos e saldos existentes serão preservados.`
                : `${toggleTarget?.number} voltará a ficar disponível para uso.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleTarget(null)} disabled={toggleMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant={toggleTarget?.isActive ? "destructive" : "default"}
              onClick={() => toggleTarget && toggleMutation.mutate(toggleTarget)}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending ? "Processando..." : toggleTarget?.isActive ? "Confirmar inativação" : "Confirmar ativação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir ATA permanentemente?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.number} será removida com seus itens e grupos de cobertura. A exclusão será
              bloqueada se houver estimativas ou movimentações de saldo vinculadas. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              disabled={!deleteTarget || deleteMutation.isPending}
            >
              <Trash2 className="size-4" />
              {deleteMutation.isPending ? "Excluindo..." : "Excluir ATA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
