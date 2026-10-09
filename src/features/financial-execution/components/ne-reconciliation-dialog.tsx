import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Item = { id: string; referenceCode: string; description: string; unit: string; unitPrice: string; balance?: { availableQuantity: string } }
type Candidate = { ata: { id: string; number: string; vendorName: string }; confidenceScore: number; evidence: string[]; items: Item[] }
type Project = { id: string; projectCode: number; title: string; estimates: Array<{ ataId: string }> }
type Overview = { candidates: Candidate[]; projects: Project[]; active: { id: string } | null }

export function NeReconciliationDialog({ code, open, onOpenChange }: { code: string | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ["ne-reconciliation", code], queryFn: () => api.get<Overview>(`/financial-execution/discovery/archive/${code}/reconciliation`), enabled: open && Boolean(code) })
  const [ataId, setAtaId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [reason, setReason] = useState("")
  const [applyToBalance, setApplyToBalance] = useState(true)
  useEffect(() => { const first = query.data?.candidates[0]; if (first && !ataId) setAtaId(first.ata.id) }, [query.data, ataId])
  const candidate = query.data?.candidates.find((item) => item.ata.id === ataId)
  const projects = useMemo(() => query.data?.projects.filter((project) => !ataId || project.estimates.some((estimate) => estimate.ataId === ataId) || !project.estimates.length) ?? [], [query.data, ataId])
  useEffect(() => { if (projects.length && !projects.some((item) => item.id === projectId)) setProjectId(projects[0]!.id) }, [projects, projectId])
  const allocations = Object.entries(quantities).filter(([, value]) => Number(value) > 0).map(([ataItemId, quantity]) => ({ ataItemId, quantity: Number(quantity) }))
  const total = candidate?.items.reduce((sum, item) => sum + Number(quantities[item.id] || 0) * Number(item.unitPrice), 0) ?? 0
  const refresh = async () => { await client.invalidateQueries({ queryKey: ["ne-reconciliation", code] }); await client.invalidateQueries({ queryKey: ["financial-execution"] }) }
  const confirm = useMutation({ mutationFn: () => api.post(`/financial-execution/discovery/archive/${code}/reconciliation`, { projectId, ataId, reason: reason.trim() || null, applyToBalance, allocations }), onSuccess: async () => { toast.success("Conciliação confirmada e registrada."); await refresh() }, onError: (error) => toast.error(error.message) })
  const reverse = useMutation({ mutationFn: (id: string) => api.post(`/financial-execution/discovery/reconciliations/${id}/reverse`, { reason: reason.trim() }), onSuccess: async () => { toast.success("Conciliação revertida."); await refresh() }, onError: (error) => toast.error(error.message) })
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>Conciliação assistida da NE</DialogTitle><DialogDescription>O SAGEP sugere vínculos por evidências. Somente sua confirmação associa a NE e pode consumir saldo.</DialogDescription></DialogHeader>
    {query.isLoading && <p>Calculando sugestões…</p>}{query.isError && <p className="text-destructive">{query.error.message}</p>}
    {query.data?.active ? <div className="space-y-4"><Alert><AlertTitle>Conciliação já confirmada</AlertTitle><AlertDescription>Este vínculo está ativo e impede novo consumo da mesma NE.</AlertDescription></Alert><Label>Motivo obrigatório para reversão</Label><Input value={reason} onChange={(event) => setReason(event.target.value)} /><Button variant="destructive" disabled={reason.trim().length < 3 || reverse.isPending} onClick={() => reverse.mutate(query.data!.active!.id)}>Reverter conciliação e saldo</Button></div> : query.data && <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2"><div><Label>ATA sugerida</Label><select className="mt-2 h-10 w-full rounded-md border bg-background px-3" value={ataId} onChange={(event) => { setAtaId(event.target.value); setQuantities({}) }}>{query.data.candidates.map((item) => <option key={item.ata.id} value={item.ata.id}>{item.ata.number} · {item.ata.vendorName} · {item.confidenceScore}%</option>)}</select></div><div><Label>Projeto de destino</Label><select className="mt-2 h-10 w-full rounded-md border bg-background px-3" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Selecione</option>{projects.map((item) => <option key={item.id} value={item.id}>PRJ-{item.projectCode} · {item.title}</option>)}</select></div></div>
      {candidate && <Alert><AlertTitle>Confiança {candidate.confidenceScore}%</AlertTitle><AlertDescription>{candidate.evidence.join(" · ")}. A pontuação auxilia a conferência e não confirma o vínculo automaticamente.</AlertDescription></Alert>}
      <div className="space-y-2"><Label>Itens e quantidades efetivamente atendidos</Label>{candidate?.items.map((item) => <div key={item.id} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_10rem]"><div><strong>{item.referenceCode}</strong><p className="text-sm text-muted-foreground">{item.description}</p><p className="text-xs">Disponível: {item.balance?.availableQuantity ?? "0"} {item.unit} · R$ {Number(item.unitPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div><Input type="number" min="0" step="0.00001" placeholder="Quantidade" value={quantities[item.id] ?? ""} onChange={(event) => setQuantities({ ...quantities, [item.id]: event.target.value })} /></div>)}</div>
      <div className="grid gap-4 md:grid-cols-2"><div><Label>Justificativa / conferência</Label><Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Opcional" /></div><label className="flex items-center gap-2 self-end rounded-lg border p-3 text-sm"><input type="checkbox" checked={applyToBalance} onChange={(event) => setApplyToBalance(event.target.checked)} />Consumir saldo dos itens ao confirmar</label></div>
      <div className="flex items-center justify-between"><strong>Total alocado: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong><Button disabled={!projectId || !ataId || !allocations.length || confirm.isPending} onClick={() => confirm.mutate()}>{confirm.isPending ? "Confirmando…" : "Confirmar conciliação"}</Button></div>
    </div>}
  </DialogContent></Dialog>
}
