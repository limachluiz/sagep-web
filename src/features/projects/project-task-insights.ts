import { isTaskOverdue } from "@/features/tasks/tasks.constants"
import type { ProjectTaskItem } from "./projects.types"

export function buildProjectTaskSummary(tasks: ProjectTaskItem[], now = new Date()) {
  const completed = tasks.filter((task) => task.status === "CONCLUIDA").length
  const cancelled = tasks.filter((task) => task.status === "CANCELADA").length

  return {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === "PENDENTE").length,
    inProgress: tasks.filter((task) => task.status === "EM_ANDAMENTO" || task.status === "REVISAO").length,
    overdue: tasks.filter((task) => isTaskOverdue(task, now)).length,
    completed,
    cancelled,
    completionPercent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
  }
}

export function getPriorityProjectTasks(tasks: ProjectTaskItem[], limit = 5, now = new Date()) {
  return tasks
    .filter((task) => !task.archivedAt && task.status !== "CONCLUIDA" && task.status !== "CANCELADA")
    .sort((left, right) => {
      const overdueDifference = Number(isTaskOverdue(right, now)) - Number(isTaskOverdue(left, now))
      if (overdueDifference) return overdueDifference
      if (right.priority !== left.priority) return right.priority - left.priority
      if (left.dueDate && right.dueDate) return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime()
      if (left.dueDate) return -1
      if (right.dueDate) return 1
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })
    .slice(0, limit)
}
