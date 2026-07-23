import { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ClipboardList, FileText, Landmark, Loader2, Search, ShieldCheck } from "lucide-react"
import { useNavigate } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { headerService } from "@/features/header/header.service"
import type { GlobalSearchItem } from "@/features/header/header.types"

const groups = [
  { key: "projects", label: "Projetos", icon: ClipboardList },
  { key: "estimates", label: "Estimativas", icon: FileText },
  { key: "diexRequests", label: "DIEx", icon: Landmark },
  { key: "serviceOrders", label: "Ordens de Serviço", icon: ShieldCheck },
] as const

function resultPath(item: GlobalSearchItem) {
  if (item.type === "PROJECT") return `/projects/${item.id}`
  if (item.type === "ESTIMATE") return `/estimates/${item.id}`
  if (item.type === "DIEX_REQUEST") return `/diex/${item.id}`
  return `/service-orders/${item.id}`
}

export function GlobalSearchDialog({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(timeout)
  }, [query])

  const searchQuery = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: () => headerService.search(debouncedQuery),
    enabled: open && debouncedQuery.length >= 2,
    staleTime: 30_000,
  })
  const hasResults = useMemo(() => Boolean(searchQuery.data?.total), [searchQuery.data?.total])
  const selectResult = (item: GlobalSearchItem) => { setOpen(false); setQuery(""); navigate(resultPath(item)) }

  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery("") }}>
    <DialogTrigger asChild>{compact ? <Button variant="outline" size="icon" className="border-primary/15 bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-primary" aria-label="Abrir busca global"><Search className="size-4" /></Button> : <Button variant="outline" className="h-9 w-full justify-start border-primary/10 bg-white/[.025] px-3 font-normal text-muted-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-foreground"><Search className="size-4 text-primary/70" />Buscar em todo o SAGEP...<kbd className="ml-auto hidden border border-primary/10 bg-black/20 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground xl:inline">CTRL K</kbd></Button>}</DialogTrigger>
    <DialogContent className="sagep-panel max-h-[85vh] gap-4 overflow-hidden p-0 sm:max-w-2xl">
      <DialogHeader className="border-b px-6 pb-4 pt-6"><DialogTitle>Busca global</DialogTitle><DialogDescription>Pesquise por código, título, responsável, OM, localidade ou número de documento.</DialogDescription></DialogHeader>
      <div className="px-6"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input autoFocus className="h-11 pl-9 pr-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: PRJ-12, Manaus, CFTV ou DIEx..." aria-label="Termo da busca global" />{searchQuery.isFetching && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}</div></div>
      <div className="min-h-40 overflow-y-auto px-6 pb-6">
        {query.trim().length < 2 && <div className="py-10 text-center text-sm text-muted-foreground"><Search className="mx-auto mb-3 size-8" />Digite pelo menos dois caracteres para pesquisar.</div>}
        {searchQuery.isError && <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{searchQuery.error.message}</div>}
        {debouncedQuery.length >= 2 && !searchQuery.isFetching && !hasResults && !searchQuery.isError && <div className="py-10 text-center text-sm text-muted-foreground">Nenhum resultado encontrado para “{debouncedQuery}”.</div>}
        {hasResults && <div className="space-y-5">{groups.map(({ key, label, icon: Icon }) => { const items = searchQuery.data?.groups[key] ?? []; if (!items.length) return null; return <section key={key} aria-labelledby={`search-${key}`}><div className="mb-2 flex items-center gap-2"><Icon className="size-4 text-primary" /><h3 id={`search-${key}`} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3><Badge variant="outline">{items.length}</Badge></div><div className="space-y-1">{items.map((item) => <button type="button" key={`${item.type}:${item.id}`} onClick={() => selectResult(item)} className="flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="min-w-0 flex-1"><span className="block truncate font-medium">{item.code} · {item.title || "Sem título"}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{item.project ? `PRJ-${item.project.projectCode} · ${item.project.title}` : item.status ?? item.documentStatus ?? "Registro operacional"}</span></span><span className="text-xs text-primary">Abrir</span></button>)}</div></section> })}</div>}
      </div>
    </DialogContent>
  </Dialog>
}
