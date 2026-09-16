import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useAuthStore } from "@/features/auth/auth.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

type Entry = { externalCode: string; importedAt: string; updatedAt: string; snapshot: { document: unknown; related: unknown; fetchedAt: string } }
export function NeArchivePanel() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Entry | null>(null)
  const [remove, setRemove] = useState<string | null>(null)
  const client = useQueryClient()
  const canManage = useAuthStore(s => s.hasPermission("financial_execution.manage"))
  const query = useQuery({ queryKey: ["ne-archive", page, search], queryFn: () => api.get<{ items: Entry[]; total: number; pageSize: number }>(`/financial-execution/discovery/archive?page=${page}&search=${encodeURIComponent(search)}`) })
  const deletion = useMutation({ mutationFn: (code: string) => api.delete(`/financial-execution/discovery/archive/${code}`), onSuccess: () => { setRemove(null); setPage(1); client.invalidateQueries({ queryKey: ["ne-archive"] }); toast.success("NE excluída da base de consulta. Saldos preservados.") }, onError: e => toast.error(e.message) })
  return <section className="space-y-3 rounded-xl border p-4">
    <h3 className="font-semibold">NEs importadas — base de consulta</h3>
    <p className="text-sm text-muted-foreground">Registros persistidos, independentes da carteira dos projetos. Importar, atualizar ou excluir aqui não movimenta saldos.</p>
    <Input aria-label="Pesquisar NEs importadas" placeholder="Buscar número da NE ou UG" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
    {query.isLoading && <p>Carregando base de consulta…</p>}
    {query.isError && <p role="alert">Não foi possível carregar a base: {query.error.message}</p>}
    {query.data && <><p className="text-sm">{query.data.total} NE(s) importada(s)</p>{query.data.items.map(item => <div key={item.externalCode} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><Button variant="link" onClick={() => setSelected(item)}>{item.externalCode.slice(11)} · UG {item.externalCode.slice(0, 6)}</Button><p className="text-xs">Última importação: {new Date(item.updatedAt).toLocaleString("pt-BR")}</p></div>{canManage && <Button variant="outline" onClick={() => setRemove(item.externalCode)}>Excluir da base</Button>}</div>)}<div className="flex items-center gap-3"><Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button><span>Página {page} de {Math.max(1, Math.ceil(query.data.total / 20))}</span><Button variant="outline" disabled={page * 20 >= query.data.total} onClick={() => setPage(p => p + 1)}>Próxima</Button></div></>}
    <Dialog open={Boolean(remove)} onOpenChange={open => { if (!open && !deletion.isPending) setRemove(null) }}><DialogContent><DialogHeader><DialogTitle>Excluir NE da base de consulta?</DialogTitle><DialogDescription>Somente a cópia importada {remove} será excluída. A NE oficial e os saldos do SAGEP serão preservados. Você poderá importá-la novamente.</DialogDescription></DialogHeader><Button variant="destructive" disabled={deletion.isPending} onClick={() => remove && deletion.mutate(remove)}>{deletion.isPending ? "Excluindo…" : "Confirmar exclusão"}</Button></DialogContent></Dialog>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null) }}><DialogContent className="max-h-[85vh] overflow-auto sm:max-w-3xl"><DialogHeader><DialogTitle>NE importada {selected?.externalCode.slice(11)}</DialogTitle><DialogDescription>Cópia do Portal da Transparência · sem impacto financeiro</DialogDescription></DialogHeader>{selected && Object.entries({ "Nota de Empenho": selected.snapshot.document, "Documentos relacionados": selected.snapshot.related }).map(([title, value]) => <section key={title}><h4 className="font-semibold">{title}</h4>{(Array.isArray(value) ? value : [value]).map((row, i) => <dl key={i} className="my-2 rounded border p-3 text-sm">{Object.entries(row ?? {}).map(([key, val]) => <div className="grid grid-cols-2 gap-2 border-b py-1" key={key}><dt className="break-words text-muted-foreground">{key}</dt><dd className="break-words">{typeof val === "object" ? JSON.stringify(val) : String(val ?? "—")}</dd></div>)}</dl>)}</section>)}</DialogContent></Dialog>
  </section>
}
