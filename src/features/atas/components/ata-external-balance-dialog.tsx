import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Database, ExternalLink, Loader2, RefreshCw, Scale, Settings2 } from "lucide-react"
import { Link } from "react-router"
import { toast } from "sonner"

import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { atasService } from "@/features/atas/atas.service"
import { useAuthStore } from "@/features/auth/auth.store"
import { systemSettingsService } from "@/features/system-settings/system-settings.service"
import type { AtaItem } from "@/features/atas/atas.types"
import { formatAtaCurrency, formatAtaDate, formatAtaQuantity } from "@/features/atas/atas.utils"

type Props = {
  ataId: string
  items: AtaItem[]
  open: boolean
  canManage: boolean
  onOpenChange: (open: boolean) => void
}

export function AtaExternalBalanceDialog({ ataId, items, open, canManage, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const canApplyOpeningBalance = useAuthStore((state) => state.hasPermission("settings.manage"))
  const [openingReason, setOpeningReason] = useState("")
  const [openingConfirmationOpen, setOpeningConfirmationOpen] = useState(false)
  const settingsQuery = useQuery({ queryKey: ["system-settings"], queryFn: systemSettingsService.get, enabled: open })
  const balanceQuery = useQuery({
    queryKey: ["atas", "external-balance", ataId],
    queryFn: () => atasService.externalBalance(ataId),
    enabled: open,
    retry: false,
    staleTime: 10 * 60 * 1000,
  })
  const openingSource = balanceQuery.data?.retrieval === "SNAPSHOT_FALLBACK" ? "SAVED_SNAPSHOT" : "LIVE"
  const importMutation = useMutation({
    mutationFn: () => atasService.importExternalBalance(ataId),
    onSuccess: (result) => {
      queryClient.setQueryData(["atas", "external-balance", ataId], result)
      queryClient.invalidateQueries({ queryKey: ["atas", "items", ataId] })
      toast.success(`${result.import.itemsImported} consulta(s) oficial(is) salva(s). O saldo operacional não foi alterado.`)
    },
    onError: (error) => toast.error(error.message),
  })
  const openingMutation = useMutation({
    mutationFn: () => atasService.applyOpeningBalance(ataId, openingReason.trim(), openingSource),
    onSuccess: async (response) => {
      queryClient.setQueryData(["atas", "external-balance", ataId], response)
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["atas", "items", ataId], type: "active" }),
        queryClient.refetchQueries({ queryKey: ["atas", "details", ataId], type: "active" }),
      ])
      queryClient.invalidateQueries({ queryKey: ["ata-items"] })
      queryClient.invalidateQueries({ queryKey: ["pregoes"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      setOpeningReason("")
      setOpeningConfirmationOpen(false)
      onOpenChange(false)
      toast.success(`Saldo de abertura aplicado em ${response.openingBalance.itemsApplied} item(ns) a partir ${response.openingBalance.appliedFrom === "SAVED_SNAPSHOT" ? "do snapshot salvo" : "da consulta ao vivo"}.`)
    },
    onError: (error) => toast.error(error.message),
  })
  const result = balanceQuery.data
  const pendingItems = items.filter((item) => item.externalBalanceSnapshot && !item.openingBalanceAppliedAt)
  const implantationModeActive = Boolean(settingsQuery.data?.implantationModeActive)
  const isAdmin = user?.role === "ADMIN"
  const canApply = implantationModeActive && isAdmin && canApplyOpeningBalance

  return <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Scale className="size-5 text-primary" />Consulta de saldo oficial</DialogTitle>
          <DialogDescription>Compare os saldos do SAGEP com o Contratos.gov.br e consulte as Notas de Empenho vinculadas a cada item.</DialogDescription>
        </DialogHeader>

        {balanceQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Loader2 className="size-5 animate-spin" />Consultando o Governo Federal...</div>
        )}
        {balanceQuery.isError && (
          <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível consultar o saldo</AlertTitle><AlertDescription>{balanceQuery.error.message}</AlertDescription></Alert>
        )}
        {result && (
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 rounded-xl border bg-muted/15 p-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2"><p className="font-medium">UASG {result.identity.uasg} · PE {result.identity.pregaoNumber}/{result.identity.pregaoYear} · ATA {result.identity.ataNumber}</p><Badge variant={result.retrieval === "LIVE" ? "secondary" : "outline"}>{result.retrieval === "LIVE" ? "Consulta ao vivo" : "Último snapshot"}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">Consultado em {formatAtaDate(result.checkedAt, true)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => balanceQuery.refetch()} disabled={balanceQuery.isFetching}>
                  <RefreshCw className={balanceQuery.isFetching ? "size-4 animate-spin" : "size-4"} />Consultar novamente
                </Button>
                {canManage && result.retrieval === "LIVE" && <Button size="sm" variant="outline" onClick={() => importMutation.mutate()} disabled={importMutation.isPending}><Database className="size-4" />{importMutation.isPending ? "Salvando consulta..." : "Guardar consulta para revisar depois"}</Button>}
              </div>
            </div>

            {result.warnings.map((warning) => <Alert key={warning}><AlertTriangle /><AlertDescription>{warning}</AlertDescription></Alert>)}

            {pendingItems.length > 0 && settingsQuery.isLoading && (
              <div className="flex items-center gap-2 rounded-xl border p-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />Verificando autorização para aplicar o saldo ao SAGEP...
              </div>
            )}

            {pendingItems.length > 0 && settingsQuery.isError && (
              <Alert variant="destructive">
                <AlertTriangle />
                <AlertTitle>Não foi possível verificar o modo de implantação</AlertTitle>
                <AlertDescription>Atualize a página e tente novamente. Nenhum saldo foi alterado.</AlertDescription>
              </Alert>
            )}

            {pendingItems.length > 0 && !settingsQuery.isLoading && !settingsQuery.isError && !implantationModeActive && (
              <Alert className="border-amber-500/30 bg-amber-500/5">
                <AlertTriangle />
                <AlertTitle>Ative o modo de implantação para aplicar este saldo</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>A consulta já está salva no banco, mas ainda não alterou o saldo operacional. A aplicação controlada só é liberada durante o modo de implantação.</p>
                  {isAdmin && canApplyOpeningBalance && (
                    <Button asChild size="sm" variant="outline"><Link to="/settings/integrations"><Settings2 className="size-4" />Abrir modo de implantação</Link></Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {pendingItems.length > 0 && implantationModeActive && (!isAdmin || !canApplyOpeningBalance) && (
              <Alert>
                <AlertTriangle />
                <AlertTitle>Aplicação restrita ao administrador</AlertTitle>
                <AlertDescription>A consulta está salva. Entre com um administrador que possua a permissão de gerenciar configurações para aplicá-la ao saldo.</AlertDescription>
              </Alert>
            )}

            {pendingItems.length === 0 && snapshotItemsApplied(items) && (
              <Alert className="border-emerald-500/30 bg-emerald-500/5">
                <CheckCircle2 />
                <AlertTitle>Saldo oficial já aplicado</AlertTitle>
                <AlertDescription>Os itens desta consulta já compõem o saldo operacional do SAGEP.</AlertDescription>
              </Alert>
            )}

            {pendingItems.length > 0 && canApply && (
              <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-300">Aplicar como saldo de abertura</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {result.retrieval === "LIVE"
                      ? "A diferença entre a quantidade inicial e o saldo oficial atual será registrada como consumo histórico anterior ao SAGEP."
                      : `O portal oficial está indisponível. A diferença será calculada usando o snapshot salvo em ${formatAtaDate(result.checkedAt, true)}.`}
                    {" "}A quantidade original da ATA não será alterada.
                  </p>
                </div>
                <Textarea value={openingReason} onChange={(event) => setOpeningReason(event.target.value)} placeholder="Justificativa, ex.: carga inicial da ATA na implantação do SAGEP" maxLength={500} />
                <Button size="sm" onClick={() => setOpeningConfirmationOpen(true)} disabled={openingReason.trim().length < 10 || openingMutation.isPending}>
                  <Database className="size-4" />
                  {result.retrieval === "LIVE" ? `Aplicar saldo ao SAGEP (${pendingItems.length} itens)` : `Aplicar snapshot salvo (${pendingItems.length} itens)`}
                </Button>
                {result.retrieval !== "LIVE" && <p className="text-xs font-medium text-amber-700 dark:text-amber-300">A origem e a data desse snapshot serão registradas na auditoria.</p>}
              </div>
            )}

            <div className="space-y-3">
              {result.items.map((officialItem) => {
                const localItem = items.find((item) => item.id === officialItem.ataItemId)
                const localAvailable = localItem ? Number(localItem.balance.availableQuantity) : null
                const officialAvailable = officialItem.managerAvailableQuantity === null ? null : Number(officialItem.managerAvailableQuantity)
                const difference = localAvailable !== null && officialAvailable !== null ? officialAvailable - localAvailable : null
                return (
                  <section key={officialItem.ataItemId} className="overflow-hidden rounded-xl border">
                    <div className="grid gap-3 bg-muted/15 p-4 md:grid-cols-[minmax(240px,1.6fr)_repeat(3,minmax(110px,.55fr))_auto] md:items-center">
                      <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">Item {Number(officialItem.itemNumber)}</p><Badge variant={localItem?.openingBalanceAppliedAt ? "secondary" : "outline"}>{localItem?.openingBalanceAppliedAt ? "Abertura aplicada" : "Somente consulta"}</Badge></div><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{officialItem.description}</p></div>
                      <div><p className="text-xs text-muted-foreground">Saldo SAGEP</p><p className="mt-1 font-semibold tabular-nums">{localAvailable === null ? "—" : `${formatAtaQuantity(localAvailable)} ${officialItem.unit}`}</p></div>
                      <div><p className="text-xs text-muted-foreground">Saldo UASG</p><p className="mt-1 font-semibold tabular-nums">{officialAvailable === null ? "—" : `${formatAtaQuantity(officialAvailable)} ${officialItem.unit}`}</p></div>
                      <div><p className="text-xs text-muted-foreground">Diferença</p><p className="mt-1 font-semibold tabular-nums">{difference === null ? "—" : `${difference > 0 ? "+" : ""}${formatAtaQuantity(difference)}`}</p></div>
                      <Button asChild variant="ghost" size="icon" title="Abrir item no Contratos.gov.br"><a href={officialItem.detailUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /></a></Button>
                    </div>
                    <div className="border-t px-4 py-3">
                      <div className="mb-2 flex items-center justify-between gap-3"><p className="text-sm font-medium">Notas de Empenho que consumiram o item</p><Badge variant="outline">{officialItem.commitments.length} NE(s)</Badge></div>
                      {officialItem.commitments.length ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader><TableRow><TableHead>Nota de Empenho</TableHead><TableHead>Unidade</TableHead><TableHead>Fornecedor</TableHead><TableHead>Data</TableHead><TableHead>Quantidade</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                            <TableBody>{officialItem.commitments.map((commitment) => (
                              <TableRow key={`${commitment.unit}-${commitment.number}`}>
                                <TableCell><a className="inline-flex items-center gap-1 font-semibold text-primary hover:underline" href={commitment.transparencyUrl} target="_blank" rel="noreferrer">{commitment.number}<ExternalLink className="size-3.5" /></a></TableCell>
                                <TableCell className="whitespace-nowrap">{commitment.unit}</TableCell>
                                <TableCell className="min-w-64 text-xs">{commitment.supplier}</TableCell>
                                <TableCell className="whitespace-nowrap">{commitment.commitmentDate}</TableCell>
                                <TableCell className="whitespace-nowrap tabular-nums">{formatAtaQuantity(commitment.committedQuantity)} {officialItem.unit}</TableCell>
                                <TableCell className="whitespace-nowrap text-right tabular-nums">{formatAtaCurrency(commitment.value)}</TableCell>
                              </TableRow>
                            ))}</TableBody>
                          </Table>
                        </div>
                      ) : <p className="py-2 text-sm text-muted-foreground">Nenhuma Nota de Empenho foi publicada para este item.</p>}
                    </div>
                  </section>
                )
              })}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">Os números das NEs abrem o detalhamento do documento no Portal da Transparência. Salvar a consulta preserva apenas o snapshot para conferência; somente “Aplicar saldo de abertura” altera itens, valores, utilização financeira, dashboards e saldo disponível.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
    <ConfirmationDialog
      open={openingConfirmationOpen}
      onOpenChange={setOpeningConfirmationOpen}
      title={openingSource === "SAVED_SNAPSHOT" ? "Aplicar o snapshot salvo como abertura?" : "Aplicar o saldo oficial como abertura?"}
      description={openingSource === "SAVED_SNAPSHOT" ? `Será utilizado o snapshot salvo em ${result ? formatAtaDate(result.checkedAt, true) : "data não informada"}. A operação será auditada e atualizará os saldos e dashboards do SAGEP.` : "A diferença entre a quantidade original e o saldo oficial será persistida como consumo histórico. Esta operação será auditada e não poderá ser refeita depois que existirem consumos operacionais do SAGEP."}
      confirmLabel={openingSource === "SAVED_SNAPSHOT" ? "Confirmar aplicação do snapshot" : "Confirmar saldo de abertura"}
      variant="warning"
      pending={openingMutation.isPending}
      onConfirm={() => openingMutation.mutate()}
    />
  </>
}

function snapshotItemsApplied(items: AtaItem[]) {
  const snapshotItems = items.filter((item) => item.externalBalanceSnapshot)
  return snapshotItems.length > 0 && snapshotItems.every((item) => item.openingBalanceAppliedAt)
}
