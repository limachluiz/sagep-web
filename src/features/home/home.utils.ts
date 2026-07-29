import { isTaskOverdue } from "@/features/tasks/tasks.constants"
import type { Task } from "@/features/tasks/tasks.types"

const MANAUS_TIME_ZONE = "America/Manaus"

function getManausHour(date: Date) {
  return Number(
    new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: MANAUS_TIME_ZONE,
    }).format(date),
  )
}

export function getGreeting(date: Date) {
  const hour = getManausHour(date)
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

export function selectPendingTasks(tasks: Task[], limit = 5, now = new Date()) {
  return tasks
    .filter((task) => task.status !== "CONCLUIDA" && task.status !== "CANCELADA")
    .sort((left, right) => {
      const overdueDifference =
        Number(isTaskOverdue(right, now)) - Number(isTaskOverdue(left, now))
      if (overdueDifference !== 0) return overdueDifference

      const priorityDifference = right.priority - left.priority
      if (priorityDifference !== 0) return priorityDifference

      if (left.dueDate && right.dueDate) {
        const dueDateDifference =
          new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime()
        if (dueDateDifference !== 0) return dueDateDifference
      } else if (left.dueDate) {
        return -1
      } else if (right.dueDate) {
        return 1
      }

      return left.taskCode - right.taskCode
    })
    .slice(0, limit)
}
