import { useState } from "react"
import { Loader2, Scale } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { AtaType, Pregao, PregaoPayload } from "@/features/atas/atas.types"

type Props = {
  open: boolean
  pregao?: Pregao | null
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: PregaoPayload) => Promise<void>
}

const dateValue = (value?: string | null) => value ? value.slice(0, 10) : ""

export function PregaoDialog({ open, pregao, pending, onOpenChange, onSubmit }: Props) {
  const [uasg, setUasg] = useState(pregao?.uasg ?? "160016")
  const [number, setNumber] = useState(pregao?.number ?? "")
  const [year, setYear] = useState(pregao?.year ?? String(new Date().getFullYear()))
  const [modality, setModality] = useState(pregao?.modality ?? "PREGÃO ELETRÔNICO")
  const [type, setType] = useState<AtaType | "UNCLASSIFIED">(pregao?.type ?? "UNCLASSIFIED")
  const [managingAgency, setManagingAgency] = useState(pregao?.managingAgency ?? "")
  const [object, setObject] = useState(pregao?.object ?? "")
  const [openingAt, setOpeningAt] = useState(dateValue(pregao?.openingAt))
  const [homologatedAt, setHomologatedAt] = useState(dateValue(pregao?.homologatedAt))
  const [isActive, setIsActive] = useState(pregao?.isActive ?? true)
  const valid = uasg.trim().length >= 3 && number.trim() && /^\d{4}$/.test(year) && modality.trim().length >= 2

  const submit = async () => onSubmit({
    uasg: uasg.trim(), number: number.trim(), year, modality: modality.trim(),
    type: type === "UNCLASSIFIED" ? null : type,
    object: object.trim() || null, managingAgency: managingAgency.trim() || null,
    openingAt: openingAt || null, homologatedAt: homologatedAt || null, isActive,
  })

  return <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
    <DialogHeader><DialogTitle className="flex items-center gap-2"><Scale className="size-5 text-primary" />{pregao ? "Editar pregão" : "Cadastrar pregão"}</DialogTitle><DialogDescription>Registre a identificação, classificação, datas e objeto resumido do processo licitatório.</DialogDescription></DialogHeader>
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label>UASG</Label><Input value={uasg} onChange={(e) => setUasg(e.target.value)} autoFocus /></div><div className="space-y-2"><Label>Número</Label><Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Ex.: 90004" /></div><div className="space-y-2"><Label>Ano</Label><Input value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} /></div></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Modalidade</Label><Input value={modality} onChange={(e) => setModality(e.target.value)} /></div><div className="space-y-2"><Label>Categoria</Label><Select value={type} onValueChange={(value) => setType(value as AtaType | "UNCLASSIFIED")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="UNCLASSIFIED">Não classificado</SelectItem><SelectItem value="CFTV">CFTV</SelectItem><SelectItem value="FIBRA_OPTICA">Fibra óptica</SelectItem></SelectContent></Select></div></div>
      <div className="space-y-2"><Label>Órgão gerenciador</Label><Input value={managingAgency} onChange={(e) => setManagingAgency(e.target.value)} placeholder="Nome da organização responsável" /></div>
      <div className="space-y-2"><Label>Objeto resumido</Label><Textarea value={object} onChange={(e) => setObject(e.target.value)} rows={4} placeholder="Descreva objetivamente o objeto da contratação" /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Data de abertura</Label><Input type="date" value={openingAt} onChange={(e) => setOpeningAt(e.target.value)} /></div><div className="space-y-2"><Label>Data de homologação</Label><Input type="date" value={homologatedAt} onChange={(e) => setHomologatedAt(e.target.value)} /></div></div>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /><span><strong className="block">Pregão ativo</strong><span className="text-muted-foreground">Disponível para seleção em novos projetos e estimativas.</span></span></label>
    </div>
    <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancelar</Button><Button onClick={submit} disabled={!valid || pending}>{pending && <Loader2 className="size-4 animate-spin" />}{pregao ? "Salvar alterações" : "Cadastrar pregão"}</Button></DialogFooter>
  </DialogContent></Dialog>
}
