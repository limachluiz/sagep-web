import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Database, ExternalLink, Loader2, RefreshCw, Scale } from "lucide-react"
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
    mutationFn: () => atasService.applyOpeningBalance(ataId, openingReason.trim()),
    onSuccess: (response) => {
      queryClient.setQueryData(["atas", "external-balance", ataId], response)
      queryClient.invalidateQueries({ queryKey: ["atas", "items", ataId] })
      setOpeningReason("")
      setOpeningConfirmationOpen(false)
      toast.success(`Saldo de abertura aplicado em ${response.openingBalance.itemsApplied} item(ns).`)
    },
    onError: (error) => toast.error(error.message),
  })
  const result = balanceQuery.data

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
                {canManage && <Button size="sm" variant="outline" onClick={() => importMutation.mutate()} disabled={result.retrieval !== "LIVE" || importMutation.isPending}><Database className="size-4" />{importMutation.isPending ? "Salvando..." : "Salvar consulta (sem alterar saldo)"}</Button>}
              </div>
            </div>

            {result.warnings.map((warning) => <Alert key={warning}><AlertTriangle /><AlertDescription>{warning}</AlertDescription></Alert>)}

            {settingsQuery.data?.implantationModeActive && user?.role === "ADMIN" && canApplyOpeningBalance && <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><div><p className="font-semibold text-amber-700 dark:text-amber-300">Aplicar como saldo de abertura</p><p className="mt-1 text-sm text-muted-foreground">A diferença entre a quantidade inicial e o saldo oficial será registrada como consumo histórico anterior ao SAGEP. Esta ação exige uma consulta ao vivo e não altera a quantidade original da ATA.</p></div><Textarea value={openingReason} onChange={(event) => setOpeningReason(event.target.value)} placeholder="Justificativa, ex.: carga inicial da ATA na implantação do SAGEP" maxLength={500} disabled={result.retrieval !== "LIVE"} /><Button size="sm" variant="outline" onClick={() => setOpeningConfirmationOpen(true)} disabled={result.retrieval !== "LIVE" || openingReason.trim().length < 10 || openingMutation.isPending}><Database className="size-4" />Aplicar saldo de abertura</Button>{result.retrieval !== "LIVE" && <p className="text-xs font-medium text-amber-700 dark:text-amber-300">O snapshot permanece disponível para consulta, mas só poderá ser aplicado depois que o portal oficial responder novamente.</p>}</div>}

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
      title="Aplicar o saldo oficial como abertura?"
      description="A diferença entre a quantidade original e o saldo oficial será persistida como consumo histórico. Esta operação será auditada e não poderá ser refeita depois que existirem consumos operacionais do SAGEP."
      confirmLabel="Confirmar saldo de abertura"
      variant="warning"
      pending={openingMutation.isPending}
      onConfirm={() => openingMutation.mutate()}
    />
  </>
}
