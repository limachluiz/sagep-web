import { useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { AlertTriangle, ArrowLeft, CheckCircle2, CloudDownload, Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { atasService } from "@/features/atas/atas.service"
import type { AtaType, ComprasGovCoverage, ComprasGovImportPayload, ComprasGovImportResult, ComprasGovPreview } from "@/features/atas/atas.types"
import type { FederativeUnit } from "@/features/projects/projects.types"

type Props = { open: boolean; onOpenChange: (open: boolean) => void; onImported: (result: ComprasGovImportResult) => void }
const currentYear = String(new Date().getFullYear())
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const importStatusLabel = {
  NOT_IMPORTED: "Não importada",
  IMPORTED: "Importada",
  UPDATE_AVAILABLE: "Atualização disponível",
  INACTIVE: "Inativa ou encerrada",
} as const

function CoverageBadges({ coverages }: { coverages: ComprasGovCoverage[] }) {
  if (!coverages.length) return <Badge variant="destructive">Cobertura não identificada</Badge>
  return <div className="flex flex-wrap gap-1.5">{coverages.map((coverage) => <Badge key={coverage.code} variant="secondary">{coverage.name} · {coverage.localities.map((locality) => `${locality.cityName}/${locality.stateUf}`).join(", ")}</Badge>)}</div>
}

export function ComprasGovImportDialog({ open, onOpenChange, onImported }: Props) {
  const [uasg, setUasg] = useState("")
  const [numeroPregao, setNumeroPregao] = useState("")
  const [anoPregao, setAnoPregao] = useState(currentYear)
  const [numeroAta, setNumeroAta] = useState("")
  const [selectedAtaNumbers, setSelectedAtaNumbers] = useState<string[]>([])
  const [preview, setPreview] = useState<ComprasGovPreview | null>(null)
  const [ataType, setAtaType] = useState<AtaType>("CFTV")
  const [autoDetectCoverage, setAutoDetectCoverage] = useState(true)
  const [groupCode, setGroupCode] = useState("")
  const [groupName, setGroupName] = useState("")
  const [cityName, setCityName] = useState("")
  const [stateUf, setStateUf] = useState<FederativeUnit>("AM")
  const canSearch = Boolean(uasg.trim() && numeroPregao.trim() && /^\d{4}$/.test(anoPregao))
  const selectedAtas = preview?.atasFound.filter((ata) => selectedAtaNumbers.includes(ata.ataNumber)) ?? []
  const automaticCoverageValid = preview?.ata
    ? preview.items.every((item) => item.coverage)
    : selectedAtas.every((ata) => ata.coverageDetected)
  const manualCoverageValid = groupCode.trim().length >= 2 && groupName.trim().length >= 2 && cityName.trim().length >= 2
  const validConfiguration = autoDetectCoverage ? automaticCoverageValid : manualCoverageValid

  const payloadFor = (selectedAta: string): ComprasGovImportPayload => ({
    uasg: uasg.trim(), numeroPregao: numeroPregao.trim(), anoPregao,
    numeroAta: selectedAta, ataType, autoDetectCoverage,
    ...(!autoDetectCoverage && {
      coverageGroupCode: groupCode.trim().toUpperCase(),
      coverageGroupName: groupName.trim(),
      coverageGroupLocalities: [{ cityName: cityName.trim(), stateUf }],
    }),
  })

  const previewMutation = useMutation({
    mutationFn: (selectedAta?: string) => atasService.previewComprasGov({ uasg: uasg.trim(), numeroPregao: numeroPregao.trim(), anoPregao, ...(selectedAta && { numeroAta: selectedAta }) }),
    onSuccess: (data) => { setPreview(data); if (data.ata) setNumeroAta(data.selectedAta?.ataNumber ?? numeroAta) },
    onError: (error) => toast.error(error.message),
  })
  const importMutation = useMutation({
    mutationFn: () => atasService.importComprasGov(payloadFor(numeroAta)),
    onSuccess: (result) => { toast.success(`${result.ata.number} importada: ${result.itemsCreated} item(ns) criado(s) e ${result.itemsUpdated} atualizado(s).`); onImported(result); onOpenChange(false) },
    onError: (error) => toast.error(error.message),
  })
  const bulkImportMutation = useMutation({
    mutationFn: async (ataNumbers?: string[]) => {
      const results: ComprasGovImportResult[] = []
      for (const selectedAta of ataNumbers ?? selectedAtaNumbers) results.push(await atasService.importComprasGov(payloadFor(selectedAta)))
      return results
    },
    onSuccess: (results) => {
      const created = results.reduce((sum, result) => sum + result.itemsCreated, 0)
      const updated = results.reduce((sum, result) => sum + result.itemsUpdated, 0)
      toast.success(`${results.length} ATA(s) processada(s): ${created} item(ns) criado(s) e ${updated} atualizado(s).`)
      results.forEach(onImported)
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })
  const busy = previewMutation.isPending || importMutation.isPending || bulkImportMutation.isPending
  const totalAmount = useMemo(() => preview?.items.reduce((sum, item) => sum + item.unitPrice * item.initialQuantity, 0) ?? 0, [preview])
  const resetPreview = () => { setPreview(null); setNumeroAta(""); setSelectedAtaNumbers([]) }
  const toggleAta = (ataNumber: string) => setSelectedAtaNumbers((current) => current.includes(ataNumber) ? current.filter((value) => value !== ataNumber) : [...current, ataNumber])
  const allSelected = Boolean(preview?.atasFound.length && selectedAtaNumbers.length === preview.atasFound.length)
  const importedAtaNumbers = preview?.atasFound.filter((ata) => ata.importedAtaId && ata.importStatus !== "INACTIVE").map((ata) => ata.ataNumber) ?? []

  const configuration = <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><Label>Tipo das ATAs</Label><Select value={ataType} onValueChange={(value) => setAtaType(value as AtaType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CFTV">CFTV</SelectItem><SelectItem value="FIBRA_OPTICA">Fibra óptica</SelectItem></SelectContent></Select></div>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 text-sm"><input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={autoDetectCoverage} onChange={(event) => setAutoDetectCoverage(event.target.checked)} /><span><strong className="block">Detectar região e localidade automaticamente</strong><span className="text-muted-foreground">Cada item será vinculado à região indicada em sua própria descrição.</span></span></label>
    </div>
    {!autoDetectCoverage && <div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label>Código do grupo</Label><Input value={groupCode} onChange={(event) => setGroupCode(event.target.value)} placeholder="Ex.: MNS" /></div><div className="space-y-2"><Label>Nome do grupo</Label><Input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Ex.: Grupo Manaus" /></div><div className="space-y-2"><Label>Localidade</Label><div className="flex gap-2"><Input value={cityName} onChange={(event) => setCityName(event.target.value)} placeholder="Cidade" /><Select value={stateUf} onValueChange={(value) => setStateUf(value as FederativeUnit)}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent>{["AM", "RO", "RR", "AC"].map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select></div></div></div>}
    {autoDetectCoverage && !validConfiguration && <p className="text-sm text-destructive">Há itens sem região identificável. Confira os itens ou desative a detecção automática e informe a cobertura manualmente.</p>}
  </div>

  return <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next) }}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
    <DialogHeader><DialogTitle className="flex items-center gap-2"><CloudDownload className="size-5 text-primary" />Importar pregão e ATAs do Compras.gov.br</DialogTitle><DialogDescription>Consulte o pregão uma vez, selecione as ATAs necessárias e importe ou atualize seus itens sem duplicidade.</DialogDescription></DialogHeader>
    {!preview ? <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label>UASG</Label><Input value={uasg} onChange={(event) => setUasg(event.target.value)} placeholder="Ex.: 160016" autoFocus /></div><div className="space-y-2"><Label>Número do pregão</Label><Input value={numeroPregao} onChange={(event) => setNumeroPregao(event.target.value)} placeholder="Ex.: 90004" /></div><div className="space-y-2"><Label>Ano</Label><Input value={anoPregao} onChange={(event) => setAnoPregao(event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" /></div></div><Alert><Search /><AlertTitle>Consulta sem gravação</AlertTitle><AlertDescription>Nenhum dado será salvo até você confirmar a importação.</AlertDescription></Alert></div>
      : preview.ata ? <div className="space-y-5">
        <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">ATA</p><p className="mt-1 font-medium">{preview.ata.number}</p></div><div><p className="text-xs text-muted-foreground">Fornecedor</p><p className="mt-1 font-medium">{preview.ata.vendorName || "Não informado"}</p></div><div><p className="text-xs text-muted-foreground">Itens</p><p className="mt-1 font-medium">{preview.items.length}</p></div><div><p className="text-xs text-muted-foreground">Valor homologado</p><p className="mt-1 font-medium">{money(totalAmount)}</p></div></div>
        {configuration}
        {preview.warnings.length > 0 && <Alert><AlertTriangle /><AlertTitle>Atenções da consulta</AlertTitle><AlertDescription><ul className="list-disc space-y-1 pl-4">{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></AlertDescription></Alert>}
        <div className="max-h-72 overflow-auto rounded-xl border"><Table><TableHeader><TableRow><TableHead>Referência</TableHead><TableHead>Descrição</TableHead><TableHead>Cobertura identificada</TableHead><TableHead>Unidade</TableHead><TableHead className="text-right">Quantidade</TableHead><TableHead className="text-right">Valor unitário</TableHead></TableRow></TableHeader><TableBody>{preview.items.map((item) => <TableRow key={`${item.externalItemId}-${item.referenceCode}`}><TableCell className="font-medium">{item.referenceCode}</TableCell><TableCell className="max-w-sm text-xs">{item.description}</TableCell><TableCell><CoverageBadges coverages={item.coverage ? [item.coverage] : []} /></TableCell><TableCell>{item.unit}</TableCell><TableCell className="text-right">{item.initialQuantity.toLocaleString("pt-BR")}</TableCell><TableCell className="text-right">{money(item.unitPrice)}</TableCell></TableRow>)}</TableBody></Table></div>
      </div>
        : <div className="space-y-5">
          <Alert><CheckCircle2 /><AlertTitle>{preview.atasFound.length} ATA(s) encontrada(s)</AlertTitle><AlertDescription>Marque quantas desejar. ATAs já importadas serão atualizadas, preservando reservas e consumos.</AlertDescription></Alert>
          {configuration}
          <div className="flex items-center justify-between"><label className="flex cursor-pointer items-center gap-2 text-sm font-medium"><input type="checkbox" className="size-4 accent-primary" checked={allSelected} onChange={() => setSelectedAtaNumbers(allSelected ? [] : preview.atasFound.map((ata) => ata.ataNumber))} />Selecionar todas</label><Badge variant="outline">{selectedAtaNumbers.length} selecionada(s)</Badge></div>
          <div className="grid gap-3 sm:grid-cols-2">{preview.atasFound.map((found) => <div key={found.ataNumber} className="rounded-xl border p-4"><div className="flex items-start gap-3"><input type="checkbox" className="mt-1 size-4 accent-primary" checked={selectedAtaNumbers.includes(found.ataNumber)} onChange={() => toggleAta(found.ataNumber)} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{found.ataNumber}</p><div className="flex flex-wrap gap-2"><Badge variant={found.importStatus === "UPDATE_AVAILABLE" ? "default" : "outline"}>{importStatusLabel[found.importStatus ?? "NOT_IMPORTED"]}</Badge><Badge variant="outline">{found.itemCount} itens</Badge></div></div><p className="mt-2 truncate text-sm text-muted-foreground">{found.vendorName || "Fornecedor não informado"}</p><div className="mt-3"><CoverageBadges coverages={found.coverageGroups} /></div>{found.totalAmount !== null && <p className="mt-3 font-medium">{money(found.totalAmount)}</p>}<Button className="mt-3 px-0" variant="link" size="sm" onClick={() => { setNumeroAta(found.ataNumber); previewMutation.mutate(found.ataNumber) }}>Conferir itens e coberturas</Button></div></div></div>)}</div>
        </div>}
    <DialogFooter>{preview && <Button variant="ghost" onClick={resetPreview} disabled={busy}><ArrowLeft className="size-4" />Nova consulta</Button>}<Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>{!preview && <Button onClick={() => previewMutation.mutate(undefined)} disabled={!canSearch || busy}>{previewMutation.isPending && <Loader2 className="size-4 animate-spin" />}Consultar pregão</Button>}{preview?.ata && <Button onClick={() => importMutation.mutate()} disabled={!preview.items.length || !validConfiguration || busy}>{importMutation.isPending && <Loader2 className="size-4 animate-spin" />}{preview.selectedAta?.importedAtaId ? "Atualizar ATA" : "Importar ATA"}</Button>}{preview && !preview.ata && <><Button variant="secondary" onClick={() => bulkImportMutation.mutate(importedAtaNumbers)} disabled={!importedAtaNumbers.length || (!autoDetectCoverage && !manualCoverageValid) || (autoDetectCoverage && preview.atasFound.filter((ata) => importedAtaNumbers.includes(ata.ataNumber)).some((ata) => !ata.coverageDetected)) || busy}>Atualizar somente importadas</Button><Button onClick={() => bulkImportMutation.mutate(undefined)} disabled={!selectedAtaNumbers.length || !validConfiguration || busy}>{bulkImportMutation.isPending && <Loader2 className="size-4 animate-spin" />}{selectedAtaNumbers.length === preview.atasFound.length ? "Importar todas" : "Importar selecionadas"}</Button></>}</DialogFooter>
  </DialogContent></Dialog>
}
