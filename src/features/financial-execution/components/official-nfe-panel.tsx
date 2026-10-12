import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Search, ShieldCheck, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { financialExecutionService, type OfficialNfePreview } from "../financial-execution.service"
import type { CommitmentNote } from "../financial-execution.types"

type Props = { note: CommitmentNote; notes: string; documentLink: string; onSaved: () => void }
const fiscalLabels: Record<string, string> = { AUTHORIZED_AT_ISSUE: "Autorizada na emissão", AUTHORIZED_IN_SUMMARY: "Autorizada no resumo retornado", CANCELLED: "Cancelada", DENIED: "Denegada", UNKNOWN: "Situação não confirmada" }

export function OfficialNfePanel({ note, notes, documentLink, onSaved }: Props) {
  const [key, setKey] = useState("")
  const [preview, setPreview] = useState<OfficialNfePreview | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const configuration = useQuery({ queryKey: ["official-nfe-configuration"], queryFn: financialExecutionService.officialNfeConfiguration })
  const query = useMutation({ mutationFn: () => financialExecutionService.previewOfficialNfe({ projectId: note.project.id, commitmentNoteId: note.id, accessKey: key }), onSuccess: (value) => { setPreview(value); setConfirmed(false) }, onError: (error) => { setPreview(null); toast.error(error.message) } })
  const save = useMutation({ mutationFn: () => financialExecutionService.importOfficialNfe({ consultationId: preview!.consultationId, confirmed: true, ...(notes.trim() && { notes: notes.trim() }), ...(documentLink.trim() && { documentLink: documentLink.trim() }) }), onSuccess: () => { toast.success("NF-e registrada com origem SEFAZ. O atesto continua pendente."); onSaved() }, onError: (error) => toast.error(error.message) })
  return <div className="space-y-4">
    <Alert><ShieldCheck /><AlertTitle>Consulta oficial à SEFAZ</AlertTitle><AlertDescription>{configuration.isError ? "Não foi possível verificar a configuração. Tente novamente ou importe o XML." : configuration.data?.message ?? "Verificando configuração…"}</AlertDescription></Alert>
    <div className="space-y-2"><Label htmlFor="official-nfe-key">Chave de acesso da NF-e</Label><div className="flex gap-2"><Input id="official-nfe-key" value={key} onChange={(event) => { setKey(event.target.value.replace(/\D/g, "").slice(0, 44)); setPreview(null); setConfirmed(false) }} inputMode="numeric" placeholder="44 dígitos do DANFE" maxLength={44} disabled={query.isPending || save.isPending} /><Button disabled={!configuration.data?.configured || key.length !== 44 || query.isPending || save.isPending} onClick={() => query.mutate()}>{query.isPending ? <Loader2 className="animate-spin" /> : <Search />}Consultar</Button></div></div>
    {preview && <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap gap-2"><Badge>Fonte: SEFAZ</Badge><Badge variant="outline">{preview.documentKind === "FULL_XML" ? "XML completo" : "Resumo fiscal"}</Badge><Badge variant={preview.conferenceStatus === "DIVERGENT" ? "destructive" : "secondary"}>{fiscalLabels[preview.fiscalStatus] ?? preview.fiscalStatus}</Badge></div>
      <p className="text-xs text-muted-foreground">Consultada em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(preview.queriedAt))}{preview.cached ? " · prévia em cache" : ""} · {preview.environment === "PRODUCTION" ? "Produção" : "Homologação: importação desativada"}</p>
      {preview.summary && <div className="grid gap-2 text-sm sm:grid-cols-2"><p>NF-e {preview.summary.number} · Série {preview.summary.series ?? "—"}</p><p>{preview.summary.issuerName ?? preview.summary.supplierCnpj}</p><p>CNPJ: {preview.summary.supplierCnpj}</p><p>Valor: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(preview.summary.grossAmount)}</p><p>Emissão: {new Intl.DateTimeFormat("pt-BR").format(new Date(preview.summary.issuedAt))}</p></div>}
      {preview.duplicate && <Alert variant="destructive"><TriangleAlert /><AlertTitle>NF-e já registrada</AlertTitle><AlertDescription>Registro #{preview.duplicate.invoiceCode}.</AlertDescription></Alert>}
      {preview.divergences.map((text) => <Alert variant="destructive" key={text}><TriangleAlert /><AlertDescription>{text}</AlertDescription></Alert>)}
      {preview.warnings.map((text) => <p className="text-xs text-muted-foreground" key={text}>{text}</p>)}
      {preview.importAllowed && <Label className="flex items-start gap-2"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={save.isPending} />Revisei o fornecedor, valor e divergências. Confirmo o registro da nota; esta ação não realiza atesto.</Label>}
      <Button disabled={!preview.importAllowed || !confirmed || save.isPending || query.isPending} onClick={() => save.mutate()}>{save.isPending && <Loader2 className="animate-spin" />}Confirmar importação da NF-e</Button>
    </div>}
  </div>
}
