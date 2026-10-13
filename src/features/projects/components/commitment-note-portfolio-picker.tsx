import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { financialStatusLabel, formatNeDate, formatNeMoney } from "@/features/financial-execution/portfolio-presentation"

type PortfolioEntry = {
  externalCode: string
  origin: "IMPORTED" | "STANDALONE"
  observation: string | null
  attendedOm: { sigla: string; name: string } | null
  financial: {
    current: number | null
    liquidated: number | null
    paid: number | null
    issuedAt: string | null
    status: string
    inconsistent?: boolean
  }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (entry: PortfolioEntry) => void
}

export function CommitmentNotePortfolioPicker({ open, onOpenChange, onSelect }: Props) {
  const [search, setSearch] = useState("")
  const query = useQuery({
    queryKey: ["commitment-note-project-picker", search],
    enabled: open,
    queryFn: () => api.get<{ items: PortfolioEntry[]; total: number }>(`/financial-execution/discovery/archive?page=1&pageSize=20&search=${encodeURIComponent(search)}`),
  })

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:!max-w-4xl">
      <DialogHeader>
        <DialogTitle>Selecionar NE da Carteira de Empenhos</DialogTitle>
        <DialogDescription>A NE será vinculada ao projeto sem excluir sua cópia da Carteira. A movimentação do saldo será confirmada na etapa seguinte.</DialogDescription>
      </DialogHeader>
      <div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por NE, OM ou observação" autoFocus /></div>
      {query.isLoading && <p className="text-sm text-muted-foreground">Carregando NEs importadas…</p>}
      {query.isError && <p role="alert" className="text-sm text-destructive">Não foi possível carregar a Carteira: {query.error.message}</p>}
      {query.data && <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{query.data.total} NE(s) encontrada(s). Exibindo até 20 resultados.</p>
        {!query.data.items.length && <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">Nenhuma NE encontrada.</p>}
        {query.data.items.map((entry) => {
          const status = entry.financial.inconsistent ? "DIVERGENTE" : entry.financial.status
          return <button key={entry.externalCode} type="button" className="w-full rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5" onClick={() => { onSelect(entry); onOpenChange(false) }}>
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{entry.externalCode.slice(11)} · UG {entry.externalCode.slice(0, 6)}</p><p className="text-xs text-muted-foreground">{entry.origin === "IMPORTED" ? "Importada" : "Avulsa"} · Emissão: {formatNeDate(entry.financial.issuedAt)} · OM: {entry.attendedOm?.sigla ?? entry.attendedOm?.name ?? "não informada"}</p></div><span className="rounded-full border px-2 py-1 text-xs font-semibold">{financialStatusLabel(status)}</span></div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><span>Empenhado: <strong>{formatNeMoney(entry.financial.current)}</strong></span><span>Liquidado: <strong>{formatNeMoney(entry.financial.liquidated)}</strong></span><span>Pago: <strong>{formatNeMoney(entry.financial.paid)}</strong></span></div>
            {entry.observation && <p className="mt-2 text-xs text-muted-foreground">{entry.observation}</p>}
          </button>
        })}
      </div>}
      <div className="flex justify-end"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button></div>
    </DialogContent>
  </Dialog>
}
