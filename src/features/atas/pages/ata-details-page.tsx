import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeft,
  Boxes,
  CircleDollarSign,
  History,
  Landmark,
  MapPin,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Scale,
  SpellCheck2,
  Trash2,
  X,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"

import { DataTableSkeleton, EmptyState } from "@/components/data-table-state"
import { DeleteActionDialog } from "@/components/delete-action-dialog"
import { FilterToolbar, SearchField } from "@/components/filter-toolbar"
import { ItemDescription } from "@/components/item-description"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AtaCoverageDialog } from "@/features/atas/components/ata-coverage-dialog"
import { AtaDialog } from "@/features/atas/components/ata-dialog"
import { AtaItemDialog } from "@/features/atas/components/ata-item-dialog"
import { AtaItemMovementsDialog } from "@/features/atas/components/ata-item-movements-dialog"
import { atasService } from "@/features/atas/atas.service"
import type {
  AtaItem,
  AtaItemPayload,
  AtaPayload,
  AtaUpdatePayload,
} from "@/features/atas/atas.types"
import {
  formatAtaCurrency,
  formatAtaDate,
  formatAtaQuantity,
  getAtaItemBalanceStatus,
  getAtaValidityStatus,
  summarizeAtaItems,
  type AtaItemBalanceStatus,
} from "@/features/atas/atas.utils"
import { useAuthStore } from "@/features/auth/auth.store"

const itemStatusPresentation: Record<
  AtaItemBalanceStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  AVAILABLE: { label: "Disponível", variant: "default" },
  LOW: { label: "Saldo baixo", variant: "outline" },
  EXHAUSTED: { label: "Esgotado", variant: "destructive" },
  INACTIVE: { label: "Inativo", variant: "secondary" },
}

const validityLabels = {
  ACTIVE: "Vigente",
  EXPIRING: "Vence em até 90 dias",
  EXPIRED: "Vencida",
  INACTIVE: "Inativa",
  UNDATED: "Sem vigência informada",
}

type ItemFilter = "all" | "available" | "risk" | "inactive"

export function AtaDetailsPage() {
  const { ataId } = useParams<{ ataId: string }>()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const canManage = useAuthStore((state) => state.hasPermission("atas.manage"))
  const [search, setSearch] = useState("")
  const [itemFilter, setItemFilter] = useState<ItemFilter>("all")
  const [groupFilter, setGroupFilter] = useState("all")
  const [editOpen, setEditOpen] = useState(false)
  const [coverageOpen, setCoverageOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [itemOpen, setItemOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<AtaItem | null>(null)
  const [movementItem, setMovementItem] = useState<AtaItem | null>(null)
  const [referenceTime] = useState(() => Date.now())

  const ataQuery = useQuery({
    queryKey: ["atas", "details", ataId],
    queryFn: () => atasService.details(ataId!),
    enabled: Boolean(ataId),
  })
  const itemsQuery = useQuery({
    queryKey: ["atas", "items", ataId],
    queryFn: () => atasService.listItems(ataId!, { page: 1, pageSize: 100 }),
    enabled: Boolean(ataId),
  })
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["atas"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  }
  const editMutation = useMutation({
    mutationFn: (payload: AtaPayload | AtaUpdatePayload) =>
      atasService.update(ataId!, payload as AtaUpdatePayload),
    onSuccess: () => {
      toast.success("ATA atualizada com sucesso.")
      setEditOpen(false)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })
  const itemMutation = useMutation({
    mutationFn: (payload: AtaItemPayload) =>
      selectedItem
        ? atasService.updateItem(selectedItem.id, payload)
        : atasService.createItem(ataId!, payload),
    onSuccess: (item) => {
      toast.success(`${item.referenceCode} ${selectedItem ? "atualizado" : "adicionado"} com sucesso.`)
      setItemOpen(false)
      setSelectedItem(null)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })
  const toggleItemMutation = useMutation({
    mutationFn: (item: AtaItem) => atasService.updateItem(item.id, { isActive: !item.isActive }),
    onSuccess: (item) => {
      toast.success(`${item.referenceCode} ${item.isActive ? "ativado" : "inativado"}.`)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })
  const correctItemMutation = useMutation({
    mutationFn: (item: AtaItem) => atasService.correctItemDescription(item.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["atas", "items", ataId] })
      if (result.changed) toast.success("Descrição corrigida e protegida contra novas sincronizações.")
      else if (result.unresolvedCharacters) toast.warning(`O dicionário ainda não reconhece: ${result.unresolvedTokens.join(", ")}.`)
      else toast.info("A descrição já está normalizada.")
    },
    onError: (error) => toast.error(error.message),
  })
  const correctAllItemsMutation = useMutation({
    mutationFn: () => atasService.correctAllItemDescriptions(ataId!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["atas", "items", ataId] })
      const suffix = result.unresolvedCharacters
        ? ` Ainda não reconhecidos: ${result.unresolvedTokens.join(", ")}.`
        : ""
      toast.success(`${result.corrected} de ${result.total} descrição(ões) corrigida(s).${suffix}`)
    },
    onError: (error) => toast.error(error.message),
  })
  const syncPncpMutation = useMutation({
    mutationFn: () => atasService.syncPncp(ataId!),
    onSuccess: () => {
      invalidate()
      toast.success("Dados da ATA atualizados no PNCP.")
    },
    onError: (error) => toast.error(error.message),
  })
  const coverageMutation = useMutation({
    mutationFn: (payload: { regionNumber: number; localities: Array<{ cityName: string; stateUf: "AM" | "RO" | "RR" | "AC" }> }) =>
      atasService.replaceCoverage(ataId!, payload),
    onSuccess: () => {
      toast.success("Cobertura territorial consolidada.")
      setCoverageOpen(false)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })
  const deleteMutation = useMutation({
    mutationFn: () => atasService.remove(ataId!),
    onSuccess: () => {
      toast.success("ATA excluída.")
      navigate("/atas")
      queryClient.invalidateQueries({ queryKey: ["atas"] })
      queryClient.invalidateQueries({ queryKey: ["pregoes"] })
    },
    onError: (error) => toast.error(error.message),
  })

  if (ataQuery.isLoading) {
    return (
      <div className="space-y-4" aria-label="Carregando ATA" aria-busy="true">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (ataQuery.isError || !ataQuery.data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost">
          <Link to="/atas"><ArrowLeft className="size-4" />Voltar às ATAs</Link>
        </Button>
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Não foi possível carregar a ATA</AlertTitle>
          <AlertDescription>{ataQuery.error?.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const ata = ataQuery.data
  const items = itemsQuery.data?.items ?? []
  const totals = summarizeAtaItems(items)
  const validity = getAtaValidityStatus(ata, referenceTime)
  const normalizedSearch = search.trim().toLowerCase()
  const filteredItems = items.filter((item) => {
    const status = getAtaItemBalanceStatus(item)
    const matchesSearch =
      !normalizedSearch ||
      `${item.referenceCode} ${item.description} ${item.coverageGroup.code}`
        .toLowerCase()
        .includes(normalizedSearch)
    const matchesGroup = groupFilter === "all" || item.coverageGroup.code === groupFilter
    const matchesStatus =
      itemFilter === "all" ||
      (itemFilter === "available" && status === "AVAILABLE") ||
      (itemFilter === "risk" && (status === "LOW" || status === "EXHAUSTED")) ||
      (itemFilter === "inactive" && status === "INACTIVE")
    return matchesSearch && matchesGroup && matchesStatus
  })
  const coverageGroup = ata.coverageGroups.find((group) => /^REG-\d+$/i.test(group.code)) ?? ata.coverageGroups[0]
  const coverageLocalities = ata.coverageGroups.flatMap((group) => group.localities).filter((locality, index, array) =>
    array.findIndex((item) => item.cityName.toLocaleLowerCase("pt-BR") === locality.cityName.toLocaleLowerCase("pt-BR") && item.stateUf === locality.stateUf) === index
  )
  const hasItemFilters = Boolean(search || itemFilter !== "all" || groupFilter !== "all")
  const clearItemFilters = () => {
    setSearch("")
    setItemFilter("all")
    setGroupFilter("all")
  }
  const refresh = () => {
    ataQuery.refetch()
    itemsQuery.refetch()
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ml-3">
        <Link to="/atas"><ArrowLeft className="size-4" />Voltar às ATAs</Link>
      </Button>

      <Card className="overflow-hidden border-none bg-sidebar text-sidebar-foreground shadow-sm">
        <CardContent className="relative p-6 lg:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-sidebar-primary/15 to-transparent lg:block" />
          <div className="relative flex flex-col justify-between gap-5 lg:flex-row">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-sidebar-primary text-sidebar-primary-foreground">{ata.number}</Badge>
                <Badge variant="outline" className="border-white/20 text-white">
                  {ata.type === "CFTV" ? "CFTV" : "Fibra Óptica / Ponto Lógico"}
                </Badge>
                <Badge variant={validity === "EXPIRED" ? "destructive" : ata.isActive ? "default" : "secondary"}>
                  {validityLabels[validity]}
                </Badge>
                {ata.externalSource === "COMPRAS_GOV" && (
                  <Badge variant="outline" className="border-white/20 text-white">Compras.gov</Badge>
                )}
              </div>
              <h1 className="mt-4 text-3xl font-semibold">Ata de Registro de Preços</h1>
              <p className="mt-2 text-sidebar-foreground/75">
                {ata.vendorName} · {ata.managingAgency || "Órgão gerenciador não informado"}
              </p>
              <p className="mt-2 text-xs text-sidebar-foreground/60">
                Vigência: {formatAtaDate(ata.validFrom)} até {formatAtaDate(ata.validUntil)}
                {ata.externalUasg ? ` · UASG ${ata.externalUasg}` : ""}
              </p>
              {ata.pregao && <Button asChild variant="link" className="mt-2 h-auto p-0 text-sidebar-primary"><Link to={`/pregoes/${ata.pregao.id}`}>Pregão PE {ata.pregao.number}/{ata.pregao.year}</Link></Button>}
            </div>
            <div className="flex flex-wrap items-start gap-2">
              {canManage && (
                <>
                  {ata.externalPncpControlNumber && (
                    <Button
                      className="bg-sidebar-primary text-sidebar-primary-foreground"
                      onClick={() => syncPncpMutation.mutate()}
                      disabled={syncPncpMutation.isPending}
                    >
                      <Landmark className={syncPncpMutation.isPending ? "size-4 animate-pulse" : "size-4"} />
                      {syncPncpMutation.isPending ? "Consultando PNCP..." : "Atualizar PNCP"}
                    </Button>
                  )}
                  <Button
                    className="bg-sidebar-primary text-sidebar-primary-foreground"
                    onClick={() => { setSelectedItem(null); setItemOpen(true) }}
                    disabled={!ata.coverageGroups.length}
                  >
                    <Plus className="size-4" />
                    Novo item
                  </Button>
                  <Button variant="secondary" onClick={() => setEditOpen(true)}>
                    <Pencil className="size-4" />
                    Editar ATA
                  </Button>
                  <Button variant="secondary" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="size-4" />
                    Excluir ATA
                  </Button>
                </>
              )}
              <Button variant="secondary" onClick={refresh} disabled={ataQuery.isFetching || itemsQuery.isFetching}>
                <RefreshCw className={ataQuery.isFetching || itemsQuery.isFetching ? "size-4 animate-spin" : "size-4"} />
                Atualizar
              </Button>
            </div>
          </div>
          {ata.notes && (
            <p className="relative mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-sidebar-foreground/75">
              {ata.notes}
            </p>
          )}
        </CardContent>
      </Card>

      {(validity === "EXPIRED" || validity === "INACTIVE") && (
        <Alert>
          <AlertTriangle />
          <AlertTitle>ATA indisponível para novas estimativas</AlertTitle>
          <AlertDescription>
            Os vínculos, saldos e movimentos anteriores continuam preservados para consulta e auditoria.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Valor inicial", value: totals.initialAmount, icon: CircleDollarSign },
          { label: "Saldo disponível", value: totals.availableAmount, icon: Scale },
          { label: "Valor reservado", value: totals.reservedAmount, icon: Boxes },
          { label: "Valor consumido", value: totals.consumedAmount, icon: ArrowDownToLine },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-primary/10 bg-card/80 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-xl font-semibold tabular-nums">{formatAtaCurrency(value)}</p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="size-5 text-primary" />
              Utilização financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold tabular-nums">
                  {totals.utilizationPercentage.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatAtaCurrency(totals.allocatedAmount)} entre reservado e consumido
                </p>
              </div>
              <p className="text-right text-xs text-muted-foreground">
                Último movimento<br />
                <strong className="font-medium text-foreground">
                  {formatAtaDate(totals.lastMovementAt, true)}
                </strong>
              </p>
            </div>
            <Progress className="mt-5 h-2.5" value={totals.utilizationPercentage} />
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span><strong className="text-foreground">{items.length}</strong> itens</span>
              <span><strong className="text-destructive">{totals.riskCount}</strong> críticos</span>
              <span><strong className="text-foreground">{totals.inactiveCount}</strong> inativos</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="size-5 text-primary" />
              Dados oficiais da ATA
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ata.externalSource === "COMPRAS_GOV" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Origem cadastral</p>
                    <p className="mt-2 font-semibold">Compras.gov.br</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contratos PNCP</p>
                    <p className="mt-2 text-2xl font-semibold tabular-nums">{ata.pncpSnapshot?.linkedContracts.total ?? "—"}</p>
                  </div>
                </div>
                <p className="mt-4 text-[11px] text-muted-foreground">Identificador técnico interno: ATA-{ata.ataCode}</p>
                <p className="mt-4 text-xs leading-5 text-muted-foreground">
                  Cadastro importado: {formatAtaDate(ata.externalLastSyncAt ?? null, true)} · PNCP: {formatAtaDate(ata.pncpLastSyncAt ?? null, true)}
                </p>
                {ata.externalPncpControlNumber && <p className="mt-1 break-all text-xs text-muted-foreground">Controle PNCP: {ata.externalPncpControlNumber}</p>}
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  O saldo dos itens é controlado exclusivamente pelas movimentações internas do SAGEP.
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Esta ATA foi cadastrada manualmente. O saldo é controlado pelas movimentações internas do SAGEP.<p className="mt-3 text-[11px]">Identificador técnico interno: ATA-{ata.ataCode}</p></div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2"><MapPin className="size-5 text-primary" />Cobertura territorial</CardTitle>
          {canManage && <Button variant="outline" size="sm" onClick={() => setCoverageOpen(true)}><Pencil className="size-4" />Editar localidades</Button>}
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-primary/10 bg-muted/15 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">{coverageGroup?.name ?? "Região 1"}</p>
              <Badge variant="outline">{coverageLocalities.length} localidade(s)</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {coverageLocalities.map((locality) => <Badge key={`${locality.cityName}-${locality.stateUf}`} variant="secondary">{locality.cityName}/{locality.stateUf}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>

      <FilterToolbar className="xl:grid-cols-[minmax(280px,1fr)_220px_220px_auto]">
        <SearchField
          aria-label="Buscar itens da ATA"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Referência, descrição ou grupo..."
        />
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os grupos</SelectItem>
            {ata.coverageGroups.map((group) => (
              <SelectItem key={group.id} value={group.code}>{group.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={itemFilter} onValueChange={(value) => setItemFilter(value as ItemFilter)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os saldos</SelectItem>
            <SelectItem value="available">Disponíveis</SelectItem>
            <SelectItem value="risk">Críticos ou esgotados</SelectItem>
            <SelectItem value="inactive">Itens inativos</SelectItem>
          </SelectContent>
        </Select>
        {hasItemFilters && (
          <Button variant="ghost" onClick={clearItemFilters}>
            <X className="size-4" />
            Limpar
          </Button>
        )}
      </FilterToolbar>

      {itemsQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Não foi possível carregar os itens e saldos</AlertTitle>
          <AlertDescription>{itemsQuery.error.message}</AlertDescription>
        </Alert>
      )}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="size-5 text-primary" />
              Itens, saldos e rastreabilidade
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {filteredItems.length} de {items.length} item(ns) exibido(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {totals.riskCount > 0 && <Badge variant="destructive">{totals.riskCount} saldo(s) crítico(s)</Badge>}
            {canManage && <Button variant="outline" size="sm" disabled={correctAllItemsMutation.isPending} onClick={() => correctAllItemsMutation.mutate()}><SpellCheck2 className="size-4" />Corrigir todas as descrições</Button>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          {itemsQuery.isLoading ? (
            <DataTableSkeleton />
          ) : filteredItems.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Preço unitário</TableHead>
                  <TableHead>Composição do saldo</TableHead>
                  <TableHead>Saldo disponível</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const status = getAtaItemBalanceStatus(item)
                  const presentation = itemStatusPresentation[status]
                  const initialQuantity = Number(item.balance.initialQuantity)
                  const allocatedQuantity =
                    Number(item.balance.reservedQuantity) + Number(item.balance.consumedQuantity)
                  const allocationPercentage =
                    initialQuantity > 0 ? Math.min(100, (allocatedQuantity / initialQuantity) * 100) : 0
                  const localAvailable = Number(item.balance.availableQuantity)

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-72 max-w-xl">
                        <p className="font-medium">{item.referenceCode}</p>
                        <ItemDescription className="mt-1 text-xs text-muted-foreground">
                          {item.description}
                        </ItemDescription>
                      </TableCell>
                      <TableCell><Badge variant="outline">{item.coverageGroup.name}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap">{formatAtaCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="min-w-48">
                        <div className="flex justify-between gap-3 text-xs">
                          <span>Inicial: {formatAtaQuantity(item.balance.initialQuantity)} {item.unit}</span>
                          <span>{allocationPercentage.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%</span>
                        </div>
                        <Progress className="mt-2 h-1.5" value={allocationPercentage} />
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatAtaQuantity(item.balance.reservedQuantity)} reservado ·{" "}
                          {formatAtaQuantity(item.balance.consumedQuantity)} consumido
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold tabular-nums">{formatAtaQuantity(localAvailable)} {item.unit}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatAtaCurrency(item.balance.availableAmount)}</p>
                      </TableCell>
                      <TableCell><Badge variant={presentation.variant}>{presentation.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Histórico do saldo"
                            aria-label={`Histórico do item ${item.referenceCode}`}
                            onClick={() => setMovementItem(item)}
                          >
                            <History className="size-4" />
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Corrigir descrição pelo dicionário"
                                aria-label={`Corrigir descrição do item ${item.referenceCode}`}
                                disabled={correctItemMutation.isPending}
                                onClick={() => correctItemMutation.mutate(item)}
                              >
                                <SpellCheck2 className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Editar item"
                                aria-label={`Editar item ${item.referenceCode}`}
                                onClick={() => { setSelectedItem(item); setItemOpen(true) }}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={item.isActive ? "Inativar item" : "Ativar item"}
                                aria-label={`${item.isActive ? "Inativar" : "Ativar"} item ${item.referenceCode}`}
                                disabled={toggleItemMutation.isPending}
                                onClick={() => toggleItemMutation.mutate(item)}
                              >
                                <Power className={item.isActive ? "size-4 text-destructive" : "size-4 text-primary"} />
                              </Button>
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
              icon={Boxes}
              title="Nenhum item encontrado"
              description={hasItemFilters ? "Revise os filtros aplicados aos itens da ATA." : "Inclua o primeiro item para iniciar o controle de saldo."}
              action={hasItemFilters ? <Button variant="outline" onClick={clearItemFilters}>Limpar filtros</Button> : undefined}
            />
          )}
        </CardContent>
      </Card>

      {coverageOpen && <AtaCoverageDialog open={coverageOpen} onOpenChange={setCoverageOpen} ata={ata} pending={coverageMutation.isPending} onSubmit={(payload) => coverageMutation.mutateAsync(payload).then(() => undefined)} />}
      <DeleteActionDialog open={deleteOpen} onOpenChange={setDeleteOpen} entityLabel="ATA" entityCode={ata.number} description="A exclusão só será concluída quando não houver estimativas nem movimentações de saldo vinculadas." pending={deleteMutation.isPending} onConfirm={() => deleteMutation.mutate()} />
      {editOpen && (
        <AtaDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          ata={ata}
          pending={editMutation.isPending}
          onSubmit={async (payload) => { await editMutation.mutateAsync(payload) }}
        />
      )}
      {itemOpen && (
        <AtaItemDialog
          open={itemOpen}
          onOpenChange={(open) => { setItemOpen(open); if (!open) setSelectedItem(null) }}
          ata={ata}
          item={selectedItem}
          pending={itemMutation.isPending}
          onSubmit={async (payload) => { await itemMutation.mutateAsync(payload) }}
        />
      )}
      {movementItem && (
        <AtaItemMovementsDialog
          item={movementItem}
          open={Boolean(movementItem)}
          onOpenChange={(open) => !open && setMovementItem(null)}
        />
      )}
    </div>
  )
}
