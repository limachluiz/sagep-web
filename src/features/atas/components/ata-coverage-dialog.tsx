import { useMemo, useState } from "react"
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Ata, AtaCoverageLocality } from "@/features/atas/atas.types"
import { MUNICIPALITIES_BY_UF } from "@/features/atas/municipalities"
import type { FederativeUnit } from "@/features/projects/projects.types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ata: Ata
  pending: boolean
  onSubmit: (payload: { regionNumber: number; localities: Array<{ cityName: string; stateUf: FederativeUnit }> }) => Promise<void>
}

export function AtaCoverageDialog({ open, onOpenChange, ata, pending, onSubmit }: Props) {
  const initialRegion = ata.coverageGroups.map((group) => group.code.match(/^REG-?(\d+)$/i)?.[1] ?? group.name.match(/Região\s*(\d+)/i)?.[1]).find(Boolean) ?? "1"
  const initialLocalities = useMemo(() => {
    const seen = new Set<string>()
    return ata.coverageGroups.flatMap((group) => group.localities).filter((locality) => {
      const key = `${locality.cityName.toLocaleLowerCase("pt-BR")}:${locality.stateUf}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [ata.coverageGroups])
  const [region, setRegion] = useState(initialRegion)
  const [uf, setUf] = useState<FederativeUnit>(initialLocalities[0]?.stateUf ?? "AM")
  const [municipality, setMunicipality] = useState("")
  const [localities, setLocalities] = useState<Array<Pick<AtaCoverageLocality, "cityName" | "stateUf">>>(initialLocalities)
  const add = () => {
    if (!municipality || localities.some((item) => item.cityName === municipality && item.stateUf === uf)) return
    setLocalities((current) => [...current, { cityName: municipality, stateUf: uf }])
    setMunicipality("")
  }
  const submit = async () => {
    if (!localities.length) return
    await onSubmit({ regionNumber: Number(region), localities })
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-2xl">
    <DialogHeader><DialogTitle className="flex items-center gap-2"><MapPin className="size-5 text-primary" />Editar cobertura territorial</DialogTitle><DialogDescription>A ATA terá um único grupo regional. Grupos duplicados serão consolidados sem alterar os saldos.</DialogDescription></DialogHeader>
    <div className="space-y-5">
      <div className="space-y-2"><Label>Região da ATA</Label><Select value={region} onValueChange={setRegion}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 10 }, (_, index) => String(index + 1)).map((value) => <SelectItem key={value} value={value}>REG-{value.padStart(2, "0")} · Região {value}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid gap-3 sm:grid-cols-[110px_1fr_auto]"><div className="space-y-2"><Label>UF</Label><Select value={uf} onValueChange={(value) => { setUf(value as FederativeUnit); setMunicipality("") }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["AM","RO","RR","AC"] as FederativeUnit[]).map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Município</Label><Select value={municipality} onValueChange={setMunicipality}><SelectTrigger><SelectValue placeholder="Selecione o município" /></SelectTrigger><SelectContent>{MUNICIPALITIES_BY_UF[uf].map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent></Select></div><Button type="button" className="self-end" variant="outline" onClick={add} disabled={!municipality}><Plus className="size-4" />Adicionar</Button></div>
      <div className="rounded-xl border p-4"><p className="text-sm font-medium">Localidades atendidas</p><div className="mt-3 space-y-2">{localities.map((locality) => <div key={`${locality.cityName}-${locality.stateUf}`} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"><span>{locality.cityName}/{locality.stateUf}</span><Button type="button" variant="ghost" size="icon" onClick={() => setLocalities((current) => current.filter((item) => item.cityName !== locality.cityName || item.stateUf !== locality.stateUf))}><Trash2 className="size-4 text-destructive" /></Button></div>)}{!localities.length && <p className="text-sm text-muted-foreground">Adicione pelo menos uma localidade.</p>}</div></div>
    </div>
    <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancelar</Button><Button onClick={submit} disabled={pending || !localities.length}>{pending && <Loader2 className="size-4 animate-spin" />}Salvar cobertura</Button></DialogFooter>
  </DialogContent></Dialog>
}
