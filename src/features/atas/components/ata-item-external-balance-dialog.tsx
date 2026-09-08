import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Database, ExternalLink, Loader2, RefreshCw, Scale } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { atasService } from "@/features/atas/atas.service"
import type { AtaItem } from "@/features/atas/atas.types"
import { formatAtaDate, formatAtaQuantity } from "@/features/atas/atas.utils"

type Props = {
  item: AtaItem
  open: boolean
  canManage: boolean
  onOpenChange: (open: boolean) => void
}

export function AtaItemExternalBalanceDialog({ item, open, canManage, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const balanceQuery = useQuery({
    queryKey: ["ata-items", item.id, "external-balance"],
    queryFn: () => atasService.itemExternalBalance(item.id),
    enabled: open,
    retry: false,
  })
  const importMutation = useMutation({
    mutationFn: () => atasService.importItemExternalBalance(item.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["atas", "items", item.ataId] })
      queryClient.setQueryData(["ata-items", item.id, "external-balance"], result)
      toast.success(`Saldo oficial do item ${item.referenceCode} importado.`)
    },
    onError: (error) => toast.error(error.message),
  })
  const official = balanceQuery.data?.items[0]
  const localAvailable = Number(item.balance.availableQuantity)
  const officialAvailable = official?.managerAvailableQuantity == null ? null : Number(official.managerAvailableQuantity)
  const difference = officialAvailable === null ? null : officialAvailable - localAvailable

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Scale className="size-5 text-primary" />Saldo oficial do item {item.referenceCode}</DialogTitle>
          <DialogDescription>Consulta isolada no Contratos.gov.br, sem precisar carregar os demais itens da ATA.</DialogDescription>
        </DialogHeader>

        {balanceQuery.isLoading && <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><Loader2 className="size-5 animate-spin" />Consultando o Governo Federal...</div>}
        {balanceQuery.isError && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Não foi possível consultar este item</AlertTitle>
            <AlertDescription>{balanceQuery.error.message}</AlertDescription>
          </Alert>
        )}
        {official && balanceQuery.data && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Saldo SAGEP</p><p className="mt-2 text-lg font-semibold tabular-nums">{formatAtaQuantity(localAvailable)}</p></div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-xs text-muted-foreground">Saldo UASG</p><p className="mt-2 text-lg font-semibold tabular-nums">{officialAvailable === null ? "—" : formatAtaQuantity(officialAvailable)}</p></div>
              <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Diferença</p><p className="mt-2 text-lg font-semibold tabular-nums">{difference === null ? "—" : `${difference > 0 ? "+" : ""}${formatAtaQuantity(difference)}`}</p></div>
              <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Empenhado oficial</p><p className="mt-2 text-lg font-semibold tabular-nums">{official.managerCommittedQuantity == null ? "—" : formatAtaQuantity(official.managerCommittedQuantity)}</p></div>
            </div>
            <div className="rounded-xl border bg-muted/20 p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2"><span>Total público disponível: <strong>{formatAtaQuantity(official.publishedTotalAvailableForCommitment)} {official.unit}</strong></span><Badge variant="outline">UASG {balanceQuery.data.identity.uasg}</Badge></div>
              <p className="mt-2 text-xs text-muted-foreground">Consultado em {formatAtaDate(balanceQuery.data.checkedAt, true)}. O total público pode incluir unidades participantes.</p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-wrap sm:justify-between">
          <div className="flex gap-2">
            {official && <Button asChild variant="ghost"><a href={official.detailUrl} target="_blank" rel="noreferrer">Abrir fonte <ExternalLink className="size-4" /></a></Button>}
            <Button variant="outline" onClick={() => balanceQuery.refetch()} disabled={balanceQuery.isFetching}><RefreshCw className={balanceQuery.isFetching ? "size-4 animate-spin" : "size-4"} />Consultar novamente</Button>
          </div>
          {canManage && official && <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending}><Database className="size-4" />{importMutation.isPending ? "Importando..." : "Importar fotografia"}</Button>}
        </DialogFooter>
        {official && <p className="text-xs leading-5 text-muted-foreground">A importação grava uma fotografia oficial separada. O saldo operacional e o histórico de reservas do SAGEP permanecem preservados.</p>}
      </DialogContent>
    </Dialog>
  )
}
