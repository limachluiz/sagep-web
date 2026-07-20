import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Loader2, Play } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { projectsService } from "@/features/projects/projects.service"

type Props = { projectId: string; projectCode: number; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void }
function today() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10) }

export function StartExecutionDialog({ projectId, projectCode, open, onOpenChange, onSaved }: Props) {
  const [startedAt, setStartedAt] = useState(today)
  const mutation = useMutation({ mutationFn: () => projectsService.updateFlow(projectId, { stage: "SERVICO_EM_EXECUCAO", executionStartedAt: startedAt }), onSuccess: () => { toast.success(`Execução do projeto PRJ-${projectCode} iniciada.`); onSaved(); onOpenChange(false) }, onError: (error) => toast.error(error.message) })
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><Play className="size-5 text-primary" />Iniciar execução</DialogTitle><DialogDescription>Registre o início efetivo dos serviços. O projeto avançará para Serviço em execução e o Gantt será atualizado.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="execution-started-at">Data de início da execução</Label><Input id="execution-started-at" type="date" value={startedAt} onChange={(event) => setStartedAt(event.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button><Button onClick={() => mutation.mutate()} disabled={!startedAt || mutation.isPending}>{mutation.isPending && <Loader2 className="size-4 animate-spin" />}Confirmar início</Button></DialogFooter></DialogContent></Dialog>
}
