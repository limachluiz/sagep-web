import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, ExternalLink, History, Landmark, Loader2 } from "lucide-react"
import { Link } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { atasService } from "@/features/atas/atas.service"
import type { AtaItem, AtaItemMovement } from "@/features/atas/atas.types"
import { formatAtaCurrency, formatAtaQuantity } from "@/features/atas/atas.utils"

const movementLabels: Record<AtaItemMovement["movementType"], string> = { RESERVE: "Reserva", RELEASE: "Liberação", CONSUME: "Consumo", REVERSE_CONSUME: "Estorno", ADJUSTMENT: "Ajuste" }
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) }
function movementSignal(type: AtaItemMovement["movementType"]) { return type === "RELEASE" || type === "REVERSE_CONSUME" ? "+" : "−" }

export function AtaItemMovementsDialog({ item, open, onOpenChange }: { item: AtaItem; open: boolean; onOpenChange: (open: boolean) => void }) {
  const internalQuery = useQuery({ queryKey: ["ata-items", item.id, "movements"], queryFn: () => atasService.listItemMovements(item.id), enabled: open })
  const officialQuery = useQuery({
    queryKey: ["ata-items", item.id, "external-balance"],
    queryFn: () => atasService.itemExternalBalance(item.id),
    enabled: open && Boolean(item.ata.externalUasg),
    retry: false,
    staleTime: 10 * 60 * 1000,
  })
  const official = officialQuery.data?.items[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><History className="size-5 text-primary" />Histórico de saldo · {item.referenceCode}</DialogTitle>
          <DialogDescription>
            {item.description} — saldo SAGEP: {formatAtaQuantity(item.balance.availableQuantity)} {item.unit}
            {item.externalBalanceSnapshot?.managerAvailableQuantity != null && <> · último saldo oficial importado: {formatAtaQuantity(item.externalBalanceSnapshot.managerAvailableQuantity)} {item.unit}</>}.
          </DialogDescription>
        </DialogHeader>

        {item.ata.externalUasg && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-semibold"><Landmark className="size-4 text-primary" />Consumo oficial no Contratos.gov.br</h3>{official && <Badge variant="outline">{official.commitments.length} NE(s)</Badge>}</div>
            {officialQuery.isLoading && <div className="flex items-center justify-center gap-2 rounded-xl border py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Consultando empenhos oficiais...</div>}
            {officialQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível consultar os empenhos oficiais</AlertTitle><AlertDescription>{officialQuery.error.message}</AlertDescription></Alert>}
            {official && (
              <div className="rounded-xl border">
                <div className="grid gap-3 border-b bg-muted/15 p-4 sm:grid-cols-3">
                  <div><p className="text-xs text-muted-foreground">Registrado</p><p className="mt-1 font-semibold">{official.managerRegisteredQuantity == null ? "—" : formatAtaQuantity(official.managerRegisteredQuantity)} {item.unit}</p></div>
                  <div><p className="text-xs text-muted-foreground">Empenhado oficial</p><p className="mt-1 font-semibold">{official.managerCommittedQuantity == null ? "0" : formatAtaQuantity(official.managerCommittedQuantity)} {item.unit}</p></div>
                  <div><p className="text-xs text-muted-foreground">Saldo oficial</p><p className="mt-1 font-semibold text-primary">{official.managerAvailableQuantity == null ? "—" : formatAtaQuantity(official.managerAvailableQuantity)} {item.unit}</p></div>
                </div>
                {official.commitments.length ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow><TableHead>Nota de Empenho</TableHead><TableHead>Unidade</TableHead><TableHead>Fornecedor</TableHead><TableHead>Data</TableHead><TableHead>Quantidade</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                      <TableBody>{official.commitments.map((commitment) => (
                        <TableRow key={`${commitment.unit}-${commitment.number}`}>
                          <TableCell><a className="inline-flex items-center gap-1 font-semibold text-primary hover:underline" href={commitment.transparencyUrl} target="_blank" rel="noreferrer">{commitment.number}<ExternalLink className="size-3.5" /></a></TableCell>
                          <TableCell className="whitespace-nowrap">{commitment.unit}</TableCell>
                          <TableCell className="min-w-64 text-xs">{commitment.supplier}</TableCell>
                          <TableCell className="whitespace-nowrap">{commitment.commitmentDate}</TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">{formatAtaQuantity(commitment.committedQuantity)} {item.unit}</TableCell>
                          <TableCell className="whitespace-nowrap text-right tabular-nums">{formatAtaCurrency(commitment.value)}</TableCell>
                        </TableRow>
                      ))}</TableBody>
                    </Table>
                  </div>
                ) : <p className="p-4 text-sm text-muted-foreground">Nenhuma Nota de Empenho detalhada foi publicada para este item.</p>}
              </div>
            )}
          </section>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Movimentações internas do SAGEP</h3>{internalQuery.data && <Badge variant="outline">{internalQuery.data.length} movimento(s)</Badge>}</div>
          {internalQuery.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar o histórico interno</AlertTitle><AlertDescription>{internalQuery.error.message}</AlertDescription></Alert>}
          {internalQuery.isLoading ? <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div> : internalQuery.data?.length ? (
            <div className="overflow-x-auto rounded-xl border"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Movimento</TableHead><TableHead>Resumo</TableHead><TableHead>Rastreabilidade</TableHead><TableHead>Responsável</TableHead><TableHead className="text-right">Quantidade</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader><TableBody>{internalQuery.data.map((movement) => <TableRow key={movement.id}><TableCell className="whitespace-nowrap text-xs">{formatDate(movement.createdAt)}</TableCell><TableCell><Badge variant={movement.movementType === "CONSUME" ? "default" : movement.movementType === "REVERSE_CONSUME" || movement.movementType === "RELEASE" ? "secondary" : "outline"}>{movementLabels[movement.movementType]}</Badge></TableCell><TableCell className="max-w-xs text-xs">{movement.summary}</TableCell><TableCell><div className="flex min-w-44 flex-wrap gap-1">{movement.projectId && movement.projectCode && <Button asChild variant="outline" size="sm"><Link to={`/projects/${movement.projectId}`}>PRJ-{movement.projectCode}</Link></Button>}{movement.estimateId && movement.estimateCode && <Button asChild variant="outline" size="sm"><Link to={`/estimates/${movement.estimateId}`}>EST-{movement.estimateCode}</Link></Button>}{movement.diexRequestId && movement.diexCode && <Button asChild variant="outline" size="sm"><Link to={`/diex/${movement.diexRequestId}`}>DIEx-{movement.diexCode}</Link></Button>}{movement.serviceOrderId && movement.serviceOrderCode && <Button asChild variant="outline" size="sm"><Link to={`/service-orders/${movement.serviceOrderId}`}>OS-{movement.serviceOrderCode}</Link></Button>}{!movement.projectId && !movement.estimateId && !movement.diexRequestId && !movement.serviceOrderId && <span className="text-xs text-muted-foreground">Ajuste manual</span>}</div></TableCell><TableCell className="text-xs">{movement.actorName || "Sistema"}</TableCell><TableCell className="text-right font-medium tabular-nums">{movementSignal(movement.movementType)}{formatAtaQuantity(movement.quantity)}</TableCell><TableCell className="text-right tabular-nums">{formatAtaCurrency(movement.totalAmount)}</TableCell></TableRow>)}</TableBody></Table></div>
          ) : <div className="rounded-xl border border-dashed py-8 text-center"><History className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-medium">Nenhuma movimentação interna registrada</p><p className="mt-1 text-sm text-muted-foreground">O consumo oficial acima não cria automaticamente movimentos no SAGEP.</p></div>}
        </section>

        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
