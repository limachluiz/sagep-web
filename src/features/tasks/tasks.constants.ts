import type { TaskStatus } from "./tasks.types"

export const taskStatusLabels: Record<TaskStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  REVISAO: "Em revisão",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
}

export const taskStatusVariants: Record<
  TaskStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDENTE: "outline",
  EM_ANDAMENTO: "default",
  REVISAO: "secondary",
  CONCLUIDA: "secondary",
  CANCELADA: "destructive",
}

export const taskPriorityLabels: Record<number, string> = {
  1: "Muito baixa",
  2: "Baixa",
  3: "Média",
  4: "Alta",
  5: "Crítica",
}

export function isTaskOverdue(task: { dueDate: string | null; status: TaskStatus }, now = new Date()) {
  if (!task.dueDate || task.status === "CONCLUIDA" || task.status === "CANCELADA") return false

  const due = new Date(task.dueDate)
  due.setHours(23, 59, 59, 999)
  return due.getTime() < now.getTime()
}

