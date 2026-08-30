import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, BookOpenCheck, CheckCircle2, Pencil, Play, Plus, Save, SpellCheck2, Trash2 } from "lucide-react"
import { toast } from "sonner"

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
import { useAuthStore } from "@/features/auth/auth.store"
import { SettingsNavigation } from "@/features/system-health/components/settings-navigation"
import { textCorrectionsService } from "../text-corrections.service"
import type { TextCorrectionDecision, TextCorrectionInput, TextCorrectionReviewItem, TextCorrectionRule } from "../text-corrections.types"

const emptyForm: TextCorrectionInput = { damagedText: "", correctedText: "", isActive: true }

export function TextCorrectionsSettingsPage() {
  const queryClient = useQueryClient()
  const canManage = useAuthStore((state) => state.hasPermission("settings.manage"))
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<TextCorrectionRule | null>(null)
  const [form, setForm] = useState<TextCorrectionInput>(emptyForm)
  const [sample, setSample] = useState("")
  const [preview, setPreview] = useState<{ correctedText: string; unresolvedTokens: string[] } | null>(null)
  const [reviewing, setReviewing] = useState<TextCorrectionReviewItem | null>(null)
  const [reviewText, setReviewText] = useState("")
  const [learnRule, setLearnRule] = useState<{ damagedText: string; correctedText: string } | null>(null)

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
    onSuccess: (result) => { toast.success(`${result.corrected} de ${result.total} descrição(ões) atualizada(s).`); void refresh(); void queryClient.invalidateQueries({ queryKey: ["atas"] }) },
    onError: (error) => toast.error(error.message),
  })
  const reviewItem = useMutation({
    mutationFn: () => textCorrectionsService.reviewItem(reviewing!.itemId, reviewText, learnRule ?? undefined),
    onSuccess: () => { toast.success(learnRule ? "Descrição revisada e correção aprendida." : "Descrição revisada e protegida contra novas sincronizações."); setReviewing(null); setReviewText(""); setLearnRule(null); void refresh(); void queryClient.invalidateQueries({ queryKey: ["atas"] }) },
    onError: (error) => toast.error(error.message),
  })

  const openCreate = (damagedText = "") => { setEditing(null); setForm({ ...emptyForm, damagedText }); setSample(damagedText); setPreview(null); setFormOpen(true) }
  const openEdit = (rule: TextCorrectionRule) => { setEditing(rule); setForm({ damagedText: rule.damagedText, correctedText: rule.correctedText, isActive: rule.isActive }); setSample(rule.damagedText); setPreview(null); setFormOpen(true) }
  const confirmRemove = (rule: TextCorrectionRule) => { if (window.confirm(`Excluir a correção “${rule.damagedText}” → “${rule.correctedText}”?`)) remove.mutate(rule) }
  const confirmApply = () => { if (window.confirm("Executar o motor automático em todas as descrições? Revisões manuais serão preservadas.")) applyCatalog.mutate() }
  const openReview = (item: TextCorrectionReviewItem) => { setReviewing(item); setReviewText(item.automaticText); setLearnRule(null) }
  const useAlternative = (decision: TextCorrectionDecision, alternative: string) => { setReviewText((current) => current.replace(decision.damagedText, alternative)); setLearnRule({ damagedText: decision.damagedText, correctedText: alternative }) }

  return <div className="space-y-6">
    <SettingsNavigation />
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><Badge className="mb-3">Configurações · Qualidade de dados</Badge><h1 className="text-3xl font-semibold tracking-tight">Correção inteligente de descrições</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">O SAGEP reconstrói automaticamente textos corrompidos com vocabulário português e técnico. Somente casos ambíguos exigem revisão.</p></div>
      {canManage && <div className="flex gap-2"><Button variant="outline" onClick={confirmApply} disabled={applyCatalog.isPending}><SpellCheck2 />Processar todas as ATAs</Button><Button onClick={() => openCreate()}><Plus />Nova exceção</Button></div>}
    </div>

    {query.isError && <Alert variant="destructive"><AlertTriangle /><AlertTitle>Não foi possível carregar as correções</AlertTitle><AlertDescription>{query.error.message}</AlertDescription></Alert>}
    {query.data && <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[['Regras internas', query.data.builtInRuleCount], ['Exceções personalizadas', query.data.rules.length], ['Termos desconhecidos', query.data.unresolvedTokens.length], ['Itens para revisão', query.data.reviewItems.length]].map(([label, value]) => <Card key={String(label)}><CardContent className="pt-6"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></CardContent></Card>)}
      </div>

      {query.data.reviewItems.length > 0 ? <Card><CardHeader><CardTitle className="flex items-center gap-2"><SpellCheck2 className="size-5 text-amber-500" />Revisão assistida</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-muted-foreground">O motor não encontrou uma solução inequívoca para estes itens. O original foi preservado.</p><div className="space-y-3">{query.data.reviewItems.map((item) => <div key={item.itemId} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{item.ata.number} · Item {item.referenceCode}</p><p className="text-xs text-muted-foreground">{item.ata.vendorName ?? "Fornecedor não informado"}</p></div>{canManage && <Button size="sm" variant="outline" onClick={() => openReview(item)}><Pencil className="size-4" />Revisar</Button>}</div><p className="mt-3 text-sm leading-6">{item.automaticText}</p><div className="mt-3 flex flex-wrap gap-2">{item.unresolvedTokens.map((token) => <Badge key={token} variant="destructive">{token}</Badge>)}</div></div>)}</div></CardContent></Card> : <Alert><CheckCircle2 /><AlertTitle>Nenhuma revisão pendente</AlertTitle><AlertDescription>As descrições atuais foram reconhecidas ou já validadas.</AlertDescription></Alert>}

      {query.data.unresolvedTokens.length > 0 && <Card><CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-amber-500" />Termos desconhecidos</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{query.data.unresolvedTokens.map((item) => <Button key={item.token} variant="outline" size="sm" onClick={() => canManage && openCreate(item.token)} disabled={!canManage}>{item.token}<Badge variant="secondary">{item.occurrences}</Badge></Button>)}</div><p className="mt-3 text-xs text-muted-foreground">Use uma exceção somente quando nenhuma sugestão automática for adequada.</p></CardContent></Card>}

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpenCheck className="size-5 text-primary" />Regras internas</CardTitle></CardHeader><CardContent><p className="mb-4 text-sm text-muted-foreground">Regras determinísticas protegidas, aplicadas antes do vocabulário automático.</p><Table><TableHeader><TableRow><TableHead>Texto corrompido</TableHead><TableHead>Substituir por</TableHead><TableHead>Origem</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader><TableBody>{query.data.builtInRules.map((rule) => <TableRow key={rule.id}><TableCell className="font-mono">{rule.damagedText}</TableCell><TableCell>{rule.correctedText}</TableCell><TableCell><Badge variant="outline">Interna</Badge></TableCell><TableCell><Badge>Ativa</Badge></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>

      <Card><CardHeader><CardTitle>Exceções personalizadas</CardTitle></CardHeader><CardContent>{query.data.rules.length ? <Table><TableHeader><TableRow><TableHead>Texto corrompido</TableHead><TableHead>Substituir por</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{query.data.rules.map((rule) => <TableRow key={rule.id}><TableCell className="font-mono">{rule.damagedText}</TableCell><TableCell>{rule.correctedText}</TableCell><TableCell><Badge variant={rule.isActive ? "default" : "secondary"}>{rule.isActive ? "Ativa" : "Inativa"}</Badge></TableCell><TableCell><div className="flex justify-end gap-1">{canManage && <><Button variant="ghost" size="icon" onClick={() => openEdit(rule)} title="Editar"><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" onClick={() => confirmRemove(rule)} title="Excluir"><Trash2 className="size-4 text-destructive" /></Button></>}</div></TableCell></TableRow>)}</TableBody></Table> : <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma exceção personalizada cadastrada.</p>}</CardContent></Card>
    </>}

    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{editing ? "Editar exceção" : "Cadastrar exceção"}</DialogTitle><DialogDescription>Use este recurso apenas para termos que o motor não conseguir reconstruir com segurança.</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Texto corrompido</Label><Input value={form.damagedText} onChange={(event) => setForm((current) => ({ ...current, damagedText: event.target.value }))} placeholder="Ex.: ALVAR�ES" /></div><div className="space-y-2"><Label>Correção</Label><Input value={form.correctedText} onChange={(event) => setForm((current) => ({ ...current, correctedText: event.target.value }))} placeholder="Ex.: ALVARÃES" /></div></div><div className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">Exceção ativa</p><p className="text-xs text-muted-foreground">Exceções inativas permanecem salvas, mas não são aplicadas.</p></div><Switch checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} /></div><div className="space-y-2"><Label>Texto para teste</Label><Textarea rows={4} value={sample} onChange={(event) => setSample(event.target.value)} /><Button type="button" variant="outline" onClick={() => test.mutate()} disabled={!sample || test.isPending}><Play />Testar substituição</Button></div>{preview && <div className="rounded-lg border bg-muted/30 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resultado</p><p className="mt-2 whitespace-pre-wrap text-sm">{preview.correctedText}</p>{preview.unresolvedTokens.length > 0 && <p className="mt-3 text-xs text-amber-600">Ainda não reconhecidos: {preview.unresolvedTokens.join(", ")}</p>}</div>}</div><DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button><Button onClick={() => save.mutate()} disabled={!form.damagedText.trim() || !form.correctedText.trim() || save.isPending}><Save />Salvar exceção</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(reviewing)} onOpenChange={(open) => !open && setReviewing(null)}><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>Revisar descrição do item</DialogTitle><DialogDescription>{reviewing ? `${reviewing.ata.number} · Item ${reviewing.referenceCode}` : "Valide a descrição"}. O texto original continuará preservado.</DialogDescription></DialogHeader>{reviewing && <div className="space-y-4"><div className="rounded-lg border bg-muted/30 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Original recebido</p><p className="mt-2 text-sm leading-6">{reviewing.originalText}</p></div>{reviewing.decisions.filter((decision) => !decision.applied && decision.alternatives.length).map((decision, index) => <div key={`${decision.damagedText}-${index}`} className="rounded-lg border p-4"><p className="text-sm font-medium">Sugestões para <code>{decision.damagedText}</code></p><div className="mt-3 flex flex-wrap gap-2">{decision.alternatives.map((alternative) => <Button key={alternative} type="button" size="sm" variant="outline" onClick={() => useAlternative(decision, alternative)}>{alternative}</Button>)}</div></div>)}{learnRule && <Alert><BookOpenCheck /><AlertTitle>Aprendizado ativado</AlertTitle><AlertDescription>Ao aprovar, o SAGEP também salvará <code>{learnRule.damagedText}</code> → <code>{learnRule.correctedText}</code> como exceção para futuras importações. <Button type="button" variant="link" className="h-auto p-0" onClick={() => setLearnRule(null)}>Não aprender</Button></AlertDescription></Alert>}<div className="space-y-2"><Label>Descrição final validada</Label><Textarea rows={8} value={reviewText} onChange={(event) => setReviewText(event.target.value)} /></div></div>}<DialogFooter><Button variant="outline" onClick={() => setReviewing(null)}>Cancelar</Button><Button onClick={() => reviewItem.mutate()} disabled={reviewText.trim().length < 3 || reviewItem.isPending}><CheckCircle2 />Aprovar descrição</Button></DialogFooter></DialogContent></Dialog>
  </div>
}
