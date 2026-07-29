import { History, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { projectAuditChanges } from "@/features/projects/project-audit"
import type { ProjectAuditItem } from "@/features/projects/projects.types"

const actionLabels: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
  ARCHIVE: "Arquivamento",
  RESTORE: "Restauração",
  STATUS_CHANGE: "Mudança de status",
  STAGE_CHANGE: "Mudança de etapa",
  ISSUE: "Emissão",
  FINALIZE: "Finalização",
  CANCEL: "Cancelamento",
}

const entityLabels: Record<string, string> = {
  PROJECT: "Projeto",
  TASK: "Tarefa",
  ESTIMATE: "Estimativa",
  DIEX_REQUEST: "DIEx",
  SERVICE_ORDER: "Ordem de Serviço",
}

const fieldLabels: Record<string, string> = {
  title: "Título",
  description: "Descrição",
  projectType: "Tipo do projeto",
  omId: "Organização Militar",
  ownerId: "Responsável",
  status: "Status",
  stage: "Etapa",
  startDate: "Data inicial",
  endDate: "Data final",
  documentStatus: "Situação documental",
  totalAmount: "Valor total",
  assigneeId: "Responsável pela tarefa",
  dueDate: "Prazo",
  priority: "Prioridade",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Não informado"
  if (typeof value === "boolean") return value ? "Sim" : "Não"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function resourceLabel(item: ProjectAuditItem) {
  const code = item.context?.resourceCode
  const label = item.context?.resourceLabel
  if (typeof code === "string" && typeof label === "string") return `${code} · ${label}`
  if (typeof code === "string") return code
  return entityLabels[item.entityType] ?? item.entityType
}

export function ProjectAuditPanel({
  items,
}: {
  items: ProjectAuditItem[]
}) {
  const orderedItems = [...items].reverse()

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            Auditoria técnica
          </CardTitle>
          <Badge variant="outline">{items.length} registro(s)</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Alterações técnicas do projeto e dos recursos vinculados. Visível somente para perfis autorizados.
        </p>
      </CardHeader>
      <CardContent>
        {orderedItems.length ? (
          <div className="space-y-3">
            {orderedItems.map((item) => {
              const changes = projectAuditChanges(item)
              return (
                <details key={item.id} className="group rounded-xl border">
                  <summary className="flex cursor-pointer list-none flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <History className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">{item.summary || item.label}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {resourceLabel(item)} · {item.actorName ?? "Sistema"} · {formatDate(item.at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary">{entityLabels[item.entityType] ?? item.entityType}</Badge>
                      <Badge variant="outline">{actionLabels[item.action] ?? item.action}</Badge>
                    </div>
                  </summary>

                  <div className="border-t px-4 py-4">
                    {changes.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b text-xs text-muted-foreground">
                              <th className="pb-2 pr-4 font-medium">Campo</th>
                              <th className="pb-2 pr-4 font-medium">Antes</th>
                              <th className="pb-2 font-medium">Depois</th>
                            </tr>
                          </thead>
                          <tbody>
                            {changes.map((change) => (
                              <tr key={change.field} className="border-b last:border-0">
                                <td className="py-3 pr-4 font-medium">{fieldLabels[change.field] ?? change.field}</td>
                                <td className="max-w-xs break-words py-3 pr-4 text-muted-foreground">{formatValue(change.before)}</td>
                                <td className="max-w-xs break-words py-3">{formatValue(change.after)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Registro operacional sem alteração de campos comparáveis.
                      </p>
                    )}
                  </div>
                </details>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 text-center">
            <ShieldCheck className="size-10 text-muted-foreground" />
            <p className="mt-3 font-medium">Nenhum registro de auditoria</p>
            <p className="mt-1 text-sm text-muted-foreground">As próximas alterações aparecerão aqui.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
