import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { FileCheck2, FileUp, Loader2, ShieldCheck, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { financialExecutionService, type NfeXmlPreview } from "../financial-execution.service"
import type { CommitmentNote } from "../financial-execution.types"

type Props = { note: CommitmentNote | null; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }
type Mode = "XML" | "MANUAL"
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

export function CreateInvoiceDialog({ note, open, onOpenChange, onSaved }: Props) {
  const [mode, setMode] = useState<Mode>("XML")
  const [number, setNumber] = useState("")
  const [accessKey, setAccessKey] = useState("")
  const [supplierCnpj, setSupplierCnpj] = useState(note?.supplierCnpj ?? "")
  const [issuedAt, setIssuedAt] = useState("")
  const [grossAmount, setGrossAmount] = useState(String(note ? Math.max(0, note.currentAmount - note.paidAmount) || note.currentAmount : ""))
  const [attestedAt, setAttestedAt] = useState("")
  const [documentLink, setDocumentLink] = useState("")
  const [notes, setNotes] = useState("")
  const [xmlBase64, setXmlBase64] = useState("")
  const [preview, setPreview] = useState<NfeXmlPreview | null>(null)

  const finish = () => { onSaved(); onOpenChange(false) }
  const manualMutation = useMutation({
    mutationFn: () => financialExecutionService.createInvoice({ projectId: note!.project.id, commitmentNoteId: note!.id, number: number.trim(), ...(accessKey.trim() && { accessKey: accessKey.replace(/\D/g, "") }), supplierCnpj, issuedAt, grossAmount: Number(grossAmount), ...(attestedAt && { attestedAt, attestedAmount: Number(grossAmount) }), ...(documentLink.trim() && { documentLink: documentLink.trim() }), ...(notes.trim() && { notes: notes.trim() }) }),
    onSuccess: (result) => { toast.success(result.warnings.length ? `NF-e registrada com ${result.warnings.length} alerta(s).` : "NF-e registrada."); finish() },
    onError: (error) => toast.error(error.message),
  })
  const previewMutation = useMutation({
    mutationFn: (base64: string) => financialExecutionService.previewInvoiceXml({ projectId: note!.project.id, commitmentNoteId: note!.id, xmlBase64: base64 }),
    onSuccess: setPreview,
    onError: (error) => { setPreview(null); toast.error(error.message) },
  })
  const importMutation = useMutation({
    mutationFn: () => financialExecutionService.importInvoiceXml({ projectId: note!.project.id, commitmentNoteId: note!.id, xmlBase64, ...(attestedAt && { attestedAt }), ...(documentLink.trim() && { documentLink: documentLink.trim() }), ...(notes.trim() && { notes: notes.trim() }) }),
    onSuccess: (result) => { toast.success(result.conferenceStatus === "CONFERRED" ? "NF-e importada e conferida pelo XML oficial." : "NF-e importada com divergências para conferência."); finish() },
    onError: (error) => toast.error(error.message),
  })
  const loadXml = (file?: File) => {
    setPreview(null); setXmlBase64("")
    if (!file) return
    if (file.size > 8 * 1024 * 1024) { toast.error("O XML deve possuir no máximo 8 MB."); return }
    const reader = new FileReader()
    reader.onload = () => { const base64 = String(reader.result).split(",")[1] ?? ""; setXmlBase64(base64); previewMutation.mutate(base64) }
    reader.onerror = () => toast.error("Não foi possível ler o arquivo XML.")
    reader.readAsDataURL(file)
  }
  const manualValid = Boolean(note && number.trim() && supplierCnpj.replace(/\D/g, "").length === 14 && issuedAt && Number(grossAmount) > 0 && (!accessKey || accessKey.replace(/\D/g, "").length === 44))
  const pending = manualMutation.isPending || previewMutation.isPending || importMutation.isPending

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:!max-w-2xl">
      <DialogHeader><DialogTitle className="flex items-center gap-2"><FileCheck2 className="size-5 text-primary" />Registrar Nota Fiscal</DialogTitle><DialogDescription>Vincule a NF-e à NE {note?.number}. Prefira o XML autorizado para conferência automática; o cadastro manual permanece disponível.</DialogDescription></DialogHeader>
      <div className="flex gap-2 rounded-lg border bg-muted/30 p-1"><Button className="flex-1" variant={mode === "XML" ? "default" : "ghost"} onClick={() => setMode("XML")}><FileUp />Importar XML</Button><Button className="flex-1" variant={mode === "MANUAL" ? "default" : "ghost"} onClick={() => setMode("MANUAL")}>Cadastro manual</Button></div>
      {mode === "XML" ? <div className="space-y-4">
        <div className="space-y-2"><Label>XML autorizado da NF-e</Label><Input type="file" accept=".xml,text/xml,application/xml" onChange={(event) => loadXml(event.target.files?.[0])} disabled={pending} /><p className="text-xs text-muted-foreground">O XML completo não é armazenado. O SAGEP preserva seu hash SHA-256 e o resumo necessário à conferência.</p></div>
        {previewMutation.isPending && <div className="flex items-center gap-2 rounded-lg border p-4 text-sm"><Loader2 className="size-4 animate-spin" />Conferindo estrutura, assinatura, autorização, fornecedor e valores…</div>}
        {preview && <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">NF-e {preview.summary.number}{preview.summary.series ? ` · Série ${preview.summary.series}` : ""}</p><p className="text-sm text-muted-foreground">{preview.summary.issuerName ?? preview.summary.supplierCnpj}</p></div><Badge variant={preview.conferenceStatus === "CONFERRED" ? "default" : "destructive"}>{preview.conferenceStatus === "CONFERRED" ? "Conferida" : "Divergente"}</Badge></div>
          <div className="grid gap-2 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Emissão:</span> {new Intl.DateTimeFormat("pt-BR").format(new Date(preview.summary.issuedAt))}</p><p><span className="text-muted-foreground">Valor:</span> {money(preview.summary.grossAmount)}</p><p><span className="text-muted-foreground">Itens:</span> {preview.summary.itemCount}</p><p><span className="text-muted-foreground">Protocolo:</span> {preview.summary.authorizationProtocol ?? "Não confirmado"}</p></div>
          {preview.duplicate && <Alert variant="destructive"><TriangleAlert /><AlertTitle>NF-e já registrada</AlertTitle><AlertDescription>O registro #{preview.duplicate.invoiceCode} já utiliza esta chave ou combinação de número, série e fornecedor.</AlertDescription></Alert>}
          {!!preview.divergences.length && <Alert variant="destructive"><TriangleAlert /><AlertTitle>Divergências encontradas</AlertTitle><AlertDescription>{preview.divergences.join(" · ")}</AlertDescription></Alert>}
          {!preview.divergences.length && <Alert><ShieldCheck /><AlertTitle>Conferência concluída</AlertTitle><AlertDescription>Chave, autorização, assinatura XML, fornecedor e limite financeiro foram verificados.</AlertDescription></Alert>}
        </div>}
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Data do atesto (opcional)</Label><Input type="date" value={attestedAt} onChange={(event) => setAttestedAt(event.target.value)} /></div><div className="space-y-2"><Label>Link do documento (opcional)</Label><Input value={documentLink} onChange={(event) => setDocumentLink(event.target.value)} placeholder="https://..." /></div></div>
      </div> : <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Número da NF-e</Label><Input value={number} onChange={(event) => setNumber(event.target.value)} /></div><div className="space-y-2"><Label>Data de emissão</Label><Input type="date" value={issuedAt} onChange={(event) => setIssuedAt(event.target.value)} /></div><div className="space-y-2"><Label>CNPJ do fornecedor</Label><Input value={supplierCnpj} onChange={(event) => setSupplierCnpj(event.target.value)} /></div><div className="space-y-2"><Label>Valor bruto</Label><Input inputMode="decimal" value={grossAmount} onChange={(event) => setGrossAmount(event.target.value.replace(",", "."))} /></div><div className="space-y-2 sm:col-span-2"><Label>Chave de acesso (opcional)</Label><Input value={accessKey} onChange={(event) => setAccessKey(event.target.value)} maxLength={44} placeholder="44 dígitos" /></div><div className="space-y-2"><Label>Data do atesto (opcional)</Label><Input type="date" value={attestedAt} onChange={(event) => setAttestedAt(event.target.value)} /></div><div className="space-y-2"><Label>Link do documento (opcional)</Label><Input value={documentLink} onChange={(event) => setDocumentLink(event.target.value)} placeholder="https://..." /></div>
      </div>}
      <div className="space-y-2"><Label>Observações</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} /></div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancelar</Button>{mode === "XML" ? <Button disabled={!preview || Boolean(preview.duplicate) || importMutation.isPending} onClick={() => importMutation.mutate()}>{importMutation.isPending && <Loader2 className="size-4 animate-spin" />}Importar NF-e</Button> : <Button disabled={!manualValid || manualMutation.isPending} onClick={() => manualMutation.mutate()}>{manualMutation.isPending && <Loader2 className="size-4 animate-spin" />}Registrar manualmente</Button>}</DialogFooter>
    </DialogContent>
  </Dialog>
}
