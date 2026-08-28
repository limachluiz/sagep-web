import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, BookOpenCheck, CheckCircle2, Pencil, Play, Plus, Save, SpellCheck2, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { SettingsNavigation } from "@/features/system-health/components/settings-navigation"
import { textCorrectionsService } from "../text-corrections.service"
import type { TextCorrectionInput, TextCorrectionRule } from "../text-corrections.types"
import { useAuthStore } from "@/features/auth/auth.store"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const emptyForm: TextCorrectionInput = { damagedText: "", correctedText: "", isActive: true }

export function TextCorrectionsSettingsPage() {
  const queryClient = useQueryClient()
  const canManage = useAuthStore((state) => state.hasPermission("settings.manage"))
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TextCorrectionRule | null>(null)
  const [form, setForm] = useState<TextCorrectionInput>(emptyForm)
  const [sample, setSample] = useState("")
  const [preview, setPreview] = useState<{ correctedText: string; unresolvedTokens: string[] } | null>(null)

  const query = useQuery({ queryKey: ["text-corrections"], queryFn: textCorrectionsService.list })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["text-corrections"] })
  const save = useMutation({
    mutationFn: () => editing ? textCorrectionsService.update(editing.id, form) : textCorrectionsService.create(form),
    onSuccess: () => { toast.success(editing ? "Correção atualizada." : "Nova correção cadastrada."); setFormOpen(false); setEditing(null); setForm(emptyForm); void refresh() },
    onError: (error) => toast.error(error.message),
  })
  const remove = useMutation({
    mutationFn: (rule: TextCorrectionRule) => textCorrectionsService.remove(rule.id),
    onSuccess: () => { toast.success("Correção removida."); void refresh() },
    onError: (error) => toast.error(error.message),
  })
  const test = useMutation({
    mutationFn: () => textCorrectionsService.test({ text: sample, damagedText: form.damagedText || undefined, correctedText: form.correctedText || undefined }),
    onSuccess: (result) => setPreview(result),
    onError: (error) => toast.error(error.message),
  })
  const applyCatalog = useMutation({
    mutationFn: textCorrectionsService.applyCatalog,
    onSuccess: (result) => { toast.success(`${result.corrected} de ${result.total} descrição(ões) corrigida(s).`); void refresh(); void queryClient.invalidateQueries({ queryKey: ["atas"] }) },
    onError: (error) => toast.error(error.message),
  })

  const openCreate = (damagedText = "") => { setEditing(null); setForm({ ...emptyForm, damagedText }); setSample(damagedText); setPreview(null); setFormOpen(true) }
  const openEdit = (rule: TextCorrectionRule) => { setEditing(rule); setForm({ damagedText: rule.damagedText, correctedText: rule.correctedText, isActive: rule.isActive }); setSample(rule.damagedText); setPreview(null); setFormOpen(true) }
  const confirmRemove = (rule: TextCorrectionRule) => { if (window.confirm(`Excluir a correção “${rule.damagedText}” → “${rule.correctedText}”?`)) remove.mutate(rule) }
  const confirmApply = () => { if (window.confirm("Aplicar o dicionário a todas as descrições de itens do catálogo? As correções serão gravadas no banco.")) applyCatalog.mutate() }

  return <div className="space-y-6">
    <SettingsNavigation />
    <div className="flex flex-wrap items-start justify-between gap-4"><div><Badge className="mb-3">Configurações · Qualidade de dados</Badge><h1 className="text-3xl font-semibold tracking-tight">Dicionário de correções</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Cadastre substituições para textos corrompidos importados do Compras.gov. Novas regras passam a funcionar imediatamente, sem reconstruir o Docker.</p></div>{canManage && <div className="flex gap-2"><Button variant="outline" onClick={confirmApply} disabled={applyCatalog.isPending}><SpellCheck2 />Aplicar em todas as ATAs</Button><Button onClick={() => openCreate()}><Plus />Nova correção</Button></div>}</div>

    {query.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar o dicionário</AlertTitle><AlertDescription>{query.error.message}</AlertDescription></Alert>}
    {query.data && <>
      <div className="grid gap-4 md:grid-cols-3"><Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Regras internas</p><p className="mt-2 text-3xl font-semibold">{query.data.builtInRuleCount}</p></CardContent></Card><Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Regras personalizadas</p><p className="mt-2 text-3xl font-semibold">{query.data.rules.length}</p></CardContent></Card><Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Termos pendentes</p><p className="mt-2 text-3xl font-semibold">{query.data.unresolvedTokens.length}</p></CardContent></Card></div>

      {query.data.unresolvedTokens.length > 0 ? <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-amber-500" />Termos ainda não reconhecidos</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{query.data.unresolvedTokens.map((item) => <Button key={item.token} variant="outline" size="sm" onClick={() => canManage && openCreate(item.token)} disabled={!canManage}>{item.token}<Badge variant="secondary">{item.occurrences}</Badge></Button>)}</div><p className="mt-3 text-xs text-muted-foreground">Selecione um termo para criar sua correção. O número indica quantas descrições contêm esse código.</p></CardContent></Card> : <Alert><CheckCircle2 /><AlertTitle>Nenhum termo corrompido pendente</AlertTitle><AlertDescription>As descrições atuais estão cobertas pelas regras conhecidas.</AlertDescription></Alert>}

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpenCheck className="size-5 text-primary" />Regras internas</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-muted-foreground">Correções fornecidas pelo SAGEP. Elas estão sempre ativas e são protegidas contra edição e exclusão.</p><Table><TableHeader><TableRow><TableHead>Texto corrompido</TableHead><TableHead>Substituir por</TableHead><TableHead>Origem</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader><TableBody>{query.data.builtInRules.map((rule) => <TableRow key={rule.id}><TableCell className="font-mono">{rule.damagedText}</TableCell><TableCell>{rule.correctedText}</TableCell><TableCell><Badge variant="outline">Interna</Badge></TableCell><TableCell><Badge>Ativa</Badge></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpenCheck className="size-5 text-primary" />Regras personalizadas</CardTitle></CardHeader><CardContent>{query.data.rules.length ? <Table><TableHeader><TableRow><TableHead>Texto corrompido</TableHead><TableHead>Substituir por</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{query.data.rules.map((rule) => <TableRow key={rule.id}><TableCell className="font-mono">{rule.damagedText}</TableCell><TableCell>{rule.correctedText}</TableCell><TableCell><Badge variant={rule.isActive ? "default" : "secondary"}>{rule.isActive ? "Ativa" : "Inativa"}</Badge></TableCell><TableCell><div className="flex justify-end gap-1">{canManage && <><Button variant="ghost" size="icon" onClick={() => openEdit(rule)} title="Editar"><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" onClick={() => confirmRemove(rule)} title="Excluir"><Trash2 className="size-4 text-destructive" /></Button></>}</div></TableCell></TableRow>)}</TableBody></Table> : <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma regra personalizada cadastrada.</p>}</CardContent></Card>
    </>}

    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{editing ? "Editar correção" : "Cadastrar correção"}</DialogTitle><DialogDescription>Informe exatamente o trecho danificado e como ele deve ser gravado. A substituição ignora maiúsculas e minúsculas.</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Texto corrompido</Label><Input value={form.damagedText} onChange={(event) => setForm((current) => ({ ...current, damagedText: event.target.value }))} placeholder="Ex.: ALVAR�ES" /></div><div className="space-y-2"><Label>Correção</Label><Input value={form.correctedText} onChange={(event) => setForm((current) => ({ ...current, correctedText: event.target.value }))} placeholder="Ex.: ALVARÃES" /></div></div><div className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">Regra ativa</p><p className="text-xs text-muted-foreground">Regras inativas permanecem salvas, mas não são aplicadas.</p></div><Switch checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} /></div><div className="space-y-2"><Label>Texto para teste</Label><Textarea rows={4} value={sample} onChange={(event) => setSample(event.target.value)} placeholder="Cole aqui uma descrição completa antes de salvar." /><Button type="button" variant="outline" onClick={() => test.mutate()} disabled={!sample || test.isPending}><Play />Testar substituição</Button></div>{preview && <div className="rounded-lg border bg-muted/30 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resultado</p><p className="mt-2 whitespace-pre-wrap text-sm">{preview.correctedText}</p>{preview.unresolvedTokens.length > 0 && <p className="mt-3 text-xs text-amber-600">Ainda não reconhecidos: {preview.unresolvedTokens.join(", ")}</p>}</div>}</div><DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button><Button onClick={() => save.mutate()} disabled={!form.damagedText.trim() || !form.correctedText.trim() || save.isPending}><Save />Salvar correção</Button></DialogFooter></DialogContent></Dialog>
  </div>
}
