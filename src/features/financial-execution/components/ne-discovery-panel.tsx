import { useAuthStore } from "@/features/auth/auth.store"
import { toast } from "sonner"
import { suggestedPeriod, type Pregao } from "../ne-discovery-period"
import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ApiError, api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

type Row = Record<string, unknown>
type Page = { items: Row[]; exhausted: boolean; fingerprint: string; fetchedAt: string; missingDates: number }
const text = (value: unknown) => value == null ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value)


export function NeDiscoveryPanel() {
  const client = useQueryClient()
  const canManage = useAuthStore(s => s.hasPermission("financial_execution.manage"))
  const canEditAta = useAuthStore(s => s.hasPermission("atas.manage"))
  const [supplier, setSupplier] = useState<{ id: string; name: string; cnpj: string } | null>(null)
  const [resolving, setResolving] = useState(false)
  const [resolvingIds, setResolvingIds] = useState<string[]>([])
  const [supplierErrors, setSupplierErrors] = useState<string[]>([])
  const [ataIds, setAtaIds] = useState<string[]>([])
  const [pageSize, setPageSize] = useState(10)
  const [checked, setChecked] = useState<string[]>([])
  const [batch, setBatch] = useState<{ done: number; total: number } | null>(null)
  const [batchErrors, setBatchErrors] = useState<string[]>([])
  const [duplicates, setDuplicates] = useState<Array<{ code: string; origin: string }>>([])
  const duplicate = duplicates[0]
  const dismissDuplicate = () => setDuplicates(values => values.slice(1))
  const [resultPage, setResultPage] = useState(1)

  const resolveOne = useMutation({ mutationFn: (id: string) => api.post<{ updated: boolean; cnpj: string; source?: string }>(`/financial-execution/discovery/suppliers/${id}/resolve`), onMutate: id => { setResolvingIds(ids => [...ids, id]) }, onSettled: (_data, _error, id) => { setResolvingIds(ids => ids.filter(value => value !== id)) }, onSuccess: result => { client.invalidateQueries({ queryKey: ["ne-discovery-options"] }); toast.success(`CNPJ encontrado: ${result.cnpj}${result.source ? ` · ${result.source}` : ""}`) }, onError: e => toast.error(e.message) })
  const saveSupplier = useMutation({ mutationFn: (value: { id: string; cnpj: string }) => api.patch(`/atas/${value.id}`, { vendorCnpj: value.cnpj.replace(/\D/g, "") }), onSuccess: () => { setSupplier(null); client.invalidateQueries({ queryKey: ["ne-discovery-options"] }); toast.success("CNPJ da ATA atualizado. Execute a busca novamente.") }, onError: e => toast.error(e.message) })
  const options = useQuery({ queryKey: ["ne-discovery-options"], queryFn: () => api.get<{ defaultUg: string; pregoes: Pregao[] }>("/financial-execution/discovery/options") })
  const [selected, setSelected] = useState<string[]>([])
  const [units, setUnits] = useState<string | null>(null)
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [rows, setRows] = useState<Row[]>([])
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState("")
  const [coverage, setCoverage] = useState({ completed: 0, total: 0, pages: 0, updated: "", filters: "" })
  const [code, setCode] = useState<string | null>(null)
  const stop = useRef(false)
  const busy = useRef(false)
  useEffect(() => () => { stop.current = true }, [])
  const pregoes = (options.data?.pregoes ?? []).filter(p => selected.includes(p.id)).map(p => ({ ...p, atas: p.atas.filter(a => a.id && ataIds.includes(a.id)) }))
  const period = suggestedPeriod(pregoes)
  const detail = useQuery({ queryKey: ["ne-discovery-detail", code], enabled: Boolean(code), retry: false, queryFn: () => api.get<{ document: unknown; related: unknown; fetchedAt: string }>(`/financial-execution/discovery/documents/${code}`) })
  const select = (ids: string[], all = false) => {
    setSelected(ids)
    const chosen = (options.data?.pregoes ?? []).filter(p => ids.includes(p.id))
    const nextIds = chosen.flatMap(p => p.atas.flatMap(a => a.id && (all || !selected.includes(p.id) || ataIds.includes(a.id)) ? [a.id] : []))
    setAtaIds(nextIds)
    const dates = suggestedPeriod(chosen.map(p => ({ ...p, atas: p.atas.filter(a => a.id && nextIds.includes(a.id)) })))
    setStart(dates.start); setEnd(dates.end)
  }
  const resolveSuppliers = async () => {
    setResolving(true); setSupplierErrors([])
    const failures: string[] = []
    try {
      const pending = pregoes.flatMap(p => p.atas).filter(a => a.id && !/^\d{14}$/.test(a.vendorCnpj?.replace(/\D/g, "") ?? ""))
      let next = 0
      await Promise.all(Array.from({ length: Math.min(2, pending.length) }, async () => {
        while (next < pending.length) {
          const ata = pending[next++]
          try { await api.post(`/financial-execution/discovery/suppliers/${ata.id}/resolve`) }
          catch (error) { failures.push(`ATA ${ata.number}: ${error instanceof Error ? error.message : "Fonte indisponível"}`) }
        }
      }))
      setSupplierErrors(failures)
      const refreshed = await options.refetch()
      if (refreshed.error) throw refreshed.error
      return (refreshed.data?.pregoes ?? []).filter(p => selected.includes(p.id)).map(p => ({ ...p, atas: p.atas.filter(a => a.id && ataIds.includes(a.id)) }))
    } finally { setResolving(false) }
  }
  const search = async () => {
    if (busy.current || resolving || batch || resolvingIds.length > 0) return
    let searchPregoes = pregoes
    if (canEditAta && pregoes.some(p => p.atas.some(a => !/^\d{14}$/.test(a.vendorCnpj?.replace(/\D/g, "") ?? "")))) {
      busy.current = true
      try { searchPregoes = await resolveSuppliers() }
      catch (error) { setMessage(error instanceof Error ? error.message : "Falha ao atualizar fornecedores"); return }
      finally { busy.current = false }
    }
    const ugs = [...new Set((units ?? options.data?.defaultUg ?? "").split(/[\s,;]+/).filter(Boolean))]
    const suppliers = [...new Set(searchPregoes.flatMap(p => p.atas.map(a => a.vendorCnpj?.replace(/\D/g, "") ?? "")).filter(c => /^\d{14}$/.test(c)))]
    if (!selected.length || !ugs.length || ugs.some(u => !/^\d{6}$/.test(u)) || !start || !end || start > end || !suppliers.length) {
      setMessage("Selecione pregões com CNPJ cadastrado, informe UGs com 6 dígitos e um intervalo válido."); return
    }
    const first = Number(start.slice(0, 4)), last = Number(end.slice(0, 4))
    if (first < 2000 || last > 2100) { setMessage("Informe anos entre 2000 e 2100."); return }
    const total = suppliers.length * ugs.length * (last - first + 1)
    busy.current = true; stop.current = false; setRunning(true); setRows([]); setChecked([]); setResultPage(1); setMessage("Consulta em andamento…")
    const filters = `${start} a ${end} · UGs ${ugs.join(", ")} · ${suppliers.length} fornecedor(es)`
    setCoverage({ completed: 0, total, pages: 0, updated: "", filters })
    const found = new Map<string, Row>()
    let currentRequest = ""
    try {
      for (const cnpj of suppliers) for (const ug of ugs) for (let year = first; year <= last; year++) {
        const fingerprints = new Set<string>()
        let exhausted = false
        for (let page = 1; page <= 10000; page++) {
          if (stop.current) throw new Error("Consulta interrompida; cobertura parcial.")
          await new Promise(resolve => setTimeout(resolve, 1500))
          if (stop.current) throw new Error("Consulta interrompida; cobertura parcial.")
          currentRequest = `CNPJ ${cnpj} · UG ${ug} · ano ${year} · página ${page}`
          setMessage(`Consultando ${currentRequest}…`)
          const result = await api.post<Page>("/financial-execution/discovery/page", { pregaoIds: selected, ataIds, cnpj, ug, startDate: start, endDate: end, year, page })
          if (stop.current) throw new Error("Consulta interrompida; cobertura parcial.")
          if (!result.exhausted && fingerprints.has(result.fingerprint)) throw new Error("A fonte repetiu uma página; cobertura parcial.")
          fingerprints.add(result.fingerprint)
          for (const row of result.items) {
            const key = String(row.documento ?? "")
            if (!/^\d{15}NE\d{6}$/.test(key)) throw new Error("A fonte retornou uma NE sem identificação válida; cobertura parcial.")
            found.set(key, row)
          }
          setRows([...found.values()])
          setCoverage(c => ({ ...c, pages: c.pages + 1, updated: result.fetchedAt, completed: c.completed + (result.exhausted ? 1 : 0) }))
          if (result.exhausted) { exhausted = true; break }
        }
        if (!exhausted) throw new Error("Limite de páginas atingido; cobertura parcial.")
      }
      const skipped = searchPregoes.flatMap(p => p.atas).filter(a => !/^\d{14}$/.test(a.vendorCnpj?.replace(/\D/g, "") ?? "")).length
      setMessage(`Consulta concluída para os fornecedores com CNPJ válido. A cobertura corresponde aos dados disponibilizados pela fonte.${skipped ? ` Atenção: ${skipped} ATA(s) sem CNPJ válido ficaram fora da busca; revise o cadastro em Pregões e Atas.` : ""}`)
    } catch (error) { setMessage(`${error instanceof Error ? error.message : "Falha na consulta"}${currentRequest ? ` (${currentRequest})` : ""}. Os resultados já obtidos permanecem visíveis; não representam uma busca completa.`) }
    finally { busy.current = false; setRunning(false) }
  }
  const importBatch = async (codes: string[], replaceOrigin?: string) => {
    if (batch || running || !codes.length) return
    setBatch({ done: 0, total: codes.length }); setBatchErrors([])
    const errors: string[] = []
    for (const [i, code] of codes.entries()) {
      try { await api.post(`/financial-execution/discovery/archive/${code}`, { origin: "IMPORTED", replaceOrigin }) }
      catch (e) {
        const details = e instanceof ApiError ? e.details as { details?: { existingOrigin?: string } } : undefined
        if (details?.details?.existingOrigin) {
          const origin = details.details.existingOrigin
          setDuplicates(values => values.some(value => value.code === code) ? values : [...values, { code, origin }])
        }
        errors.push(`${code}: ${e instanceof Error ? e.message : "Falha"}`)
      }
      setBatch({ done: i + 1, total: codes.length })
      if (i + 1 < codes.length) await new Promise(resolve => setTimeout(resolve, 1500))
    }
    setBatchErrors(errors); setBatch(null)
    client.invalidateQueries({ queryKey: ["ne-archive"] }); client.invalidateQueries({ queryKey: ["financial-execution"] })
    const report = errors.length === codes.length ? toast.error : toast.success
    report(`${codes.length - errors.length} NE(s) importadas/atualizadas; ${errors.length} falha(s).`)
  }
  return <Card>
    <CardHeader><CardTitle>Buscar NEs por pregão e fornecedor</CardTitle><p className="text-sm text-muted-foreground">Busca no Portal da Transparência por CNPJ, UG emitente e ano. O vínculo com o pregão precisa de conferência.</p></CardHeader>
    <CardContent className="space-y-4">
      {options.isError && <p role="alert">Falha ao carregar os pregões: {options.error.message}</p>}
      {options.isLoading && <p>Carregando pregões…</p>}
      <fieldset disabled={running || resolving || Boolean(batch)} className="space-y-3">
        <legend className="font-medium">Pregões e vigências das ATAs</legend>
        <Button variant="outline" size="sm" disabled={!options.data} onClick={() => select((options.data?.pregoes ?? []).map(p => p.id), true)}>Selecionar todos</Button>
        {options.data?.pregoes.map(p => <div key={p.id} className="space-y-3 rounded-lg border p-3">
          <label className="flex items-center gap-3"><input type="checkbox" checked={selected.includes(p.id)} onChange={e => select(e.target.checked ? [...selected, p.id] : selected.filter(id => id !== p.id))} /><strong>{p.number}/{p.year} · {p.type ?? "Pregão"} · UASG {p.uasg}</strong></label>
          {selected.includes(p.id) && p.atas.map(a => <label key={a.id ?? a.number} className="ml-5 flex items-start gap-3 text-sm"><input type="checkbox" checked={Boolean(a.id && ataIds.includes(a.id))} onChange={e => {
            const ids = e.target.checked ? [...ataIds, a.id!] : ataIds.filter(id => id !== a.id)
            setAtaIds(ids)
            const dates = suggestedPeriod((options.data?.pregoes ?? []).filter(p => selected.includes(p.id)).map(p => ({ ...p, atas: p.atas.filter(a => a.id && ids.includes(a.id)) })))
            setStart(dates.start); setEnd(dates.end)
          }} /><span>ATA {a.number} · {a.vendorName} · CNPJ {a.vendorCnpj ?? "pendente"}<span className="block text-xs text-muted-foreground">{a.validFrom?.slice(0,10) ?? "Início não informado"} a {a.validUntil?.slice(0,10) ?? "Fim não informado"}</span></span></label>)}
        </div>)}
        {canEditAta && <Button variant="outline" disabled={resolvingIds.length > 0 || !ataIds.length} onClick={() => void resolveSuppliers().catch(e => toast.error(e.message))}>Buscar CNPJs de todas as ATAs selecionadas</Button>}
        {canEditAta && pregoes.flatMap(p => p.atas).filter(a => a.id && !/^\d{14}$/.test(a.vendorCnpj?.replace(/\D/g, "") ?? "")).map(a => <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-300 p-2 text-sm"><span>ATA {a.number} · {a.vendorName}: CNPJ pendente (busca automática ao consultar NEs)</span><Button size="sm" disabled={resolvingIds.includes(a.id!)} onClick={() => resolveOne.mutate(a.id!)}>{resolvingIds.includes(a.id!) ? "Consultando…" : "Buscar CNPJ"}</Button><Button size="sm" variant="outline" onClick={() => setSupplier({ id: a.id!, name: a.vendorName, cnpj: a.vendorCnpj ?? "" })}>Informar CNPJ</Button></div>)}
        {period.incomplete && selected.length > 0 && <p className="text-sm text-amber-700">Há vigências ausentes. Confira e complete manualmente o intervalo.</p>}
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">UGs emitentes<Input value={units ?? options.data?.defaultUg ?? ""} placeholder="160016, 167016" onChange={e => setUnits(e.target.value)} /></label>
          <label className="text-sm">Emissão da NE: início<Input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
          <label className="text-sm">Emissão da NE: fim<Input type="date" value={end} onChange={e => setEnd(e.target.value)} /></label>
        </div>
        <Button onClick={search} disabled={!options.data || resolvingIds.length > 0 || !ataIds.length}>Buscar NEs</Button>
      </fieldset>
      {resolving && <p role="status">Consultando CNPJs das ATAs selecionadas, aproveitando dados salvos e resultados oficiais do PNCP…</p>}
      {supplierErrors.length > 0 && <div role="alert" className="rounded border border-amber-300 p-3 text-sm"><p>Não foi possível preencher automaticamente:</p>{supplierErrors.map(error => <p key={error}>{error}</p>)}</div>}
      {running && <Button variant="outline" onClick={() => { stop.current = true }}>Interromper consulta</Button>}
      {message && <p role="status" className="rounded-lg border p-3 text-sm">{message}</p>}
      {coverage.total > 0 && <div className="rounded-lg bg-muted p-3 text-sm"><p>{coverage.filters}</p><p>{rows.length} NEs únicas · {coverage.completed}/{coverage.total} combinações fornecedor/UG/ano concluídas · {coverage.pages} respostas de páginas da API já processadas automaticamente</p><p>Fonte: Portal da Transparência · Última resposta: {coverage.updated ? new Date(coverage.updated).toLocaleString("pt-BR") : "Aguardando"}</p></div>}
      {rows.length > 0 && <div className="flex flex-wrap items-center gap-2"><label>Itens por página <select aria-label="Itens por página" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setResultPage(1) }}>{[10,20,30,50].map(n => <option key={n}>{n}</option>)}</select></label><Button variant="outline" onClick={() => setChecked(rows.map(r => String(r.documento)))}>Selecionar todas</Button><Button variant="outline" onClick={() => setChecked([])}>Desmarcar</Button><Button variant="outline" disabled={running || Boolean(batch) || !checked.length} onClick={() => { setRows(values => values.filter(row => !checked.includes(String(row.documento)))); setChecked([]); setResultPage(1) }}>Remover selecionadas dos resultados</Button>{canManage && <><Button disabled={Boolean(batch) || running || !checked.length} onClick={() => void importBatch(checked)}>Importar selecionadas ({checked.length})</Button><Button disabled={Boolean(batch) || running} onClick={() => void importBatch(rows.map(r => String(r.documento)))}>Importar todas ({rows.length})</Button></>}</div>}
      {batchErrors.length > 0 && <div role="alert" className="rounded border p-3 text-sm">{batchErrors.map(e => <p key={e}>{e}</p>)}</div>}
      <Dialog open={running || resolving || Boolean(batch)}><DialogContent onEscapeKeyDown={e => e.preventDefault()} onPointerDownOutside={e => e.preventDefault()} className="sm:max-w-lg [&>button]:hidden"><DialogHeader><DialogTitle>{batch ? "Importando NEs" : resolving ? "Buscando CNPJs" : "Buscando Notas de Empenho"}</DialogTitle><DialogDescription>{batch ? `${batch.done} de ${batch.total} processadas` : resolving ? "Conferindo fornecedores das ATAs selecionadas…" : message}</DialogDescription></DialogHeader>{running && <><p>{rows.length} NEs encontradas · {coverage.pages} páginas consultadas</p><Button variant="outline" onClick={() => { stop.current = true }}>Interromper busca</Button></>}</DialogContent></Dialog>
      <Dialog open={Boolean(duplicate) && !batch} onOpenChange={open => { if (!open) dismissDuplicate() }}><DialogContent><DialogHeader><DialogTitle>NE duplicada</DialogTitle><DialogDescription>{duplicate?.code.slice(11)}: já existe uma cópia avulsa. Escolha qual manter ({duplicates.length} pendência(s)). A carteira conta esta NE apenas uma vez.</DialogDescription></DialogHeader><Button variant="outline" onClick={() => dismissDuplicate()}>Manter avulsa e descartar nova importação</Button><Button onClick={() => { if (duplicate) void importBatch([duplicate.code], duplicate.origin); dismissDuplicate() }}>Excluir cópia avulsa e manter importada</Button></DialogContent></Dialog>
      {rows.length > 0 && <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left">{["Selecionar", "NE", "UG", "Fornecedor", "Emissão", "Valor informado pela fonte", "Conferência", "Ações"].map(h => <th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{rows.slice((resultPage - 1) * pageSize, resultPage * pageSize).map(row => <tr className="border-b" key={String(row.documento)}><td className="p-2"><input aria-label={`Selecionar ${row.documentoResumido ?? row.documento}`} type="checkbox" checked={checked.includes(String(row.documento))} onChange={e => setChecked(c => e.target.checked ? [...c, String(row.documento)] : c.filter(code => code !== row.documento))} /></td><td className="p-2"><Button variant="link" onClick={() => setCode(String(row.documento))}>{text(row.documentoResumido ?? row.documento)}</Button></td><td className="p-2">{text(row.codigoUg)}</td><td className="p-2">{text(row.nomeFavorecido ?? row.favorecido)}</td><td className="p-2">{text(row.data)}</td><td className="p-2">{text(row.valor)}</td><td className="p-2">{row.dateUnverified ? "Data não confirmada · " : ""}Vínculo com pregão pendente</td><td className="p-2">{canManage && <Button size="sm" disabled={Boolean(batch) || running} onClick={() => void importBatch([String(row.documento)])}>Importar / atualizar</Button>}</td></tr>)}</tbody></table></div>}
      {rows.length > 0 && <div className="flex items-center gap-3"><Button variant="outline" disabled={resultPage === 1} onClick={() => setResultPage(p => p - 1)}>Anterior</Button><span>Página {resultPage} de {Math.ceil(rows.length / pageSize)} · {rows.length} NEs encontradas</span><Button variant="outline" disabled={resultPage * pageSize >= rows.length} onClick={() => setResultPage(p => p + 1)}>Próxima</Button><Button variant="outline" disabled={running} onClick={() => { setRows([]); setChecked([]); setResultPage(1); setMessage(""); setCoverage({ completed: 0, total: 0, pages: 0, updated: "", filters: "" }) }}>Limpar resultados</Button></div>}
      <Dialog open={Boolean(supplier)} onOpenChange={open => { if (!open) setSupplier(null) }}><DialogContent><DialogHeader><DialogTitle>Informar CNPJ da ATA</DialogTitle><DialogDescription>{supplier?.name} · confira o CNPJ no documento oficial antes de salvar.</DialogDescription></DialogHeader><Input aria-label="CNPJ do fornecedor" value={supplier?.cnpj ?? ""} onChange={e => setSupplier(s => s ? { ...s, cnpj: e.target.value } : s)} /><Button disabled={saveSupplier.isPending || !supplier || !/^\d{14}$/.test(supplier.cnpj.replace(/\D/g, ""))} onClick={() => supplier && saveSupplier.mutate(supplier)}>Salvar CNPJ</Button></DialogContent></Dialog>
      <p className="text-xs text-muted-foreground">Esta busca não altera saldos. O valor retornado na listagem não é um total validado de pagamentos ou liquidações. Documentos relacionados são consultados sem restringir suas datas à vigência da ATA.</p>
      <Dialog open={Boolean(code)} onOpenChange={open => { if (!open) setCode(null) }}><DialogContent className="max-h-[85vh] overflow-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Documentos da NE</DialogTitle><DialogDescription>{code} · Portal da Transparência</DialogDescription></DialogHeader>
        {detail.isLoading && <p>Consultando documento e vínculos…</p>}{detail.isError && <p role="alert">Consulta incompleta: {detail.error.message}</p>}
        {detail.data && <><p className="text-sm">Ausência de documento relacionado não confirma ausência de liquidação ou pagamento.</p>{Object.entries({ "Nota de Empenho": detail.data.document, "Documentos relacionados": detail.data.related }).map(([title, data]) => <section key={title}><h3 className="font-semibold">{title}</h3>{(Array.isArray(data) ? data : [data]).map((item: Row, i: number) => <dl key={i} className="my-2 rounded-lg border p-3 text-sm">{Object.entries(item ?? {}).map(([k, v]) => <div className="grid grid-cols-2 gap-3 border-b py-1" key={k}><dt className="break-words text-muted-foreground">{k}</dt><dd className="break-words">{text(v)}</dd></div>)}</dl>)}</section>)}</>}
      </DialogContent></Dialog>
    </CardContent>
  </Card>
}
