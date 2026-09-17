import { NeFinancialDetailDialog } from "./ne-financial-detail-dialog"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useAuthStore } from "@/features/auth/auth.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

type Entry = { origin: string; externalCode: string; importedAt: string; updatedAt: string; snapshot: { document: unknown; related: unknown; fetchedAt: string } }
export function NeArchivePanel() {
  const [pageSize, setPageSize] = useState(10)
  const [checked, setChecked] = useState<string[]>([])
  const [preparing, setPreparing] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Entry | null>(null)
  const [remove, setRemove] = useState<string[] | null>(null)
  const client = useQueryClient()
  const canManage = useAuthStore(s => s.hasPermission("financial_execution.manage"))
  const query = useQuery({ queryKey: ["ne-archive", page, pageSize, search], queryFn: () => api.get<{ items: Entry[]; total: number; pageSize: number }>(`/financial-execution/discovery/archive?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`) })
  const deletion = useMutation({ mutationFn: (codes: string[]) => api.post("/financial-execution/discovery/archive/delete-selected", { codes }), onSuccess: () => { setRemove(null); setPage(1); setChecked([]); client.invalidateQueries({ queryKey: ["financial-execution"] }); client.invalidateQueries({ queryKey: ["ne-archive"] }); toast.success("NEs excluídas da base de consulta. Saldos preservados.") }, onError: e => toast.error(e.message) })
  return <section className="space-y-3 rounded-xl border p-4">
    <h3 className="font-semibold">NEs importadas e avulsas — base de consulta</h3>
    <p className="text-sm text-muted-foreground">Registros persistidos que compõem a carteira consolidada. Importar, atualizar ou excluir aqui não movimenta saldos.</p>
    <Input aria-label="Pesquisar NEs importadas" placeholder="Buscar número da NE ou UG" value={search} onChange={e => { setSearch(e.target.value); setPage(1); setChecked([]) }} />
    {canManage && <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!query.data?.items.length} onClick={() => setChecked(c => [...new Set([...c, ...(query.data?.items.map(i => i.externalCode) ?? [])])])}>Selecionar página</Button><Button variant="outline" onClick={() => setChecked([])}>Desmarcar</Button><Button variant="outline" disabled={!checked.length} onClick={() => setRemove(checked)}>Excluir selecionadas ({checked.length})</Button><Button variant="destructive" disabled={preparing || !query.data?.total} onClick={async () => { setPreparing(true); try { setRemove(await api.get<string[]>(`/financial-execution/discovery/archive/keys?search=${encodeURIComponent(search)}`)) } catch (e) { toast.error(e instanceof Error ? e.message : "Falha") } finally { setPreparing(false) } }}>Excluir todas do filtro</Button></div>}
    {query.isLoading && <p>Carregando base de consulta…</p>}
    {query.isError && <p role="alert">Não foi possível carregar a base: {query.error.message}</p>}
    {query.data && <><p className="text-sm">{query.data.total} NE(s) salva(s)</p>{query.data.items.map(item => <div key={item.externalCode} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div>{canManage && <input type="checkbox" aria-label={`Selecionar ${item.externalCode}`} checked={checked.includes(item.externalCode)} onChange={e => setChecked(c => e.target.checked ? [...c, item.externalCode] : c.filter(code => code !== item.externalCode))} />}<Button variant="link" onClick={() => setSelected(item)}>{item.externalCode.slice(11)} · UG {item.externalCode.slice(0, 6)}</Button><p className="text-xs">{item.origin === "STANDALONE" ? "Avulsa" : "Importada"} · Última atualização: {new Date(item.updatedAt).toLocaleString("pt-BR")}</p></div>{canManage && <Button variant="outline" onClick={() => setRemove([item.externalCode])}>Excluir da base</Button>}</div>)}<div className="flex items-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button><label>Itens <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}>{[10,20,30,50].map(n => <option key={n}>{n}</option>)}</select></label><span>Página {page} de {Math.max(1, Math.ceil(query.data.total / pageSize))}</span><Button variant="outline" disabled={page * pageSize >= query.data.total} onClick={() => setPage(p => p + 1)}>Próxima</Button></div></>}
    <Dialog open={Boolean(remove)} onOpenChange={open => { if (!open && !deletion.isPending) setRemove(null) }}><DialogContent><DialogHeader><DialogTitle>Excluir {remove?.length ?? 0} NE(s) da base?</DialogTitle><DialogDescription>Somente as {remove?.length ?? 0} cópias selecionadas serão excluídas. A NE oficial e os saldos do SAGEP serão preservados. Você poderá importá-la novamente.</DialogDescription></DialogHeader><Button variant="destructive" disabled={deletion.isPending} onClick={() => remove && deletion.mutate(remove)}>{deletion.isPending ? "Excluindo…" : "Confirmar exclusão"}</Button></DialogContent></Dialog>
    <NeFinancialDetailDialog selection={selected ? { externalCode: selected.externalCode, number: selected.externalCode.slice(11) } : null} onClose={() => setSelected(null)} />
  </section>
}
