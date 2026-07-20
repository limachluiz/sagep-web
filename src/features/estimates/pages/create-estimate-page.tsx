import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  FilePlus2,
  Loader2,
  PackagePlus,
  Search,
  Trash2,
} from "lucide-react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { estimatesService } from "@/features/estimates/estimates.service"
import type { AtaItem, CreateEstimatePayload } from "@/features/estimates/estimates.types"
import { projectsService } from "@/features/projects/projects.service"

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value))
}

function formatQuantity(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(Number(value))
}

function cityMatches(first: string, second: string) {
  return first.trim().localeCompare(second.trim(), "pt-BR", { sensitivity: "base" }) === 0
}

export function CreateEstimatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [projectId, setProjectId] = useState("")
  const [ataId, setAtaId] = useState("")
  const [coverageGroupId, setCoverageGroupId] = useState("")
  const [notes, setNotes] = useState("")
  const [itemSearch, setItemSearch] = useState("")
  const [quantities, setQuantities] = useState<Record<string, string>>({})

  const projectsQuery = useQuery({
    queryKey: ["projects", "estimate-options"],
    queryFn: () => projectsService.list({ page: 1, pageSize: 100 }),
  })

  const selectedProject = projectsQuery.data?.items.find((project) => project.id === projectId)
  const ataType = selectedProject?.projectType === "CFTV"
    ? "CFTV"
    : selectedProject?.projectType === "FIBRA_OPTICA_PONTO_LOGICO"
      ? "FIBRA_OPTICA"
      : undefined

  const atasQuery = useQuery({
    queryKey: ["atas", "estimate-options", ataType],
    queryFn: () => estimatesService.listAtas(ataType!),
    enabled: Boolean(ataType),
  })

  const selectedAta = atasQuery.data?.items.find((ata) => ata.id === ataId)
  const coverageGroups = useMemo(() => {
    if (!selectedAta || !selectedProject?.om) return []

    return selectedAta.coverageGroups.filter((group) =>
      group.localities.some((locality) =>
        locality.stateUf === selectedProject.om?.stateUf &&
        cityMatches(locality.cityName, selectedProject.om.cityName),
      ),
    )
  }, [selectedAta, selectedProject])
  const selectedCoverageGroup = coverageGroups.find((group) => group.id === coverageGroupId)

  const itemsQuery = useQuery({
    queryKey: ["ata-items", "estimate-options", ataId, selectedCoverageGroup?.code],
    queryFn: () => estimatesService.listAtaItems(ataId, selectedCoverageGroup!.code),
    enabled: Boolean(ataId && selectedCoverageGroup),
  })

  const visibleItems = useMemo(() => {
    const normalizedSearch = itemSearch.trim().toLocaleLowerCase("pt-BR")
    if (!normalizedSearch) return itemsQuery.data?.items ?? []

    return (itemsQuery.data?.items ?? []).filter((item) =>
      `${item.referenceCode} ${item.description}`.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
    )
  }, [itemSearch, itemsQuery.data?.items])

  const selectedItems = useMemo(
    () => (itemsQuery.data?.items ?? []).filter((item) => quantities[item.id] !== undefined),
    [itemsQuery.data?.items, quantities],
  )

  const validationError = useMemo(() => {
    for (const item of selectedItems) {
      const quantity = Number(quantities[item.id])
      const available = Number(item.balance.availableQuantity)
      if (!Number.isFinite(quantity) || quantity <= 0) return `Informe uma quantidade válida para o item ${item.referenceCode}.`
      if (quantity > available) return `A quantidade do item ${item.referenceCode} excede o saldo disponível.`
    }
    return null
  }, [quantities, selectedItems])

  const total = selectedItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(quantities[item.id] || 0),
    0,
  )

  const createMutation = useMutation({
    mutationFn: (payload: CreateEstimatePayload) => estimatesService.create(payload),
    onSuccess: (estimate) => {
      toast.success(`Estimativa EST-${estimate.estimateCode} criada com sucesso.`)
      queryClient.invalidateQueries({ queryKey: ["estimates"] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      navigate(`/estimates/${estimate.id}`)
    },
    onError: (error) => toast.error(error.message),
  })

  const resetAfterProject = () => {
    setAtaId("")
    setCoverageGroupId("")
    setQuantities({})
    setItemSearch("")
  }

  const resetAfterAta = () => {
    setCoverageGroupId("")
    setQuantities({})
    setItemSearch("")
  }

  const resetAfterCoverage = () => {
    setQuantities({})
    setItemSearch("")
  }

  const addItem = (item: AtaItem) => {
    if (Number(item.balance.availableQuantity) <= 0) return
    setQuantities((current) => ({ ...current, [item.id]: "1" }))
  }

  const removeItem = (itemId: string) => {
    setQuantities((current) => {
      const next = { ...current }
      delete next[itemId]
      return next
    })
  }

  const handleSubmit = () => {
    if (!selectedProject?.om || !selectedAta || !selectedCoverageGroup || !selectedItems.length || validationError) return

    const payload: CreateEstimatePayload = {
      projectId: selectedProject.id,
      ataId: selectedAta.id,
      coverageGroupId: selectedCoverageGroup.id,
      omId: selectedProject.om.id,
      items: selectedItems.map((item) => ({
        ataItemId: item.id,
        quantity: Number(quantities[item.id]),
      })),
    }
    if (notes.trim()) payload.notes = notes.trim()

    createMutation.mutate(payload)
  }

  const canSubmit = Boolean(
    selectedProject?.om && selectedAta && selectedCoverageGroup && selectedItems.length && !validationError,
  )

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" className="mb-3 -ml-3 gap-2">
          <Link to="/estimates"><ArrowLeft className="size-4" />Voltar para estimativas</Link>
        </Button>
        <Badge className="mb-3 block w-fit">Nova estimativa</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Compor estimativa de preço</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Selecione o projeto e os itens da ATA. O destino e a cobertura serão validados conforme a OM vinculada ao projeto.
        </p>
      </div>

      {(projectsQuery.isError || atasQuery.isError || itemsQuery.isError) && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Não foi possível carregar as opções da estimativa</AlertTitle>
          <AlertDescription>
            {projectsQuery.error?.message ?? atasQuery.error?.message ?? itemsQuery.error?.message}
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle>1. Projeto e destino</CardTitle></CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>Projeto</Label>
            {projectsQuery.isLoading ? <Skeleton className="h-10" /> : (
              <Select value={projectId} onValueChange={(value) => { setProjectId(value); resetAfterProject() }}>
                <SelectTrigger><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
                <SelectContent>
                  {projectsQuery.data?.items.map((project) => (
                    <SelectItem key={project.id} value={project.id} disabled={!project.projectType || !project.om}>
                      PRJ-{project.projectCode} · {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">Projetos antigos sem tipo ou OM precisam ser classificados antes de receber uma estimativa.</p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Organização Militar</p>
                <p className="mt-1 font-semibold">{selectedProject?.om ? `${selectedProject.om.sigla} · ${selectedProject.om.name}` : "Selecione um projeto classificado"}</p>
                {selectedProject?.om && <p className="mt-1 text-sm text-muted-foreground">{selectedProject.om.cityName}/{selectedProject.om.stateUf}</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle>2. ATA e grupo de cobertura</CardTitle></CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>Ata de Registro de Preços</Label>
            <Select
              value={ataId}
              disabled={!ataType || atasQuery.isLoading}
              onValueChange={(value) => { setAtaId(value); resetAfterAta() }}
            >
              <SelectTrigger><SelectValue placeholder={atasQuery.isLoading ? "Carregando ATAs..." : "Selecione a ATA"} /></SelectTrigger>
              <SelectContent>
                {atasQuery.data?.items.map((ata) => (
                  <SelectItem key={ata.id} value={ata.id}>{ata.number} · {ata.vendorName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {ataType && !atasQuery.isLoading && !atasQuery.data?.items.length && <p className="text-xs text-destructive">Não há ATA ativa compatível com este tipo de projeto.</p>}
          </div>

          <div className="space-y-2">
            <Label>Grupo de cobertura</Label>
            <Select
              value={coverageGroupId}
              disabled={!selectedAta}
              onValueChange={(value) => { setCoverageGroupId(value); resetAfterCoverage() }}
            >
              <SelectTrigger><SelectValue placeholder="Selecione a cobertura" /></SelectTrigger>
              <SelectContent>
                {coverageGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>{group.code} · {group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAta && selectedProject?.om && !coverageGroups.length && (
              <p className="text-xs text-destructive">A ATA selecionada não possui grupo cobrindo {selectedProject.om.cityName}/{selectedProject.om.stateUf}.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>3. Itens e quantidades</CardTitle>
          <Badge variant="outline">{selectedItems.length} selecionado(s)</Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar referência ou descrição..." value={itemSearch} onChange={(event) => setItemSearch(event.target.value)} disabled={!selectedCoverageGroup} />
          </div>

          {itemsQuery.isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14" />)}</div>
          ) : selectedCoverageGroup ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referência</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Valor unitário</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleItems.map((item) => {
                  const selected = quantities[item.id] !== undefined
                  const unavailable = Number(item.balance.availableQuantity) <= 0
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.referenceCode}</TableCell>
                      <TableCell><p className="max-w-md">{item.description}</p></TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>
                        <span className={unavailable ? "font-medium text-destructive" : ""}>{formatQuantity(item.balance.availableQuantity)}</span>
                      </TableCell>
                      <TableCell className="w-36">
                        {selected ? (
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            max={item.balance.availableQuantity}
                            value={quantities[item.id]}
                            onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: event.target.value }))}
                          />
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {selected ? (
                          <Button size="icon" variant="ghost" title="Remover item" onClick={() => removeItem(item.id)}><Trash2 className="size-4" /></Button>
                        ) : (
                          <Button size="sm" variant="outline" className="gap-2" disabled={unavailable} onClick={() => addItem(item)}><PackagePlus className="size-4" />Adicionar</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">Selecione o projeto, a ATA e o grupo de cobertura para consultar os itens.</div>
          )}

          {selectedCoverageGroup && !itemsQuery.isLoading && !visibleItems.length && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum item disponível para os critérios informados.</p>
          )}
          {validationError && <p className="text-sm font-medium text-destructive">{validationError}</p>}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader><CardTitle>4. Finalização</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="estimate-notes">Observações (opcional)</Label>
            <Textarea id="estimate-notes" rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Registre premissas ou informações adicionais da estimativa..." />
          </div>
          <div className="flex flex-col justify-between gap-4 rounded-xl bg-slate-950 p-5 text-white sm:flex-row sm:items-center">
            <div><p className="text-sm text-slate-400">Valor total estimado</p><p className="mt-1 text-3xl font-semibold">{formatCurrency(total)}</p></div>
            <Button className="gap-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400" disabled={!canSubmit || createMutation.isPending} onClick={handleSubmit}>
              {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <FilePlus2 className="size-4" />}
              {createMutation.isPending ? "Criando estimativa..." : "Criar estimativa"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
