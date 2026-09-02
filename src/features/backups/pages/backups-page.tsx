import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArchiveRestore, CheckCircle2, Clock3, DatabaseBackup, Download, FileArchive, FileDown, HardDrive, RefreshCw, ShieldAlert, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuthStore } from "@/features/auth/auth.store"
import { SettingsNavigation } from "@/features/system-health/components/settings-navigation"
import { cn } from "@/lib/utils"
import { backupsService } from "../backups.service"
import { AuthorityBackupCard } from "../components/authority-backup-card"
import type { DatabaseBackup as Backup, BackupKind, SelectiveExportModule } from "../backups.types"

const kindMeta: Record<BackupKind, { label: string; className: string }> = {
  MANUAL: { label: "Manual", className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  AUTOMATIC: { label: "Automático", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  IMPORTED: { label: "Importado", className: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  SAFETY: { label: "Segurança", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" },
}

const exportOptions: Array<{ id: SelectiveExportModule; label: string; description: string }> = [
  { id: "PROJECTS", label: "Projetos", description: "Projetos, estimativas, DIEx, NE, OS, tarefas e notas fiscais" },
  { id: "ATAS", label: "Atas e saldos", description: "Atas, grupos, itens e movimentações internas" },
  { id: "USERS", label: "Usuários e acessos", description: "Usuários, permissões e perfis de acesso" },
  { id: "SETTINGS", label: "Configurações", description: "Parâmetros, integrações e organizações militares" },
  { id: "AUDIT", label: "Auditoria", description: "Auditoria, alertas e notificações" },
]

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`
  return `${(value / 1024 ** 3).toFixed(2)} GB`
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

function SummaryCard({ title, value, detail, icon: Icon }: { title: string; value: string; detail: string; icon: typeof HardDrive }) {
  return <Card><CardContent className="flex items-start justify-between p-5"><div><p className="text-sm text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><span className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="size-5" /></span></CardContent></Card>
}

export function BackupsPage() {
  const queryClient = useQueryClient()
  const logout = useAuthStore((state) => state.logout)
  const fileInput = useRef<HTMLInputElement>(null)
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Backup | null>(null)
  const [confirmation, setConfirmation] = useState("")
  const [selectedModules, setSelectedModules] = useState<SelectiveExportModule[]>(["PROJECTS", "ATAS"])
  const query = useQuery({ queryKey: ["backups"], queryFn: backupsService.list })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["backups"] })
  const createMutation = useMutation({
    mutationFn: backupsService.create,
    onSuccess: () => { toast.success("Backup criado e verificado com sucesso."); void refresh() },
    onError: (error) => toast.error(error.message),
  })
  const importMutation = useMutation({
    mutationFn: backupsService.importArchive,
    onSuccess: () => { toast.success("Backup importado e validado."); void refresh() },
    onError: (error) => toast.error(error.message),
  })
  const removeMutation = useMutation({
    mutationFn: backupsService.remove,
    onSuccess: () => { toast.success("Backup excluído."); setDeleteTarget(null); void refresh() },
    onError: (error) => toast.error(error.message),
  })
  const restoreMutation = useMutation({
    mutationFn: (backup: Backup) => backupsService.restore(backup.id),
    onSuccess: (response) => {
      toast.success(response.message)
      setRestoreTarget(null)
      logout()
      window.location.assign("/login")
    },
    onError: (error) => toast.error(error.message),
  })
  const exportMutation = useMutation({
    mutationFn: () => backupsService.selectiveExport(selectedModules),
    onSuccess: (blob) => {
      saveBlob(blob, `sagep-export-${selectedModules.map((item) => item.toLowerCase()).join("-")}-${new Date().toISOString().slice(0, 10)}.sql`)
      toast.success("Exportação seletiva concluída.")
    },
    onError: (error) => toast.error(error.message),
  })

  const download = async (backup: Backup) => {
    try { saveBlob(await backupsService.download(backup.id), backup.filename) }
    catch (error) { toast.error(error instanceof Error ? error.message : "Falha no download") }
  }

  const selectFile = (file?: File) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".dump")) {
      toast.error("Selecione um arquivo .dump gerado pelo SAGEP.")
      return
    }
    if (query.data && file.size > query.data.policy.maxUploadMb * 1024 ** 2) {
      toast.error(`O arquivo excede o limite de ${query.data.policy.maxUploadMb} MB.`)
      return
    }
    importMutation.mutate(file)
  }

  if (query.isLoading) return <div className="space-y-6"><SettingsNavigation /><Skeleton className="h-24" /><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div><Skeleton className="h-80" /></div>
  if (query.isError || !query.data) return <Alert variant="destructive"><ShieldAlert /><AlertTitle>Não foi possível carregar os backups</AlertTitle><AlertDescription>{query.error?.message ?? "Falha desconhecida"}</AlertDescription></Alert>
  const data = query.data
  const busy = createMutation.isPending || importMutation.isPending || restoreMutation.isPending || data.operationRunning

  return <div className="space-y-6">
    <SettingsNavigation />
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div><Badge className="mb-3">Administração crítica</Badge><h1 className="text-3xl font-semibold tracking-tight">Backup e restauração</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Proteja o banco PostgreSQL do SAGEP, importe cópias externas e restaure o ambiente com verificação de integridade.</p></div>
      <div className="flex flex-wrap gap-2"><input ref={fileInput} type="file" accept=".dump,application/octet-stream" className="hidden" onChange={(event) => { selectFile(event.target.files?.[0]); event.currentTarget.value = "" }} /><Button variant="outline" onClick={() => fileInput.current?.click()} disabled={busy}><Upload />Importar backup</Button><Button onClick={() => createMutation.mutate()} disabled={busy}>{createMutation.isPending ? <RefreshCw className="animate-spin" /> : <DatabaseBackup />}Criar backup agora</Button></div>
    </div>

    <Alert><CheckCircle2 /><AlertTitle>Armazenamento persistente e verificação SHA-256</AlertTitle><AlertDescription>Os backups permanecem no volume dedicado do Docker. Antes de qualquer restauração, o SAGEP valida o arquivo e cria automaticamente uma cópia de segurança do estado atual.</AlertDescription></Alert>

    <div className="grid gap-4 md:grid-cols-3"><SummaryCard title="Backups disponíveis" value={String(data.summary.total)} detail={`${data.summary.automatic} automáticos · ${data.summary.imported} importados`} icon={FileArchive} /><SummaryCard title="Espaço utilizado" value={formatBytes(data.summary.totalSizeBytes)} detail={`Limite de ${data.policy.maxFiles} backups automáticos`} icon={HardDrive} /><SummaryCard title="Rotina automática" value={data.policy.scheduleHours > 0 ? `A cada ${data.policy.scheduleHours}h` : "Desativada"} detail={`Retenção de ${data.policy.retentionDays} dias`} icon={Clock3} /></div>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileDown className="size-5" />Exportação seletiva</CardTitle><CardDescription>Gere um arquivo SQL somente com os módulos necessários. Esta opção é indicada para conferência, custódia ou migração assistida.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{exportOptions.map((option) => { const checked = selectedModules.includes(option.id); return <label key={option.id} className={cn("flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors", checked && "border-primary/40 bg-primary/5")}><input type="checkbox" checked={checked} onChange={() => setSelectedModules((current) => checked ? current.filter((item) => item !== option.id) : [...current, option.id])} /><span><span className="block text-sm font-medium">{option.label}</span><span className="mt-1 block text-xs text-muted-foreground">{option.description}</span></span></label> })}</div><Button variant="outline" disabled={!selectedModules.length || exportMutation.isPending || busy} onClick={() => exportMutation.mutate()}>{exportMutation.isPending ? <RefreshCw className="animate-spin" /> : <Download />}Exportar módulos selecionados</Button></CardContent></Card>

    <AuthorityBackupCard />

    <Card><CardHeader><CardTitle>Histórico de backups</CardTitle><CardDescription>Arquivos disponíveis para download ou restauração integral do banco. O download exige confirmação recente da sua senha e uma nova verificação de integridade.</CardDescription></CardHeader><CardContent>{data.items.length === 0 ? <div className="rounded-lg border border-dashed p-10 text-center"><FileArchive className="mx-auto size-9 text-muted-foreground" /><p className="mt-3 font-medium">Nenhum backup disponível</p><p className="mt-1 text-sm text-muted-foreground">Crie a primeira cópia para proteger os dados do SAGEP.</p></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Backup</TableHead><TableHead>Tipo</TableHead><TableHead>Criado em</TableHead><TableHead>Tamanho</TableHead><TableHead>Integridade</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{data.items.map((backup) => <TableRow key={backup.id}><TableCell><p className="font-medium">{backup.filename}</p><p className="text-xs text-muted-foreground">{backup.originalFilename ? `Origem: ${backup.originalFilename}` : backup.createdBy ?? "Rotina do sistema"}</p></TableCell><TableCell><Badge variant="outline" className={kindMeta[backup.kind].className}>{kindMeta[backup.kind].label}</Badge></TableCell><TableCell>{new Date(backup.createdAt).toLocaleString("pt-BR")}</TableCell><TableCell>{formatBytes(backup.sizeBytes)}</TableCell><TableCell><span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-4" />SHA-256 verificado</span></TableCell><TableCell><div className="flex justify-end gap-1"><Button size="icon-sm" variant="ghost" title="Baixar" onClick={() => void download(backup)}><Download /></Button><Button size="icon-sm" variant="ghost" title="Restaurar" onClick={() => { setRestoreTarget(backup); setConfirmation("") }} disabled={busy}><ArchiveRestore /></Button><Button size="icon-sm" variant="ghost" title="Excluir" className="text-destructive" disabled={busy || removeMutation.isPending} onClick={() => setDeleteTarget(backup)}><Trash2 /></Button></div></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>

    <Dialog open={Boolean(restoreTarget)} onOpenChange={(open) => { if (!open && !restoreMutation.isPending) setRestoreTarget(null) }}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><ShieldAlert className="size-5" />Restaurar banco de dados</DialogTitle><DialogDescription>Esta operação substituirá integralmente os dados atuais pelos dados de <strong>{restoreTarget?.filename}</strong>. Uma cópia de segurança será criada antes da restauração.</DialogDescription></DialogHeader><Alert variant="destructive"><ShieldAlert /><AlertTitle>Operação crítica</AlertTitle><AlertDescription>Usuários conectados poderão perder a sessão. Após a conclusão, você será direcionado novamente ao login.</AlertDescription></Alert><div className="space-y-2"><Label htmlFor="restore-confirmation">Digite RESTAURAR BANCO para confirmar</Label><Input id="restore-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" /></div><DialogFooter><Button variant="outline" onClick={() => setRestoreTarget(null)} disabled={restoreMutation.isPending}>Cancelar</Button><Button variant="destructive" disabled={confirmation !== "RESTAURAR BANCO" || restoreMutation.isPending} onClick={() => restoreTarget && restoreMutation.mutate(restoreTarget)}>{restoreMutation.isPending ? <RefreshCw className="animate-spin" /> : <ArchiveRestore />}Restaurar definitivamente</Button></DialogFooter></DialogContent></Dialog>
    <ConfirmationDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Excluir backup definitivamente?" description={deleteTarget ? `O arquivo ${deleteTarget.filename} será removido do armazenamento persistente e não poderá ser utilizado em uma restauração.` : "O backup será excluído."} confirmLabel="Excluir backup" variant="destructive" pending={removeMutation.isPending} onConfirm={() => deleteTarget && removeMutation.mutate(deleteTarget.id)} />
  </div>
}
