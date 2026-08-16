import { useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { militaryOrganizationsService, type MilitaryOrganizationImportAction, type MilitaryOrganizationImportMode } from "@/features/projects/military-organizations.service"

const actionMeta: Record<MilitaryOrganizationImportAction, { label: string; style: string }> = {
  CREATE: { label: "Cadastrar", style: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  UPDATE: { label: "Atualizar", style: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  UNCHANGED: { label: "Sem alteração", style: "border-border bg-muted text-muted-foreground" },
  SKIP: { label: "Ignorar", style: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  INVALID: { label: "Erro", style: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300" },
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

type Props = { open: boolean; onOpenChange: (open: boolean) => void; onImported: () => void }

export function MilitaryOrganizationsImportDialog({ open, onOpenChange, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [filename, setFilename] = useState("")
  const [content, setContent] = useState("")
  const [mode, setMode] = useState<MilitaryOrganizationImportMode>("CREATE_ONLY")
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof militaryOrganizationsService.previewImport>> | null>(null)

  const previewMutation = useMutation({ mutationFn: () => militaryOrganizationsService.previewImport(content, mode), onSuccess: setPreview, onError: (error) => toast.error(error.message) })
  const importMutation = useMutation({ mutationFn: () => militaryOrganizationsService.importCsv(content, mode), onSuccess: (result) => { toast.success(`${result.imported} OM(s) processada(s): ${result.create} cadastrada(s) e ${result.update} atualizada(s).`); setFilename(""); setContent(""); setMode("CREATE_ONLY"); setPreview(null); onImported(); onOpenChange(false) }, onError: (error) => toast.error(error.message) })

  const reset = () => { setFilename(""); setContent(""); setMode("CREATE_ONLY"); setPreview(null) }
  const selectFile = async (file?: File) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".csv")) return toast.error("Selecione um arquivo CSV.")
    if (file.size > 1_500_000) return toast.error("O CSV deve possuir no máximo 1,5 MB.")
    setFilename(file.name); setContent(await file.text()); setPreview(null)
  }
  const downloadTemplate = async () => { try { saveBlob(await militaryOrganizationsService.template(), "modelo-importacao-oms.csv") } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao baixar o modelo") } }
  const changeMode = (next: MilitaryOrganizationImportMode) => { setMode(next); setPreview(null) }

  return <Dialog open={open} onOpenChange={(next) => { if (!next && importMutation.isPending) return; if (!next) reset(); onOpenChange(next) }}><DialogContent className="sm:max-w-4xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="size-5 text-primary" />Importar Organizações Militares</DialogTitle><DialogDescription>Use o modelo CSV para cadastrar OMs em escala. O arquivo será analisado antes de qualquer alteração no banco.</DialogDescription></DialogHeader>
    <div className="grid gap-4 md:grid-cols-[1fr_auto]"><button type="button" className="flex min-h-28 items-center gap-4 rounded-lg border border-dashed p-5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5" onClick={() => inputRef.current?.click()}><span className="rounded-xl bg-primary/10 p-3 text-primary"><Upload className="size-5" /></span><span><span className="block font-medium">{filename || "Selecionar arquivo CSV"}</span><span className="mt-1 block text-xs text-muted-foreground">Até 1.000 OMs · máximo de 1,5 MB</span></span></button><input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { void selectFile(event.target.files?.[0]); event.currentTarget.value = "" }} /><Button variant="outline" className="self-center" onClick={() => void downloadTemplate()}><Download />Baixar modelo</Button></div>
    <div className="grid gap-3 sm:grid-cols-2"><label className={`cursor-pointer rounded-lg border p-4 ${mode === "CREATE_ONLY" ? "border-primary/40 bg-primary/5" : ""}`}><span className="flex gap-3"><input type="radio" checked={mode === "CREATE_ONLY"} onChange={() => changeMode("CREATE_ONLY")} /><span><span className="block text-sm font-medium">Somente cadastrar novas</span><span className="mt-1 block text-xs text-muted-foreground">Siglas que já existem serão ignoradas.</span></span></span></label><label className={`cursor-pointer rounded-lg border p-4 ${mode === "UPSERT" ? "border-primary/40 bg-primary/5" : ""}`}><span className="flex gap-3"><input type="radio" checked={mode === "UPSERT"} onChange={() => changeMode("UPSERT")} /><span><span className="block text-sm font-medium">Cadastrar e atualizar</span><span className="mt-1 block text-xs text-muted-foreground">OMs existentes serão atualizadas pela sigla.</span></span></span></label></div>
    {!preview && <Alert><CheckCircle2 /><AlertTitle>Nenhum dado será gravado nesta etapa</AlertTitle><AlertDescription>Selecione o arquivo e clique em Analisar CSV para conferir todas as linhas.</AlertDescription></Alert>}
    {preview && <div className="space-y-3"><div className="flex flex-wrap gap-2"><Badge variant="outline">{preview.summary.total} linhas</Badge><Badge variant="outline" className={actionMeta.CREATE.style}>{preview.summary.create} novas</Badge><Badge variant="outline" className={actionMeta.UPDATE.style}>{preview.summary.update} atualizações</Badge><Badge variant="outline" className={actionMeta.SKIP.style}>{preview.summary.skipped + preview.summary.unchanged} ignoradas</Badge><Badge variant="outline" className={actionMeta.INVALID.style}>{preview.summary.invalid} com erro</Badge></div>{preview.summary.invalid > 0 && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Linhas inválidas não serão importadas</AlertTitle><AlertDescription>Corrija o arquivo para importar todas as OMs ou prossiga apenas com as linhas válidas.</AlertDescription></Alert>}<div className="max-h-80 overflow-auto rounded-lg border"><Table><TableHeader className="sticky top-0 bg-background"><TableRow><TableHead>Linha</TableHead><TableHead>Sigla</TableHead><TableHead>Nome</TableHead><TableHead>Localidade</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader><TableBody>{preview.rows.map((row) => <TableRow key={row.line}><TableCell>{row.line}</TableCell><TableCell className="font-medium">{row.sigla || "—"}</TableCell><TableCell><span className="block max-w-xs truncate">{row.name || "—"}</span>{row.issues.length > 0 && <span className="mt-1 block text-xs text-destructive">{row.issues.join("; ")}</span>}</TableCell><TableCell>{row.cityName || "—"}/{row.stateUf || "—"}</TableCell><TableCell><Badge variant="outline" className={actionMeta[row.action].style}>{actionMeta[row.action].label}</Badge></TableCell></TableRow>)}</TableBody></Table></div></div>}
    <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={importMutation.isPending}>Cancelar</Button>{preview ? <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending || preview.summary.create + preview.summary.update === 0}>{importMutation.isPending && <Loader2 className="animate-spin" />}Confirmar importação ({preview.summary.create + preview.summary.update})</Button> : <Button onClick={() => previewMutation.mutate()} disabled={!content || previewMutation.isPending}>{previewMutation.isPending && <Loader2 className="animate-spin" />}Analisar CSV</Button>}</DialogFooter>
  </DialogContent></Dialog>
}
