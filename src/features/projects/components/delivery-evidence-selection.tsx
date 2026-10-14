import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { evidencesService } from "@/features/evidences/evidences.service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { invalidateProjectFlow } from "../project-flow-cache"

export function DeliveryEvidenceSelection({ projectId, canManage }: { projectId: string; canManage: boolean }) {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ["evidences", projectId], queryFn: () => evidencesService.list(projectId) })
  const update = useMutation({
    mutationFn: ({ id, includeInReport }: { id: string; includeInReport: boolean }) => evidencesService.update(id, { includeInReport }),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["evidences", projectId] }); await invalidateProjectFlow(client) },
    onError: (error) => toast.error(error.message),
  })
  return <section className="space-y-4"><h3 className="font-semibold">Evidências e anexos do projeto</h3><p className="text-sm text-muted-foreground">Selecione o material já registrado na aba Evidências. Imagens entram no corpo do documento e PDFs completos são incorporados ao final como anexos.</p>
    {query.isError ? <Alert variant="destructive"><AlertTitle>Não foi possível carregar o acervo</AlertTitle><AlertDescription>{query.error.message}</AlertDescription></Alert> : query.isLoading ? <p>Carregando evidências...</p> : !query.data?.length ? <p className="rounded-lg bg-muted/20 p-4">Em branco. Adicione os arquivos na aba Evidências do projeto.</p> : <div className="space-y-2">{query.data.map((item) => <label key={item.id} className="flex items-start gap-3 rounded-lg border p-4"><input type="checkbox" className="mt-1" checked={item.includeInReport} disabled={!canManage || update.isPending} onChange={(event) => update.mutate({ id: item.id, includeInReport: event.target.checked })} /><span className="min-w-0"><strong className="block">{item.title}</strong><span className="block break-words text-xs text-muted-foreground">{item.originalName}</span>{item.description && <span className="mt-1 block text-sm">{item.description}</span>}</span></label>)}</div>}
    <p className="text-xs text-muted-foreground">A seleção é salva automaticamente e exige nova emissão do documento antes da aprovação.</p>
  </section>
}
