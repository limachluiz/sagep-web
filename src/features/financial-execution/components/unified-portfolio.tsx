import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useAuthStore } from "@/features/auth/auth.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { NeFinancialDetailDialog, type NeDetailSelection } from "./ne-financial-detail-dialog"
import { financialStatusLabel, formatNeMoney as money } from "../portfolio-presentation"

type Row = NeDetailSelection & { managementUnit?: string; origin: string; supplierName: string; current: number | null; liquidated: number | null; paid: number | null; paidNet?: number | null; deductions?: number | null; status: string; incomplete?: boolean; updatedAt: string; liquidationIncomplete?: boolean; paymentIncomplete?: boolean; unresolvedLiquidations?: number; unresolvedPayments?: number; project: { id: string; projectCode: number; title: string } | null }
type Portfolio = { rows: Row[]; total: number; coverage: { committed: number; liquidated: number; paid: number }; diagnostics: { partialLiquidations: number; partialPayments: number }; totals: { committed: number; liquidated: number; paid: number; pending: number } }
export function UnifiedPortfolio() {
  const client = useQueryClient()
  const canManage = useAuthStore(s => s.hasPermission("financial_execution.manage"))
  const [search, setSearch] = useState("")
  const [supplier, setSupplier] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<NeDetailSelection | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const query = useQuery({ queryKey: ["financial-execution", "portfolio"], queryFn: () => api.get<Portfolio>("/financial-execution/portfolio") })
  const all = query.data?.rows ?? []
  const suppliers = [...new Set(all.map(r => r.supplierName))].sort((a,b) => a.localeCompare(b, "pt-BR"))
  const statuses = [...new Set(all.map(r => r.status))].sort((a,b) => financialStatusLabel(a).localeCompare(financialStatusLabel(b), "pt-BR"))
  const rows = all.filter(r => (!supplier || r.supplierName === supplier) && (!status || r.status === status) && `${r.number} ${r.supplierName} ${r.managementUnit ?? r.externalCode}`.toLowerCase().includes(search.toLowerCase()))
  const pages = Math.max(1, Math.ceil(rows.length / pageSize)), currentPage = Math.min(page, pages)
  const refresh = async () => {
    if (progress) return
    const codes = all.filter(r => r.origin !== "PROJECT").map(r => r.externalCode)
    if (!codes.length) return
    setProgress({ done: 0, total: codes.length }); setErrors([])
    const failures: string[] = []
    for (const [i, code] of codes.entries()) {
      try { await api.post(`/financial-execution/discovery/archive/${code}/sync`) }
      catch (e) { failures.push(`${code.slice(11)}: ${e instanceof Error ? e.message : "Não foi possível atualizar"}`) }
      setProgress({ done: i + 1, total: codes.length })
      if (i + 1 < codes.length) await new Promise(resolve => setTimeout(resolve, 1500))
    }
    setErrors(failures); setProgress(null)
    await Promise.all([client.invalidateQueries({ queryKey: ["financial-execution"] }), client.invalidateQueries({ queryKey: ["ne-archive"] })])
    const notify = failures.length === codes.length ? toast.error : toast.success
    notify(`${codes.length - failures.length} NE(s) atualizadas; ${failures.length} falha(s).`)
  }
  return <div className="space-y-4">
    {query.isLoading && <p>Carregando carteira consolidada…</p>}
    {query.isError && <p role="alert">{query.error.message}</p>}
    {query.data && <>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Painel da carteira completa</p>{canManage && <Button variant="outline" disabled={Boolean(progress) || !all.some(r => r.origin !== "PROJECT")} onClick={() => void refresh()}>Atualizar liquidações e pagamentos</Button>}</div>
      <p className="text-xs text-muted-foreground">A atualização consulta as NEs importadas e avulsas na fonte oficial e salva os valores por empenho. Não movimenta saldo das ATAs.</p>
      {(query.data.diagnostics.partialLiquidations > 0 || query.data.diagnostics.partialPayments > 0) && <div role="status" className="rounded border border-amber-400 p-3 text-sm"><p className="font-medium">Varredura da carteira: valores parcialmente confirmados</p><p>{query.data.diagnostics.partialPayments} NE(s) com algum pagamento confirmado e documento pendente · {query.data.diagnostics.partialLiquidations} NE(s) com alguma liquidação confirmada e documento pendente.</p><p className="text-xs text-muted-foreground">Os valores comprovados já aparecem na carteira; essas NEs continuam em “a conferir” até todos os documentos serem confirmados.</p></div>}
      {errors.length > 0 && <div role="alert" className="rounded border border-amber-400 p-3 text-sm">{errors.map(e => <p key={e}>{e}</p>)}</div>}
      <div className="grid gap-3 md:grid-cols-4">{[
        { label: "Empenhado informado", value: money(query.data.coverage.committed ? query.data.totals.committed : null), helper: `${query.data.coverage.committed} de ${query.data.total} NEs com valor utilizável` },
        { label: "Liquidado informado", value: money(query.data.coverage.liquidated ? query.data.totals.liquidated : null), helper: `${query.data.coverage.liquidated} de ${query.data.total} NEs com valor utilizável` },
        { label: "Pago informado", value: money(query.data.coverage.paid ? query.data.totals.paid : null), helper: `${query.data.coverage.paid} de ${query.data.total} NEs com valor utilizável` },
        { label: "NEs a conferir", value: String(query.data.totals.pending), helper: "Dados ausentes, não validados ou divergentes" },
      ].map(c => <Card key={c.label}><CardHeader><CardTitle className="text-sm">{c.label}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{c.value}<p className="mt-2 text-xs font-normal text-muted-foreground">{c.helper}</p></CardContent></Card>)}</div>
      <Card><CardHeader><CardTitle>Carteira consolidada · {query.data.total} NEs únicas</CardTitle>
        <p className="text-sm text-muted-foreground">Clique na NE para conferir valores, liquidações, pagamentos e documentos relacionados.</p>
        <p className="text-xs text-muted-foreground">Valores ausentes ficam como não informados. Registros inconsistentes não entram nos totais. Cada NE é contada uma vez, com prioridade para o registro do projeto.</p>
        <div className="grid gap-3 lg:grid-cols-3">
          <Input aria-label="Buscar na carteira" placeholder="Buscar NE, fornecedor ou UG" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          <select className="h-9 min-w-0 rounded border bg-background px-2 text-sm" aria-label="Filtrar por empresa" value={supplier} onChange={e => { setSupplier(e.target.value); setPage(1) }}><option value="">Todas as empresas</option>{suppliers.map(name => <option key={name} value={name}>{name}</option>)}</select>
          <select className="h-9 rounded border bg-background px-2 text-sm" aria-label="Filtrar por situação" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}><option value="">Todas as situações</option>{statuses.map(s => <option key={s} value={s}>{financialStatusLabel(s)}</option>)}</select>
        </div>
        <p className="text-xs text-muted-foreground">{rows.length} NE(s) nos filtros da lista. Os cartões acima mostram a carteira completa.</p>
      </CardHeader><CardContent>
        <div className="overflow-auto"><table className="w-full text-sm"><thead><tr>{["NE / origem", "Fornecedor", "Empenhado", "Liquidado", "Pago", "Situação", "Atualização"].map(h => <th className="p-2 text-left" key={h}>{h}</th>)}</tr></thead><tbody>
          {rows.slice((currentPage-1)*pageSize,currentPage*pageSize).map(r => <tr key={r.externalCode} className="border-t">
            <td className="p-2"><Button variant="link" className="h-auto p-0 font-semibold" onClick={() => setSelected(r)}>{r.number}</Button><p className="text-xs">UG {r.managementUnit ?? (/^\d{6}/.test(r.externalCode) ? r.externalCode.slice(0,6) : "não informada")} · {r.origin === "PROJECT" ? "Projeto" : r.origin === "STANDALONE" ? "Avulsa" : "Importada"}</p>{r.project && <Link className="text-primary" to={`/projects/${r.project.id}`}>PRJ-{r.project.projectCode}</Link>}</td>
            <td className="p-2">{r.supplierName}</td><td className="p-2">{money(r.current)}</td><td className="p-2">{money(r.liquidated)}{r.liquidationIncomplete && <span className="block text-xs text-amber-700">Parcial confirmado</span>}</td><td className="p-2">{money(r.paid)}{(r.deductions ?? 0) > 0 && <span className="block text-xs text-muted-foreground">OB {money(r.paidNet ?? null)} + DR/DF {money(r.deductions ?? null)}</span>}{r.paymentIncomplete && <span className="block text-xs text-amber-700">Parcial confirmado</span>}</td><td className="p-2">{financialStatusLabel(r.status)}{r.incomplete && (r.paymentIncomplete || r.liquidationIncomplete) && <span className="block text-xs text-amber-700">A conferir</span>}</td><td className="p-2">{r.updatedAt ? new Date(r.updatedAt).toLocaleString("pt-BR") : "Não informada"}</td>
          </tr>)}
          {!rows.length && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhuma NE encontrada para os filtros selecionados.</td></tr>}
        </tbody></table></div>
        <div className="mt-4 flex flex-wrap items-center gap-3"><label>Itens <select aria-label="Itens por página na carteira" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}>{[10,20,30,50].map(n=><option key={n}>{n}</option>)}</select></label><Button variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage-1)}>Anterior</Button><span>{currentPage} / {pages}</span><Button variant="outline" disabled={currentPage>=pages} onClick={()=>setPage(currentPage+1)}>Próxima</Button></div>
      </CardContent></Card>
    </>}
    <NeFinancialDetailDialog selection={selected} onClose={() => setSelected(null)} />
    <Dialog open={Boolean(progress)}><DialogContent className="sm:max-w-lg [&>button]:hidden" onEscapeKeyDown={e=>e.preventDefault()} onPointerDownOutside={e=>e.preventDefault()}><DialogHeader><DialogTitle>Atualizando liquidações e pagamentos</DialogTitle><DialogDescription>{progress?.done} de {progress?.total} NEs processadas. Conferindo a parcela de cada empenho nos documentos oficiais.</DialogDescription></DialogHeader></DialogContent></Dialog>
  </div>
}
