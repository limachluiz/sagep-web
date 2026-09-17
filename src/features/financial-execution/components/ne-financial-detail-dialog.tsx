import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { financialStatusLabel, formatNeMoney } from "../portfolio-presentation"

type Json = Record<string, unknown>
type Financial = { current: number | null; liquidated: number | null; paid: number | null; status: string; incomplete?: boolean; inconsistent?: boolean; liquidationIncomplete?: boolean; paymentIncomplete?: boolean; unresolvedLiquidations?: number; unresolvedPayments?: number }
type Snapshot = { document: unknown; related: unknown; fetchedAt?: string; financial?: { version?: number; liquidatedComplete?: boolean; paidComplete?: boolean; documents: Array<{ code: string; phase: number; amount: number | null; error?: string; subitems: Json[] }> } }
type Archive = { snapshot: Snapshot; financial: Financial; updatedAt: string }
type ProjectNote = { currentAmount: number; liquidatedAmount: number; paidAmount: number; financialStatus: string; syncStatus: string; rawSnapshot: unknown; lastSyncAt: string; documents: Array<{ number: string; phase: string; amount: number; rawSnapshot: unknown }> }
export type NeDetailSelection = { externalCode: string; number: string; noteId?: string | null }
export function NeFinancialDetailDialog({ selection, onClose }: { selection: NeDetailSelection | null; onClose: () => void }) {
  const query = useQuery({
    queryKey: ["financial-execution", "saved-ne-detail", selection?.noteId ?? selection?.externalCode], enabled: Boolean(selection), retry: false,
    queryFn: async () => {
      if (selection?.noteId) {
        const note = await api.get<ProjectNote>(`/financial-execution/commitment-notes/${encodeURIComponent(selection.noteId)}`)
        return { financial: { current: note.currentAmount, liquidated: note.liquidatedAmount, paid: note.paidAmount, status: note.syncStatus === "VALIDADO" ? note.financialStatus : "A_CONFERIR", inconsistent: note.syncStatus === "DIVERGENTE" || note.paidAmount > note.currentAmount + 0.01 || note.paidAmount > note.liquidatedAmount + 0.01 || note.liquidatedAmount > note.currentAmount + 0.01 || [note.currentAmount, note.liquidatedAmount, note.paidAmount].some(value => value < 0) }, updatedAt: note.lastSyncAt, snapshot: { document: note.rawSnapshot, related: note.documents } } as Archive
      }
      return api.get<Archive>(`/financial-execution/discovery/archive/${encodeURIComponent(selection!.externalCode)}`)
    },
  })
  const result = query.data
  return <Dialog open={Boolean(selection)} onOpenChange={open => { if (!open) onClose() }}><DialogContent className="max-h-[85vh] overflow-auto sm:max-w-4xl"><DialogHeader><DialogTitle>Nota de Empenho {selection?.number}</DialogTitle><DialogDescription>Informações salvas no SAGEP · {selection?.externalCode}</DialogDescription></DialogHeader>
    {query.isLoading && <p>Carregando informações da NE…</p>}
    {query.isError && <p role="alert">Não foi possível abrir a NE: {query.error.message}</p>}
    {result && <>
      <p className="font-semibold">Situação: {financialStatusLabel(result.financial.inconsistent ? "DIVERGENTE" : result.financial.status)}</p>
      <div className="grid gap-3 sm:grid-cols-3">{[["Empenhado", result.financial.current], ["Liquidado", result.financial.liquidated], ["Pago", result.financial.paid]].map(([label, value]) => <div key={String(label)} className="rounded border p-3"><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-semibold">{formatNeMoney(value as number | null)}</p></div>)}</div>
      <p className="text-xs text-muted-foreground">Última atualização: {new Date(result.updatedAt).toLocaleString("pt-BR")}. Ausência de valor não confirma ausência de liquidação ou pagamento.</p>
      {(result.financial.paymentIncomplete || result.financial.liquidationIncomplete) && <p role="status" className="rounded border border-amber-400 p-3 text-sm">O SAGEP encontrou e somou os valores já comprovados, mas ainda há {result.financial.unresolvedPayments ?? 0} documento(s) de pagamento e {result.financial.unresolvedLiquidations ?? 0} documento(s) de liquidação sem parcela confirmada para esta NE. O total exibido é parcial e permanece a conferir.</p>}
      {result.financial.inconsistent && <p role="alert" className="rounded border border-amber-400 p-3 text-sm">Os valores apresentam divergência e não entram nos totais do painel. Confira os documentos da NE.</p>}
      {result.snapshot.financial?.documents.map(d => <section key={`${d.phase}:${d.code}`} className="rounded border p-3 text-sm"><h3 className="font-semibold">{d.phase === 2 ? "Liquidação" : "Pagamento"} · {d.code}</h3><p>Parcela desta NE: {formatNeMoney(d.amount)}</p>{d.error && <p className="text-amber-700">{d.error}</p>}{d.subitems.length > 0 && <details><summary className="cursor-pointer">Ver subitens que compõem o valor</summary><RawRecords value={d.subitems} /></details>}</section>)}
      {Object.entries({ "Nota de Empenho": result.snapshot.document, "Documentos relacionados": result.snapshot.related }).map(([title, value]) => <section key={title}><h3 className="font-semibold">{title}</h3><RawRecords value={value} /></section>)}
    </>}
  </DialogContent></Dialog>
}
function RawRecords({ value }: { value: unknown }) {
  const rows = Array.isArray(value) ? value : value ? [value] : []
  if (!rows.length) return <p className="py-2 text-sm text-muted-foreground">Nenhum documento disponível na cópia salva.</p>
  return <>{rows.map((row, i) => <dl key={i} className="my-2 rounded border p-3 text-sm">{Object.entries(row ?? {}).map(([key, val]) => <div className="grid grid-cols-2 gap-2 border-b py-1" key={key}><dt className="break-words text-muted-foreground">{key}</dt><dd className="break-words">{typeof val === "object" ? JSON.stringify(val) : String(val ?? "—")}</dd></div>)}</dl>)}</>
}
