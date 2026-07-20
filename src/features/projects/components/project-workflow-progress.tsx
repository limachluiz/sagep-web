import type { ReactNode } from "react"
import { AlertTriangle, Check, Circle, Route } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { ProjectStage } from "@/features/dashboard/dashboard.types"
import { getWorkflowProgress, orderedWorkflowStages } from "@/features/projects/project-workflow"
import type { ProjectStatus } from "@/features/projects/projects.types"

type Props = {
  stage: ProjectStage
  status: ProjectStatus
  stageLabel: string
  nextAction: { label: string; description: string }
  action?: ReactNode
  archived?: boolean
}

export function ProjectWorkflowProgress({ stage, status, stageLabel, nextAction, action, archived }: Props) {
  const currentIndex = orderedWorkflowStages.findIndex((item) => item.stage === stage)
  const cancelled = status === "CANCELADO" || stage === "CANCELADO"
  const progress = getWorkflowProgress(stage, status)

  return (
    <Card className="overflow-hidden border-none shadow-sm">
      <CardContent className="p-0">
        <div className="border-b bg-muted/30 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">Progresso do projeto</p>
                <Badge variant={cancelled ? "destructive" : "outline"}>{cancelled ? "Fluxo cancelado" : `${progress}% concluído`}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Etapa atual: {stageLabel}</p>
            </div>
            {!cancelled && <span className="text-xs text-muted-foreground">{Math.max(currentIndex + 1, 1)} de {orderedWorkflowStages.length} etapas</span>}
          </div>
          {!cancelled && <Progress className="mt-4 h-2" value={progress} aria-label={`Progresso do projeto: ${progress}%`} />}
        </div>

        {cancelled ? (
          <div className="flex items-start gap-3 p-5 sm:p-6"><AlertTriangle className="mt-0.5 size-5 text-destructive" /><div><p className="font-medium">Projeto cancelado</p><p className="mt-1 text-sm text-muted-foreground">O workflow operacional foi encerrado para este projeto.</p></div></div>
        ) : (
          <div className="overflow-x-auto px-5 pt-5 sm:px-6" tabIndex={0} aria-label="Etapas do workflow">
            <ol className="grid min-w-[940px] grid-cols-9" aria-label="Progresso das etapas">
              {orderedWorkflowStages.map((item, index) => {
                const completed = index < currentIndex || status === "CONCLUIDO"
                const current = index === currentIndex && status !== "CONCLUIDO"
                return (
                  <li key={item.stage} className="relative flex flex-col items-center px-1 text-center" aria-current={current ? "step" : undefined}>
                    {index > 0 && <span className={`absolute right-1/2 top-3.5 h-0.5 w-full ${completed || current ? "bg-primary" : "bg-border"}`} aria-hidden="true" />}
                    <span className={`relative z-10 flex size-7 items-center justify-center rounded-full border-2 bg-background ${completed ? "border-primary bg-primary text-primary-foreground" : current ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                      {completed ? <Check className="size-4" /> : current ? <Route className="size-3.5" /> : <Circle className="size-2.5" />}
                    </span>
                    <span className={`mt-2 text-xs ${current ? "font-semibold text-foreground" : completed ? "font-medium text-primary" : "text-muted-foreground"}`}>{item.shortLabel}</span>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {!cancelled && (
          <div className="m-5 flex flex-col justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:m-6 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Route className="size-4" /></div>
              <div><p className="text-xs font-medium uppercase tracking-wide text-primary">Próxima ação</p><p className="mt-1 font-semibold">{nextAction.label}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{nextAction.description}</p>{archived && <p className="mt-2 text-xs text-amber-700">Projeto arquivado: as ações operacionais estão bloqueadas.</p>}</div>
            </div>
            {action && <div className="shrink-0 sm:self-center">{action}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
