import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Download, FileArchive, FileImage, FileText, Files, Filter, Images, Loader2, Plus, Search, Trash2, UploadCloud, Video } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { invalidateProjectFlow } from "@/features/projects/project-flow-cache"
import { evidencesService } from "../evidences.service"
import type { EvidenceCategory, EvidencePhase, ProjectEvidence } from "../evidences.types"

const categories: Record<EvidenceCategory, string> = { IMAGE: "Imagem", VIDEO: "Vídeo", KMZ_KML: "KMZ / KML", TECHNICAL_DOCUMENT: "Documento técnico", CERTIFICATION: "Certificação", DIAGRAM: "Diagrama", AS_BUILT: "As-Built", OTHER: "Outro" }
const phases: Record<EvidencePhase, string> = { BEFORE: "Antes da execução", DURING: "Durante a execução", AFTER: "Depois da execução", GENERAL: "Geral" }
const phaseColors: Record<EvidencePhase, string> = {
  BEFORE: "border-sky-500/30 bg-sky-500/5 text-sky-700 dark:text-sky-300",
  DURING: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300",
  AFTER: "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
  GENERAL: "border-violet-500/30 bg-violet-500/5 text-violet-700 dark:text-violet-300",
}
const acceptedFiles = ".jpg,.jpeg,.png,.webp,.mp4,.webm,.pdf,.kmz,.kml,.docx,.xlsx,.csv"
const size = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.ceil(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
const titleFromFilename = (filename: string) => filename.replace(/\.[^.]+$/, "")
const categoryByExtension = (filename: string): EvidenceCategory => {
  const extension = filename.split(".").pop()?.toLowerCase()
  if (["jpg", "jpeg", "png", "webp"].includes(extension ?? "")) return "IMAGE"
  if (["mp4", "webm"].includes(extension ?? "")) return "VIDEO"
  if (["kmz", "kml"].includes(extension ?? "")) return "KMZ_KML"
  return "TECHNICAL_DOCUMENT"
}

function EvidenceIcon({ category }: { category: EvidenceCategory }) {
  if (category === "IMAGE") return <FileImage className="size-5 text-primary" />
  if (category === "VIDEO") return <Video className="size-5 text-primary" />
  if (category === "KMZ_KML") return <FileArchive className="size-5 text-primary" />
  return <FileText className="size-5 text-primary" />
}

function EvidencePreview({ item }: { item: ProjectEvidence }) {
  const preview = useQuery({
    queryKey: ["evidences", item.id, "preview"],
    queryFn: () => evidencesService.content(item.id),
    enabled: item.category === "IMAGE",
    staleTime: 5 * 60_000,
  })
  const previewUrl = useMemo(
    () => preview.data ? URL.createObjectURL(preview.data) : null,
    [preview.data],
  )

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  if (item.category !== "IMAGE") {
    return <div className="flex h-24 w-full shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:w-32"><EvidenceIcon category={item.category} /></div>
  }

  return <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30 sm:w-32">
    {previewUrl
      ? <img src={previewUrl} alt={item.title} className="size-full object-cover" loading="lazy" />
      : preview.isError
        ? <FileImage className="size-6 text-muted-foreground" />
        : <Loader2 className="size-5 animate-spin text-muted-foreground" />}
  </div>
}

export function EvidencesPanel({ projectId, taskId, canManage }: { projectId: string; taskId?: string; canManage: boolean }) {
  const client = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<EvidenceCategory | "AUTO">("AUTO")
  const [phase, setPhase] = useState<EvidencePhase>("DURING")
  const [include, setInclude] = useState(true)
  const [search, setSearch] = useState("")
  const [phaseFilter, setPhaseFilter] = useState<EvidencePhase | "ALL">("ALL")
  const [categoryFilter, setCategoryFilter] = useState<EvidenceCategory | "ALL">("ALL")

  const query = useQuery({ queryKey: ["evidences", projectId], queryFn: () => evidencesService.list(projectId) })
  const scoped = useMemo(() => (taskId ? query.data?.filter((item) => item.taskId === taskId) : query.data) ?? [], [query.data, taskId])
  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR")
    return scoped.filter((item) => {
      if (phaseFilter !== "ALL" && item.phase !== phaseFilter) return false
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) return false
      return !term || [item.title, item.originalName, item.description].filter(Boolean).some((value) => value!.toLocaleLowerCase("pt-BR").includes(term))
    })
  }, [categoryFilter, phaseFilter, scoped, search])

  const refresh = () => Promise.all([client.invalidateQueries({ queryKey: ["evidences", projectId] }), invalidateProjectFlow(client)])
  const resetForm = () => {
    setFiles([]); setTitle(""); setDescription(""); setCategory("AUTO"); setPhase("DURING"); setInclude(true)
    if (fileInput.current) fileInput.current.value = ""
  }
  const upload = useMutation({
    mutationFn: async () => {
      const uploaded: ProjectEvidence[] = []
      for (const file of files) {
        uploaded.push(await evidencesService.upload(file, {
          projectId,
          taskId,
          title: files.length === 1 && title.trim() ? title.trim() : titleFromFilename(file.name),
          description: description.trim(),
          category: category === "AUTO" ? categoryByExtension(file.name) : category,
          phase,
          includeInReport: include,
        }))
      }
      return uploaded
    },
    onSuccess: async (uploaded) => {
      toast.success(uploaded.length === 1 ? "Evidência adicionada ao projeto." : `${uploaded.length} evidências adicionadas ao projeto.`)
      resetForm(); setDialogOpen(false); await refresh()
    },
    onError: (error) => toast.error(error.message),
  })
  const update = useMutation({ mutationFn: ({ id, includeInReport }: { id: string; includeInReport: boolean }) => evidencesService.update(id, { includeInReport }), onSuccess: refresh, onError: (error) => toast.error(error.message) })
  const remove = useMutation({ mutationFn: (id: string) => evidencesService.remove(id), onSuccess: async () => { toast.success("Evidência removida."); await refresh() }, onError: (error) => toast.error(error.message) })
  const open = async (item: ProjectEvidence) => {
    try {
      const blob = await evidencesService.content(item.id)
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank", "noopener,noreferrer")
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao abrir arquivo") }
  }

  const phaseCount = (value: EvidencePhase) => scoped.filter((item) => item.phase === value).length
  const totalSize = scoped.reduce((total, item) => total + item.sizeBytes, 0)
  const reportCount = scoped.filter((item) => item.includeInReport).length

  return <div className="space-y-5">
    <Card className="overflow-hidden border-none shadow-sm">
      <CardHeader className="gap-4 border-b bg-card sm:flex-row sm:items-center sm:justify-between">
        <div><CardTitle className="flex items-center gap-2"><Images className="size-5 text-primary" />Central de evidências</CardTitle><CardDescription className="mt-1">Organize o histórico técnico antes, durante e depois da execução.</CardDescription></div>
        {canManage && <Button onClick={() => setDialogOpen(true)}><Plus className="size-4" />Adicionar evidências</Button>}
      </CardHeader>
      <CardContent className="grid gap-3 pt-5 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(phases) as EvidencePhase[]).map((value) => <button key={value} type="button" className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${phaseColors[value]}`} onClick={() => setPhaseFilter(phaseFilter === value ? "ALL" : value)}><p className="text-xs font-medium uppercase tracking-wide">{phases[value]}</p><p className="mt-2 text-2xl font-semibold">{phaseCount(value)}</p><p className="text-xs opacity-75">arquivo(s)</p></button>)}
      </CardContent>
    </Card>

    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="border-none shadow-sm"><CardContent className="flex items-center gap-3 p-4"><Files className="size-5 text-primary" /><div><p className="text-xl font-semibold">{scoped.length}</p><p className="text-xs text-muted-foreground">Total de evidências</p></div></CardContent></Card>
      <Card className="border-none shadow-sm"><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="size-5 text-emerald-600" /><div><p className="text-xl font-semibold">{reportCount}</p><p className="text-xs text-muted-foreground">Selecionadas para o relatório</p></div></CardContent></Card>
      <Card className="border-none shadow-sm"><CardContent className="flex items-center gap-3 p-4"><UploadCloud className="size-5 text-primary" /><div><p className="text-xl font-semibold">{size(totalSize)}</p><p className="text-xs text-muted-foreground">Armazenamento utilizado</p></div></CardContent></Card>
    </div>

    <Card className="border-none shadow-sm">
      <CardHeader><CardTitle>{taskId ? "Evidências desta tarefa" : "Acervo do projeto"}</CardTitle><CardDescription>Localize, confira e escolha os arquivos que comporão o relatório técnico.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por título, arquivo ou descrição" /></div>
          <Select value={phaseFilter} onValueChange={(value) => setPhaseFilter(value as EvidencePhase | "ALL")}><SelectTrigger><Filter className="size-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Todas as fases</SelectItem>{Object.entries(phases).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as EvidenceCategory | "ALL")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Todas as categorias</SelectItem>{Object.entries(categories).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        </div>

        {query.isLoading ? <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin" /></div> : visible.length ? <div className="grid gap-3 xl:grid-cols-2">
          {visible.map((item) => <div key={item.id} className="flex flex-col justify-between gap-4 rounded-xl border bg-background p-4 sm:flex-row sm:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row"><EvidencePreview item={item} /><div className="min-w-0"><p className="font-medium">{item.title}</p><p className="truncate text-xs text-muted-foreground">{item.originalName} · {size(item.sizeBytes)}</p>{item.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}<div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">{categories[item.category]}</Badge><Badge variant="outline" className={phaseColors[item.phase]}>{phases[item.phase]}</Badge>{item.includeInReport && <Badge>Relatório técnico</Badge>}{item.task && <Badge variant="secondary">TSK-{item.task.taskCode}</Badge>}</div></div></div>
            <div className="flex shrink-0 flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => open(item)}><Download className="size-4" />Abrir</Button>{canManage && <Button size="sm" variant={item.includeInReport ? "default" : "outline"} disabled={update.isPending} onClick={() => update.mutate({ id: item.id, includeInReport: !item.includeInReport })}>{item.includeInReport ? "No relatório" : "Incluir"}</Button>}{canManage && <Button size="icon-sm" variant="ghost" className="text-destructive" disabled={remove.isPending} onClick={() => remove.mutate(item.id)} aria-label="Remover evidência"><Trash2 /></Button>}</div>
          </div>)}
        </div> : <div className="rounded-xl border border-dashed py-14 text-center"><Images className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-medium">{scoped.length ? "Nenhuma evidência encontrada" : "Nenhuma evidência registrada"}</p><p className="mt-1 text-sm text-muted-foreground">{scoped.length ? "Altere os filtros para visualizar outros arquivos." : "Comece registrando fotos, documentos e resultados da execução."}</p></div>}
      </CardContent>
    </Card>

    <Dialog open={dialogOpen} onOpenChange={(openValue) => { if (!upload.isPending) { setDialogOpen(openValue); if (!openValue) resetForm() } }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><UploadCloud className="size-5 text-primary" />Adicionar evidências</DialogTitle><DialogDescription>Envie um ou vários arquivos e classifique o momento da execução. Cada arquivo pode ter até 100 MB.</DialogDescription></DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2"><Label htmlFor={`evidence-files-${taskId ?? "project"}`}>Arquivos</Label><label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-8 text-center transition hover:border-primary/50 hover:bg-primary/5"><UploadCloud className="size-8 text-primary" /><span className="mt-2 font-medium">Clique para selecionar os arquivos</span><span className="mt-1 text-xs text-muted-foreground">Imagens, vídeos, KMZ/KML, PDF, DOCX, XLSX ou CSV</span><Input ref={fileInput} id={`evidence-files-${taskId ?? "project"}`} className="sr-only" type="file" multiple accept={acceptedFiles} onChange={(event) => { const selected = Array.from(event.target.files ?? []); setFiles(selected); setTitle(selected.length === 1 ? titleFromFilename(selected[0].name) : "") }} /></label>
            {files.length > 0 && <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border p-3">{files.map((file) => <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3 text-sm"><span className="truncate">{file.name}</span><span className="shrink-0 text-xs text-muted-foreground">{size(file.size)}</span></div>)}</div>}
          </div>
          {files.length === 1 && <div className="space-y-2"><Label>Título da evidência</Label><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Certificação do enlace óptico" /></div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Fase da evidência</Label><Select value={phase} onValueChange={(value) => setPhase(value as EvidencePhase)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(phases).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Categoria</Label><Select value={category} onValueChange={(value) => setCategory(value as EvidenceCategory | "AUTO")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AUTO">Detectar automaticamente</SelectItem>{Object.entries(categories).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>Legenda ou descrição comum</Label><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Informe o local, equipamento, atividade executada, resultado do teste ou contexto dos arquivos." /></div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/20 p-4 text-sm"><input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={include} onChange={(event) => setInclude(event.target.checked)} /><span><strong>Incluir no relatório técnico</strong><br /><span className="text-muted-foreground">Os arquivos ficarão previamente selecionados para compor a documentação de conclusão e entrega.</span></span></label>
        </div>
        <DialogFooter><Button variant="outline" disabled={upload.isPending} onClick={() => setDialogOpen(false)}>Cancelar</Button><Button disabled={!files.length || (files.length === 1 && title.trim().length < 2) || upload.isPending} onClick={() => upload.mutate()}>{upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}{upload.isPending ? "Enviando..." : files.length > 1 ? `Adicionar ${files.length} evidências` : "Adicionar evidência"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
}
