import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { CircleDollarSign, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { projectsService } from "@/features/projects/projects.service"

type ExistingNote = { number: string; receivedAt: string; amount: string; issuingManagementUnit: string | null; fundingSource: string | null; ptres: string | null; expenseNature: string | null; internalPlan: string | null; documentLink: string | null; notes: string | null }
type NoteRow = { number: string; receivedAt: string; amount: string; issuingManagementUnit: string; fundingSource: string; ptres: string; expenseNature: string; internalPlan: string; documentLink: string; notes: string }
type Props = { projectId: string; projectCode: number; requiredAmount: number; initialMode: "SINGLE" | "MULTIPLE"; initialNotes: ExistingNote[]; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }

function today() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10) }
function emptyNote(): NoteRow { return { number: "", receivedAt: today(), amount: "", issuingManagementUnit: "", fundingSource: "", ptres: "", expenseNature: "", internalPlan: "", documentLink: "", notes: "" } }
function parseMoney(value: string) {
  const normalized = value.trim().replace(/\s/g, "").includes(",")
    ? value.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
    : value.trim().replace(/\s/g, "")
  return Number(normalized) || 0
}
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

export function CreditNoteDialog({ projectId, projectCode, requiredAmount, initialMode, initialNotes, open, onOpenChange, onSaved }: Props) {
  const [mode, setMode] = useState<"SINGLE" | "MULTIPLE">(initialNotes.length > 1 ? "MULTIPLE" : initialMode)
  const [notes, setNotes] = useState<NoteRow[]>(() => initialNotes.length ? initialNotes.map((note) => ({ number: note.number, receivedAt: note.receivedAt.slice(0, 10), amount: note.amount, issuingManagementUnit: note.issuingManagementUnit ?? "", fundingSource: note.fundingSource ?? "", ptres: note.ptres ?? "", expenseNature: note.expenseNature ?? "", internalPlan: note.internalPlan ?? "", documentLink: note.documentLink ?? "", notes: note.notes ?? "" })) : [emptyNote()])
  const [overflowJustification, setOverflowJustification] = useState("")
  const received = notes.reduce((sum, note) => sum + parseMoney(note.amount), 0)
  const remaining = Math.max(requiredAmount - received, 0)
  const percentage = requiredAmount > 0 ? Math.min((received / requiredAmount) * 100, 100) : 0
  const overflow = received > requiredAmount ? received - requiredAmount : 0
  const validationError = useMemo(() => {
    if (notes.some((note) => note.number.trim().length < 3 || !note.receivedAt || !(parseMoney(note.amount) > 0))) return "Preencha número, data e valor de todas as Notas de Crédito."
    const numbers = notes.map((note) => note.number.trim().toUpperCase())
    if (new Set(numbers).size !== numbers.length) return "A mesma Nota de Crédito não pode ser informada duas vezes."
    if (overflow > 0 && overflowJustification.trim().length < 5) return "Justifique o crédito recebido acima do valor necessário."
    return null
  }, [notes, overflow, overflowJustification])
  const update = (index: number, field: keyof NoteRow, value: string) => setNotes((current) => current.map((note, noteIndex) => noteIndex === index ? { ...note, [field]: value } : note))

  const mutation = useMutation({
    mutationFn: () => projectsService.updateFlow(projectId, {
      stage: "DIEX_REQUISITORIO", creditNoteMode: mode,
      creditNotes: notes.map((note) => ({ number: note.number.trim(), receivedAt: note.receivedAt, amount: parseMoney(note.amount), issuingManagementUnit: note.issuingManagementUnit.trim() || undefined, fundingSource: note.fundingSource.trim() || undefined, ptres: note.ptres.trim() || undefined, expenseNature: note.expenseNature.trim() || undefined, internalPlan: note.internalPlan.trim() || undefined, documentLink: note.documentLink.trim() || undefined, notes: note.notes.trim() || undefined })),
      creditNoteOverflowJustification: overflowJustification.trim() || undefined,
    }),
    onSuccess: (project) => { toast.success(project.stage === "DIEX_REQUISITORIO" ? `Crédito integral do PRJ-${projectCode} registrado. O DIEx foi liberado.` : `Crédito parcial registrado. Ainda faltam ${money(remaining)}.`); onSaved(); onOpenChange(false) },
    onError: (error) => toast.error(error.message),
  })

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><CircleDollarSign className="size-5 text-primary" />Recebimento do crédito</DialogTitle><DialogDescription>Registre uma ou mais Notas de Crédito destinadas ao projeto PRJ-{projectCode}. O DIEx será liberado quando o valor necessário estiver integralmente coberto.</DialogDescription></DialogHeader><div className="space-y-5">
    <div className="space-y-2"><Label>Forma de recebimento do crédito</Label><Select value={mode} onValueChange={(value: "SINGLE" | "MULTIPLE") => { setMode(value); if (value === "SINGLE") setNotes((current) => [current[0] ?? emptyNote()]) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SINGLE">Nota de Crédito única</SelectItem><SelectItem value="MULTIPLE">Múltiplas Notas de Crédito</SelectItem></SelectContent></Select></div>
    <div className="grid gap-3 rounded-xl border bg-muted/20 p-4 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Valor necessário</p><p className="font-semibold">{money(requiredAmount)}</p></div><div><p className="text-xs text-muted-foreground">Crédito recebido</p><p className="font-semibold text-primary">{money(received)}</p></div><div><p className="text-xs text-muted-foreground">{overflow > 0 ? "Crédito excedente" : "Saldo a receber"}</p><p className={overflow > 0 ? "font-semibold text-amber-600" : "font-semibold"}>{money(overflow || remaining)}</p></div><div className="sm:col-span-3"><div className="mb-1 flex justify-between text-xs"><span>Cobertura financeira</span><span>{percentage.toFixed(0)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} /></div></div></div>
    <div className="space-y-4">{notes.map((note, index) => <div key={index} className="rounded-xl border p-4"><div className="mb-3 flex items-center justify-between"><p className="font-medium">Nota de Crédito {index + 1}</p>{mode === "MULTIPLE" && notes.length > 1 && <Button type="button" variant="ghost" size="icon" title="Remover Nota de Crédito" onClick={() => setNotes((current) => current.filter((_, noteIndex) => noteIndex !== index))}><Trash2 className="size-4 text-destructive" /></Button>}</div><div className="grid gap-3 sm:grid-cols-3"><div className="space-y-2"><Label>Número</Label><Input value={note.number} onChange={(e) => update(index, "number", e.target.value)} placeholder="2026NC000123" autoFocus={index === 0} /></div><div className="space-y-2"><Label>Recebimento</Label><Input type="date" value={note.receivedAt} onChange={(e) => update(index, "receivedAt", e.target.value)} /></div><div className="space-y-2"><Label>Valor</Label><Input inputMode="decimal" value={note.amount} onChange={(e) => update(index, "amount", e.target.value)} placeholder="0,00" /></div></div><details className="mt-3"><summary className="cursor-pointer text-sm font-medium text-primary">Dados orçamentários e documento</summary><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>UG emitente</Label><Input value={note.issuingManagementUnit} onChange={(e) => update(index, "issuingManagementUnit", e.target.value)} /></div><div className="space-y-2"><Label>Fonte de recurso</Label><Input value={note.fundingSource} onChange={(e) => update(index, "fundingSource", e.target.value)} /></div><div className="space-y-2"><Label>PTRes</Label><Input value={note.ptres} onChange={(e) => update(index, "ptres", e.target.value)} /></div><div className="space-y-2"><Label>Natureza da despesa</Label><Input value={note.expenseNature} onChange={(e) => update(index, "expenseNature", e.target.value)} /></div><div className="space-y-2"><Label>Plano interno</Label><Input value={note.internalPlan} onChange={(e) => update(index, "internalPlan", e.target.value)} /></div><div className="space-y-2"><Label>Link comprobatório</Label><Input value={note.documentLink} onChange={(e) => update(index, "documentLink", e.target.value)} placeholder="https://..." /></div><div className="space-y-2 sm:col-span-2"><Label>Observações</Label><Textarea value={note.notes} onChange={(e) => update(index, "notes", e.target.value)} rows={2} /></div></div></details></div>)}</div>
    {mode === "MULTIPLE" && <Button type="button" variant="outline" onClick={() => setNotes((current) => [...current, emptyNote()])}><Plus className="size-4" />Adicionar outra NC</Button>}
    {overflow > 0 && <div className="space-y-2"><Label>Justificativa do crédito excedente</Label><Textarea value={overflowJustification} onChange={(e) => setOverflowJustification(e.target.value)} rows={3} placeholder="Explique por que o valor recebido supera o total estimado do projeto." /></div>}
    {received > 0 && remaining > 0 && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">O crédito será registrado como parcial. O projeto continuará aguardando crédito e o DIEx permanecerá bloqueado.</p>}{validationError && <p className="text-sm font-medium text-destructive">{validationError}</p>}
  </div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button><Button onClick={() => mutation.mutate()} disabled={Boolean(validationError) || mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}{remaining > 0 ? "Registrar crédito parcial" : "Registrar e liberar DIEx"}</Button></DialogFooter></DialogContent></Dialog>
}
