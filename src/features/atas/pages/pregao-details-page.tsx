import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Building2, CalendarDays, CircleDollarSign, FileStack, Loader2, Pencil, RefreshCw, ShieldCheck, Trash2 } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router"
import { toast } from "sonner"
import { DeleteActionDialog } from "@/components/delete-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PregaoDialog } from "@/features/atas/components/pregao-dialog"
import { atasService, pregoesService } from "@/features/atas/atas.service"
import type { Pregao, PregaoPayload } from "@/features/atas/atas.types"
import { formatAtaDate } from "@/features/atas/atas.utils"
import { useAuthStore } from "@/features/auth/auth.store"
import { useState } from "react"

const money = (value: string) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function PregaoDetailsPage() {
  const { pregaoId } = useParams<{ pregaoId: string }>()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const canManage = useAuthStore((state) => state.hasPermission("atas.manage"))
  const [editOpen, setEditOpen] = useState(false)
  const [deletePregaoOpen, setDeletePregaoOpen] = useState(false)
  const [deleteAta, setDeleteAta] = useState<Pregao["atas"][number] | null>(null)
  const query = useQuery({ queryKey: ["pregoes", "details", pregaoId], queryFn: () => pregoesService.details(pregaoId!), enabled: Boolean(pregaoId) })
  const updateImportedMutation = useMutation({
    mutationFn: () => pregoesService.sync(pregaoId!),
    onSuccess: (result) => { toast.success(`${result.atasProcessed} ATA(s) sincronizada(s); ${result.itemsUpdated} item(ns) atualizado(s).`); queryClient.invalidateQueries({ queryKey: ["pregoes"] }); queryClient.invalidateQueries({ queryKey: ["atas"] }) },
    onError: (error) => toast.error(error.message),
  })
  const checkMutation = useMutation({
    mutationFn: () => pregoesService.checkUpdates(pregaoId!),
    onSuccess: (result) => toast.success(`Consulta concluída: ${result.statuses.UPDATE_AVAILABLE ?? 0} atualização(ões), ${result.statuses.NOT_IMPORTED ?? 0} ATA(s) nova(s).`),
    onError: (error) => toast.error(error.message),
  })
  const editMutation = useMutation({
    mutationFn: (payload: PregaoPayload) => pregoesService.update(pregaoId!, payload),
    onSuccess: () => { toast.success("Pregão atualizado."); setEditOpen(false); queryClient.invalidateQueries({ queryKey: ["pregoes"] }) },
    onError: (error) => toast.error(error.message),
  })
  const deleteAtaMutation = useMutation({
    mutationFn: (ataId: string) => atasService.remove(ataId),
    onSuccess: () => {
      toast.success("ATA excluída.")
      setDeleteAta(null)
      queryClient.invalidateQueries({ queryKey: ["pregoes"] })
      queryClient.invalidateQueries({ queryKey: ["atas"] })
    },
    onError: (error) => toast.error(error.message),
  })
  const deletePregaoMutation = useMutation({
    mutationFn: () => pregoesService.remove(pregaoId!),
    onSuccess: () => {
      toast.success("Pregão excluído.")
      navigate("/atas")
      queryClient.invalidateQueries({ queryKey: ["pregoes"] })
    },
    onError: (error) => toast.error(error.message),
  })
  if (query.isLoading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)}</div>
  if (query.isError || !query.data) return <p className="text-sm text-destructive">{query.error?.message ?? "Pregão não encontrado."}</p>
  const pregao = query.data
  return <div className="space-y-6">
    <div><Button asChild variant="ghost" className="mb-3 -ml-3"><Link to="/atas"><ArrowLeft className="size-4" />Voltar para Pregões e Atas</Link></Button><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="flex gap-2"><Badge>{pregao.modality}</Badge><Badge variant="outline">PRG-{pregao.pregaoCode}</Badge></div><h1 className="mt-3 text-3xl font-semibold">PE {pregao.number}/{pregao.year}</h1><p className="mt-2 text-sm text-muted-foreground">UASG {pregao.uasg} · {pregao.managingAgency || "Órgão gerenciador não informado"}</p><p className="mt-1 text-xs text-muted-foreground">Abertura: {formatAtaDate(pregao.openingAt)} · Homologação: {formatAtaDate(pregao.homologatedAt)}</p></div>{canManage && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="size-4" />Editar pregão</Button><Button variant="destructive" onClick={() => setDeletePregaoOpen(true)}><Trash2 className="size-4" />Excluir pregão</Button>{pregao.externalSource === "COMPRAS_GOV" && <><Button variant="outline" onClick={() => checkMutation.mutate()} disabled={checkMutation.isPending}>{checkMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Sincronizar com Compras.gov</Button><Button onClick={() => updateImportedMutation.mutate()} disabled={updateImportedMutation.isPending}>{updateImportedMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}Atualizar somente importadas</Button></>}</div>}</div></div>
    <Card><CardHeader><CardTitle>Objeto da contratação</CardTitle></CardHeader><CardContent><p className="leading-7 text-muted-foreground">{pregao.object || "Objeto resumido ainda não informado."}</p></CardContent></Card>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card><CardContent className="flex items-center gap-3 pt-6"><FileStack className="size-7 text-primary" /><div><p className="text-sm text-muted-foreground">ATAs vinculadas</p><p className="text-2xl font-semibold">{pregao.metrics.ataCount}</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-3 pt-6"><CalendarDays className="size-7 text-primary" /><div><p className="text-sm text-muted-foreground">ATAs vigentes</p><p className="text-2xl font-semibold">{pregao.metrics.activeAtaCount}</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-3 pt-6"><Building2 className="size-7 text-primary" /><div><p className="text-sm text-muted-foreground">Fornecedores</p><p className="text-2xl font-semibold">{pregao.metrics.supplierCount}</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-3 pt-6"><ShieldCheck className="size-7 text-primary" /><div><p className="text-sm text-muted-foreground">Itens registrados</p><p className="text-2xl font-semibold">{pregao.metrics.itemCount}</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-3 pt-6"><CircleDollarSign className="size-7 text-primary" /><div><p className="text-sm text-muted-foreground">Valor registrado</p><p className="text-xl font-semibold">{money(pregao.metrics.totalAmount)}</p></div></CardContent></Card>
      <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Saldo disponível</p><p className="mt-1 text-xl font-semibold text-primary">{money(pregao.metrics.availableAmount)}</p></CardContent></Card>
      <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Valor reservado</p><p className="mt-1 text-xl font-semibold">{money(pregao.metrics.reservedAmount)}</p></CardContent></Card>
      <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Valor consumido</p><p className="mt-1 text-xl font-semibold">{money(pregao.metrics.consumedAmount)}</p></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Atas de Registro de Preços</CardTitle></CardHeader><CardContent>
      {pregao.atas.length ? <Table><TableHeader><TableRow><TableHead>ATA</TableHead><TableHead>Fornecedor</TableHead><TableHead>Cobertura</TableHead><TableHead>Vigência</TableHead><TableHead>Itens</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader><TableBody>{pregao.atas.map((ata) => <TableRow key={ata.id}><TableCell><p className="font-semibold">{ata.number}</p><p className="mt-1 text-xs text-muted-foreground">ATA-{ata.ataCode}</p></TableCell><TableCell className="max-w-80">{ata.vendorName}</TableCell><TableCell>{ata.coverageGroups.map((group) => group.code).join(", ") || "—"}</TableCell><TableCell>{formatAtaDate(ata.validFrom)} até {formatAtaDate(ata.validUntil)}</TableCell><TableCell>{ata._count?.items ?? 0}</TableCell><TableCell><Badge variant={ata.isActive ? "default" : "secondary"}>{ata.isActive ? "Vigente" : "Inativa"}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="sm"><Link to={`/atas/${ata.id}`}>Abrir ATA</Link></Button>{canManage && <Button variant="ghost" size="icon" title="Excluir ATA" onClick={() => setDeleteAta(ata)}><Trash2 className="size-4 text-destructive" /></Button>}</div></TableCell></TableRow>)}</TableBody></Table> : <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma ATA vinculada a este pregão.</p>}
    </CardContent></Card>
    <DeleteActionDialog open={deletePregaoOpen} onOpenChange={setDeletePregaoOpen} entityLabel="pregão" entityCode={`PE ${pregao.number}/${pregao.year}`} description="As ATAs vinculadas precisam ser excluídas primeiro." pending={deletePregaoMutation.isPending} onConfirm={() => deletePregaoMutation.mutate()} />
    {deleteAta && <DeleteActionDialog open={Boolean(deleteAta)} onOpenChange={(open) => !open && setDeleteAta(null)} entityLabel="ATA" entityCode={deleteAta.number} description="A exclusão será bloqueada se houver estimativas ou movimentações de saldo." pending={deleteAtaMutation.isPending} onConfirm={() => deleteAtaMutation.mutate(deleteAta.id)} />}
    {editOpen && <PregaoDialog open={editOpen} pregao={pregao} pending={editMutation.isPending} onOpenChange={setEditOpen} onSubmit={(payload) => editMutation.mutateAsync(payload).then(() => undefined)} />}
  </div>
}