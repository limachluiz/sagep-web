import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, PackagePlus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { ItemDescription } from "@/components/item-description"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { estimatesService } from "@/features/estimates/estimates.service"
import type { AtaItem, Estimate, UpdateEstimatePayload } from "@/features/estimates/estimates.types"

type EstimateEditDialogProps = {
  estimate: Estimate
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (estimate: Estimate) => void
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value))
}

function formatQuantity(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(Number(value))
}

export function EstimateEditDialog({ estimate, open, onOpenChange, onSaved }: EstimateEditDialogProps) {
  const [notes, setNotes] = useState(() => estimate.notes ?? "")
  const [search, setSearch] = useState("")
  const [quantities, setQuantities] = useState<Record<string, string>>(() =>
    Object.fromEntries(estimate.items.map((item) => [item.ataItem.id, item.quantity])),
  )

  const itemsQuery = useQuery({
    queryKey: ["ata-items", "estimate-edit", estimate.ata.id, estimate.coverageGroup.code],
    queryFn: () => estimatesService.listAtaItems(estimate.ata.id, estimate.coverageGroup.code),
    enabled: open,
  })

  const selectedItems = useMemo(
    () => (itemsQuery.data?.items ?? []).filter((item) => quantities[item.id] !== undefined),
    [itemsQuery.data?.items, quantities],
  )

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR")
    if (!normalizedSearch) return itemsQuery.data?.items ?? []
    return (itemsQuery.data?.items ?? []).filter((item) =>
      `${item.referenceCode} ${item.description}`.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
    )
  }, [itemsQuery.data?.items, search])

  const validationError = useMemo(() => {
    if (!selectedItems.length) return "Mantenha ao menos um item na estimativa."
    for (const item of selectedItems) {
      const quantity = Number(quantities[item.id])
      const available = Number(item.balance.availableQuantity)
      if (!Number.isFinite(quantity) || quantity <= 0) return `Informe uma quantidade válida para ${item.referenceCode}.`
      if (quantity > available) return `A quantidade de ${item.referenceCode} excede o saldo disponível.`
    }
    return null
  }, [quantities, selectedItems])

  const total = selectedItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(quantities[item.id] || 0),
    0,
  )

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateEstimatePayload) => estimatesService.update(estimate.id, payload),
    onSuccess: (updatedEstimate) => {
      toast.success(`Estimativa EST-${updatedEstimate.estimateCode} atualizada.`)
      onSaved(updatedEstimate)
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

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

  const submit = () => {
    if (validationError) return
    const payload: UpdateEstimatePayload = {
      items: selectedItems.map((item) => ({
        ataItemId: item.id,
        quantity: Number(quantities[item.id]),
      })),
      notes: notes.trim(),
    }
    updateMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Editar EST-{estimate.estimateCode}</DialogTitle>
          <DialogDescription>
            Atualize itens, quantidades e observações enquanto a estimativa estiver em rascunho.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-3 rounded-xl bg-muted/40 p-4 sm:grid-cols-3">
            <div><p className="text-xs text-muted-foreground">Projeto</p><p className="font-medium">PRJ-{estimate.project.projectCode}</p></div>
            <div><p className="text-xs text-muted-foreground">ATA</p><p className="font-medium">{estimate.ata.number}</p></div>
            <div><p className="text-xs text-muted-foreground">Cobertura</p><p className="font-medium">{estimate.coverageGroup.code}</p></div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar referência ou descrição..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>

          {itemsQuery.isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14" />)}</div>
          ) : itemsQuery.isError ? (
            <p className="text-sm text-destructive">{itemsQuery.error.message}</p>
          ) : (
            <div className="max-h-80 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referência</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
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
                        <TableCell className="min-w-64 max-w-lg"><ItemDescription>{item.description}</ItemDescription></TableCell>
                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell>{formatQuantity(item.balance.availableQuantity)} {item.unit}</TableCell>
                        <TableCell className="w-32">
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
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Remover"
                              aria-label={`Remover item ${item.referenceCode} da estimativa`}
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled={unavailable} onClick={() => addItem(item)}><PackagePlus className="size-4" />Adicionar</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-estimate-notes">Observações</Label>
            <Textarea id="edit-estimate-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-950 p-4 text-white">
            <div><p className="text-xs text-slate-400">Novo total</p><p className="text-2xl font-semibold">{formatCurrency(total)}</p></div>
            <Badge className="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15">{selectedItems.length} item(ns)</Badge>
          </div>
          {validationError && <p className="text-sm font-medium text-destructive">{validationError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateMutation.isPending}>Cancelar</Button>
          <Button onClick={submit} disabled={Boolean(validationError) || updateMutation.isPending || itemsQuery.isLoading}>
            {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
