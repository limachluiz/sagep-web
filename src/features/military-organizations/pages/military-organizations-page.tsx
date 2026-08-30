import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Building2, ChevronLeft, ChevronRight, FileUp, MapPin, Pencil, Plus, Power, RefreshCw, Search, X } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MilitaryOrganizationDialog } from "@/features/military-organizations/components/military-organization-dialog"
import { MilitaryOrganizationsImportDialog } from "@/features/military-organizations/components/military-organizations-import-dialog"
import { militaryOrganizationsService, type MilitaryOrganizationPayload } from "@/features/projects/military-organizations.service"
import type { FederativeUnit, MilitaryOrganization } from "@/features/projects/projects.types"

const stateLabels: Record<FederativeUnit, string> = { AM: "Amazonas", RO: "Rondônia", RR: "Roraima", AC: "Acre" }

export function MilitaryOrganizationsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [stateUf, setStateUf] = useState<FederativeUnit | "all">("all")
  const [cityName, setCityName] = useState("all")
  const [activity, setActivity] = useState<"all" | "active" | "inactive">("all")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<MilitaryOrganization | null>(null)
  const [toggleTarget, setToggleTarget] = useState<MilitaryOrganization | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 350)
    return () => window.clearTimeout(timeout)
  }, [search])

  const filters = useMemo(() => ({
    page,
    pageSize: 10,
    search: debouncedSearch || undefined,
    stateUf: stateUf === "all" ? undefined : stateUf,
    cityName: cityName === "all" ? undefined : cityName,
    active: activity === "all" ? undefined : activity === "active",
  }), [activity, cityName, debouncedSearch, page, stateUf])

  const listQuery = useQuery({
    queryKey: ["military-organizations", "management", filters],
    queryFn: () => militaryOrganizationsService.list(filters),
    placeholderData: (previous) => previous,
  })
  const summaryQuery = useQuery({
    queryKey: ["military-organizations", "summary"],
    queryFn: () => militaryOrganizationsService.list({ page: 1, pageSize: 100 }),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["military-organizations"] })
  const saveMutation = useMutation({
    mutationFn: (payload: MilitaryOrganizationPayload) => selected
      ? militaryOrganizationsService.update(selected.id, payload)
      : militaryOrganizationsService.create(payload),
    onSuccess: (organization) => {
      toast.success(selected ? `${organization.sigla} atualizada com sucesso.` : `${organization.sigla} cadastrada com sucesso.`)
      setFormOpen(false)
      setSelected(null)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })
  const toggleMutation = useMutation({
    mutationFn: (organization: MilitaryOrganization) => militaryOrganizationsService.update(organization.id, { isActive: !organization.isActive }),
    onSuccess: (organization) => {
      toast.success(`${organization.sigla} ${organization.isActive ? "ativada" : "inativada"} com sucesso.`)
      setToggleTarget(null)
      invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const allOrganizations = summaryQuery.data?.items ?? []
  const availableCities = useMemo(() => Array.from(new Set(
    allOrganizations
      .filter((item) => stateUf === "all" || item.stateUf === stateUf)
      .map((item) => item.cityName.trim())
      .filter(Boolean),
  )).sort((left, right) => left.localeCompare(right, "pt-BR")), [allOrganizations, stateUf])
  const activeCount = allOrganizations.filter((item) => item.isActive).length
  const representedStates = new Set(allOrganizations.map((item) => item.stateUf)).size
  const hasFilters = Boolean(search || stateUf !== "all" || cityName !== "all" || activity !== "all")
  const meta = listQuery.data?.meta

  const clearFilters = () => { setSearch(""); setDebouncedSearch(""); setStateUf("all"); setCityName("all"); setActivity("all"); setPage(1) }
  const openCreate = () => { setSelected(null); setFormOpen(true) }
  const openEdit = (organization: MilitaryOrganization) => { setSelected(organization); setFormOpen(true) }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge className="mb-3">Administração</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Organizações Militares</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Gerencie as OMs disponíveis para classificação, estimativas e execução dos projetos nos quatro estados atendidos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { listQuery.refetch(); summaryQuery.refetch() }} disabled={listQuery.isFetching}><RefreshCw className={listQuery.isFetching ? "size-4 animate-spin" : "size-4"} />Atualizar</Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}><FileUp className="size-4" />Importar CSV</Button>
          <Button onClick={openCreate}><Plus className="size-4" />Nova OM</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-none shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">OMs cadastradas</p><p className="mt-2 text-2xl font-semibold">{summaryQuery.isLoading ? "—" : allOrganizations.length}</p></div><Building2 className="size-6 text-primary" /></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">OMs ativas</p><p className="mt-2 text-2xl font-semibold">{summaryQuery.isLoading ? "—" : activeCount}</p></div><Power className="size-6 text-primary" /></CardContent></Card>
        <Card className="border-none shadow-sm"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">Estados representados</p><p className="mt-2 text-2xl font-semibold">{summaryQuery.isLoading ? "—" : `${representedStates}/4`}</p></div><MapPin className="size-6 text-primary" /></CardContent></Card>
      </div>

      <Card className="border-none shadow-sm"><CardContent className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_200px_220px_200px_auto]">
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar por sigla, nome ou cidade..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <Select value={stateUf} onValueChange={(value) => { setStateUf(value as FederativeUnit | "all"); setCityName("all"); setPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os estados</SelectItem>{Object.entries(stateLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        <Select value={cityName} onValueChange={(value) => { setCityName(value); setPage(1) }} disabled={summaryQuery.isLoading || availableCities.length === 0}><SelectTrigger><SelectValue placeholder="Todos os municípios" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os municípios</SelectItem>{availableCities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent></Select>
        <Select value={activity} onValueChange={(value) => { setActivity(value as "all" | "active" | "inactive"); setPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Ativas e inativas</SelectItem><SelectItem value="active">Somente ativas</SelectItem><SelectItem value="inactive">Somente inativas</SelectItem></SelectContent></Select>
        {hasFilters && <Button variant="ghost" onClick={clearFilters}><X className="size-4" />Limpar</Button>}
      </CardContent></Card>

      {listQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar as OMs</AlertTitle><AlertDescription>{listQuery.error.message}</AlertDescription></Alert>}

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><Building2 className="size-5 text-primary" />Cadastro de OMs</CardTitle>{meta && <Badge variant="outline">{meta.totalItems} registro(s)</Badge>}</CardHeader>
        <CardContent className="overflow-x-auto">
          {listQuery.isLoading ? <div className="space-y-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14" />)}</div> : listQuery.data?.items.length ? (
            <Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Organização Militar</TableHead><TableHead>Localidade</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>
              {listQuery.data.items.map((organization) => <TableRow key={organization.id}>
                <TableCell className="font-mono text-xs">OM-{organization.omCode}</TableCell>
                <TableCell><p className="font-medium">{organization.sigla}</p><p className="mt-1 max-w-md text-xs text-muted-foreground">{organization.name}</p></TableCell>
                <TableCell><p className="font-medium">{organization.cityName}</p><p className="mt-1 text-xs text-muted-foreground">{stateLabels[organization.stateUf]} · {organization.stateUf}</p></TableCell>
                <TableCell><Badge variant={organization.isActive ? "default" : "secondary"}>{organization.isActive ? "Ativa" : "Inativa"}</Badge></TableCell>
                <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => openEdit(organization)}><Pencil className="size-4" />Editar</Button><Button variant="ghost" size="sm" className={organization.isActive ? "text-destructive hover:text-destructive" : "text-primary hover:text-primary"} onClick={() => setToggleTarget(organization)}><Power className="size-4" />{organization.isActive ? "Inativar" : "Ativar"}</Button></div></TableCell>
              </TableRow>)}
            </TableBody></Table>
          ) : <div className="flex flex-col items-center py-16 text-center"><Building2 className="size-10 text-muted-foreground" /><p className="mt-4 font-medium">Nenhuma OM encontrada</p><p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou cadastre uma nova Organização Militar.</p></div>}

          {meta && meta.totalItems > 0 && <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t pt-4"><span className="text-sm text-muted-foreground">Página {meta.page} de {meta.totalPages}</span><Button variant="outline" size="icon" disabled={!meta.hasPreviousPage} onClick={() => setPage((value) => value - 1)} title="Página anterior" aria-label="Página anterior"><ChevronLeft className="size-4" /></Button><Button variant="outline" size="icon" disabled={!meta.hasNextPage} onClick={() => setPage((value) => value + 1)} title="Próxima página" aria-label="Próxima página"><ChevronRight className="size-4" /></Button></div>}
        </CardContent>
      </Card>

      <MilitaryOrganizationDialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setSelected(null) }} organization={selected} pending={saveMutation.isPending} onSubmit={async (payload) => { await saveMutation.mutateAsync(payload) }} />
      <MilitaryOrganizationsImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={invalidate} />

      <Dialog open={Boolean(toggleTarget)} onOpenChange={(open) => !open && setToggleTarget(null)}><DialogContent><DialogHeader><DialogTitle>{toggleTarget?.isActive ? "Inativar" : "Ativar"} Organização Militar?</DialogTitle><DialogDescription>{toggleTarget?.isActive ? `${toggleTarget.sigla} deixará de aparecer em novos projetos e estimativas, mas os vínculos históricos serão preservados.` : `${toggleTarget?.sigla} voltará a ficar disponível nos fluxos operacionais.`}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setToggleTarget(null)} disabled={toggleMutation.isPending}>Cancelar</Button><Button variant={toggleTarget?.isActive ? "destructive" : "default"} onClick={() => toggleTarget && toggleMutation.mutate(toggleTarget)} disabled={!toggleTarget || toggleMutation.isPending}>{toggleTarget?.isActive ? "Confirmar inativação" : "Confirmar ativação"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
