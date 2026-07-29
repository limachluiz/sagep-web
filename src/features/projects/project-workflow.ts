import type { ProjectStage } from "@/features/dashboard/dashboard.types"
import type { ProjectStatus } from "@/features/projects/projects.types"

export const orderedWorkflowStages: Array<{ stage: ProjectStage; shortLabel: string }> = [
  { stage: "ESTIMATIVA_PRECO", shortLabel: "Estimativa" },
  { stage: "AGUARDANDO_NOTA_CREDITO", shortLabel: "Nota de Crédito" },
  { stage: "DIEX_REQUISITORIO", shortLabel: "DIEx" },
  { stage: "AGUARDANDO_NOTA_EMPENHO", shortLabel: "Empenho" },
  { stage: "OS_LIBERADA", shortLabel: "OS" },
  { stage: "AGUARDANDO_OS_ASSINADA", shortLabel: "Assinatura" },
  { stage: "AGUARDANDO_INICIO_EXECUCAO", shortLabel: "Início" },
  { stage: "SERVICO_EM_EXECUCAO", shortLabel: "Execução" },
  { stage: "ANALISANDO_AS_BUILT", shortLabel: "As-Built" },
  { stage: "ATESTAR_NF", shortLabel: "Atesto NF" },
  { stage: "SERVICO_CONCLUIDO", shortLabel: "Concluído" },
]

export function getWorkflowProgress(stage: ProjectStage, status: ProjectStatus) {
  if (status === "CANCELADO" || stage === "CANCELADO") return 0
  const currentIndex = orderedWorkflowStages.findIndex((item) => item.stage === stage)
  if (currentIndex < 0) return 0
  if (status === "CONCLUIDO") return 100
  return Math.round((currentIndex / (orderedWorkflowStages.length - 1)) * 100)
}
