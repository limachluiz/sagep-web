import { useState } from "react"
import { FileStack, Loader2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { FederativeUnit } from "@/features/projects/projects.types"
import type { Ata, AtaPayload, AtaType, AtaUpdatePayload } from "@/features/atas/atas.types"
import { cnpjDigits, formatCnpj } from "@/lib/brazilian-documents"

type EditableLocality = { cityName: string; stateUf: FederativeUnit }
type EditableGroup = { code: string; name: string; description: string; localities: EditableLocality[] }
const emptyGroup = (): EditableGroup => ({ code: "", name: "", description: "", localities: [{ cityName: "", stateUf: "AM" }] })

type Props = { open: boolean; onOpenChange: (open: boolean) => void; ata?: Ata | null; pending: boolean; onSubmit: (payload: AtaPayload | AtaUpdatePayload) => Promise<void> }

export function AtaDialog({ open, onOpenChange, ata, pending, onSubmit }: Props) {
  const [number, setNumber] = useState(ata?.number ?? "")
  const [type, setType] = useState<AtaType>(ata?.type ?? "CFTV")
  const [vendorName, setVendorName] = useState(ata?.vendorName ?? "")
  const [vendorCnpj, setVendorCnpj] = useState(() => formatCnpj(ata?.vendorCnpj))
  const [managingAgency, setManagingAgency] = useState(ata?.managingAgency ?? "")
  const [validFrom, setValidFrom] = useState(ata?.validFrom?.slice(0, 10) ?? "")
  const [validUntil, setValidUntil] = useState(ata?.validUntil?.slice(0, 10) ?? "")
  const [notes, setNotes] = useState(ata?.notes ?? "")
  const [groups, setGroups] = useState<EditableGroup[]>([emptyGroup()])
  const [error, setError] = useState<string | null>(null)

  const updateGroup = (index: number, patch: Partial<EditableGroup>) => setGroups((current) => current.map((group, position) => position === index ? { ...group, ...patch } : group))
  const updateLocality = (groupIndex: number, localityIndex: number, patch: Partial<EditableLocality>) => setGroups((current) => current.map((group, position) => position === groupIndex ? { ...group, localities: group.localities.map((locality, localPosition) => localPosition === localityIndex ? { ...locality, ...patch } : locality) } : group))

  const submit = async () => {
    if (number.trim().length < 3 || vendorName.trim().length < 3) { setError("Informe o número e o fornecedor da ATA."); return }
    if (validFrom && validUntil && validUntil < validFrom) { setError("A vigência final não pode ser anterior à inicial."); return }
    const normalizedVendorCnpj = cnpjDigits(vendorCnpj)
    if (normalizedVendorCnpj && normalizedVendorCnpj.length !== 14) { setError("Informe um CNPJ válido com 14 dígitos."); return }
    const base = { number: number.trim(), type, vendorName: vendorName.trim(), ...(normalizedVendorCnpj && { vendorCnpj: normalizedVendorCnpj }), ...(managingAgency.trim() && { managingAgency: managingAgency.trim() }), ...(validFrom && { validFrom }), ...(validUntil && { validUntil }), ...(notes.trim() && { notes: notes.trim() }) }
    if (ata) { await onSubmit(base); return }
    if (groups.some((group) => group.code.trim().length < 2 || group.name.trim().length < 2 || group.localities.some((locality) => locality.cityName.trim().length < 2))) { setError("Preencha o código, nome e todas as localidades dos grupos de cobertura."); return }
    await onSubmit({ ...base, coverageGroups: groups.map((group) => ({ code: group.code.trim().toUpperCase(), name: group.name.trim(), ...(group.description.trim() && { description: group.description.trim() }), localities: group.localities.map((locality) => ({ cityName: locality.cityName.trim(), stateUf: locality.stateUf })) })) })
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><FileStack className="size-5 text-primary" />{ata ? "Editar ATA" : "Nova ATA"}</DialogTitle><DialogDescription>{ata ? "Atualize os dados gerais. Os grupos serão administrados separadamente para preservar os itens vinculados." : "Cadastre a ATA e sua estrutura inicial de cobertura territorial."}</DialogDescription></DialogHeader>
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Número da ATA</Label><Input value={number} onChange={(event) => setNumber(event.target.value)} autoFocus /></div><div className="space-y-2"><Label>Tipo</Label><Select value={type} onValueChange={(value) => setType(value as AtaType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CFTV">CFTV</SelectItem><SelectItem value="FIBRA_OPTICA">Fibra Óptica / Ponto Lógico</SelectItem></SelectContent></Select></div></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Fornecedor</Label><Input value={vendorName} onChange={(event) => setVendorName(event.target.value)} /></div><div className="space-y-2"><Label>CNPJ do fornecedor</Label><Input value={vendorCnpj} onChange={(event) => setVendorCnpj(formatCnpj(event.target.value))} placeholder="00.000.000/0000-00" inputMode="numeric" /></div></div>
      <div className="space-y-2"><Label>Órgão gerenciador</Label><Input value={managingAgency} onChange={(event) => setManagingAgency(event.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Início da vigência</Label><Input type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} /></div><div className="space-y-2"><Label>Fim da vigência</Label><Input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} /></div></div>
      <div className="space-y-2"><Label>Observações</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} /></div>

      {!ata && <div className="space-y-4 border-t pt-5"><div className="flex items-center justify-between"><div><p className="font-medium">Grupos de cobertura</p><p className="text-xs text-muted-foreground">Informe ao menos um grupo e uma localidade.</p></div><Button type="button" variant="outline" size="sm" onClick={() => setGroups((current) => [...current, emptyGroup()])}><Plus className="size-4" />Grupo</Button></div>
        {groups.map((group, groupIndex) => <div key={groupIndex} className="space-y-3 rounded-xl border p-4"><div className="flex justify-between gap-3"><p className="text-sm font-medium">Grupo {groupIndex + 1}</p>{groups.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label={`Remover grupo ${groupIndex + 1}`} onClick={() => setGroups((current) => current.filter((_, index) => index !== groupIndex))}><Trash2 className="size-4 text-destructive" /></Button>}</div><div className="grid gap-3 sm:grid-cols-[140px_1fr]"><Input placeholder="Código" value={group.code} onChange={(event) => updateGroup(groupIndex, { code: event.target.value })} /><Input placeholder="Nome do grupo" value={group.name} onChange={(event) => updateGroup(groupIndex, { name: event.target.value })} /></div><Input placeholder="Descrição opcional" value={group.description} onChange={(event) => updateGroup(groupIndex, { description: event.target.value })} />
          <div className="space-y-2">{group.localities.map((locality, localityIndex) => <div key={localityIndex} className="grid gap-2 sm:grid-cols-[1fr_150px_auto]"><Input placeholder="Cidade" value={locality.cityName} onChange={(event) => updateLocality(groupIndex, localityIndex, { cityName: event.target.value })} /><Select value={locality.stateUf} onValueChange={(value) => updateLocality(groupIndex, localityIndex, { stateUf: value as FederativeUnit })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="RO">RO</SelectItem><SelectItem value="RR">RR</SelectItem><SelectItem value="AC">AC</SelectItem></SelectContent></Select>{group.localities.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label={`Remover localidade ${localityIndex + 1} do grupo ${groupIndex + 1}`} onClick={() => updateGroup(groupIndex, { localities: group.localities.filter((_, index) => index !== localityIndex) })}><Trash2 className="size-4" /></Button>}</div>)}</div><Button type="button" variant="ghost" size="sm" onClick={() => updateGroup(groupIndex, { localities: [...group.localities, { cityName: "", stateUf: "AM" }] })}><Plus className="size-4" />Localidade</Button>
        </div>)}</div>}
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancelar</Button><Button onClick={submit} disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" />}{ata ? "Salvar alterações" : "Cadastrar ATA"}</Button></DialogFooter></DialogContent></Dialog>
}
