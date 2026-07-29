import { describe, expect, it } from "vitest"

import type { ProjectTaskItem } from "./projects.types"
import { buildProjectTaskSummary, getPriorityProjectTasks } from "./project-task-insights"

function task(overrides: Partial<ProjectTaskItem>): ProjectTaskItem {
  return {
    id: "task-1",
    taskCode: 1,
    title: "Tarefa",
    status: "PENDENTE",
    priority: 3,
    dueDate: null,
    archivedAt: null,
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
    assignee: null,
    ...overrides,
  }
}

describe("project task insights", () => {
  const now = new Date("2026-07-27T12:00:00.000Z")

  it("resume todos os estados e o progresso do projeto", () => {
    const summary = buildProjectTaskSummary([
      task({ id: "pending", dueDate: "2026-07-26T00:00:00.000Z" }),
      task({ id: "doing", status: "EM_ANDAMENTO" }),
      task({ id: "review", status: "REVISAO" }),
      task({ id: "done", status: "CONCLUIDA" }),
      task({ id: "cancelled", status: "CANCELADA" }),
    ], now)

    expect(summary).toEqual({
      total: 5,
      pending: 1,
      inProgress: 2,
      overdue: 1,
      completed: 1,
      cancelled: 1,
      completionPercent: 20,
    })
  })

  it("prioriza atrasadas e críticas e ignora tarefas encerradas", () => {
    const prioritized = getPriorityProjectTasks([
      task({ id: "normal", taskCode: 1, priority: 3 }),
      task({ id: "critical", taskCode: 2, priority: 5 }),
      task({ id: "overdue", taskCode: 3, priority: 2, dueDate: "2026-07-26T00:00:00.000Z" }),
      task({ id: "done", taskCode: 4, status: "CONCLUIDA", priority: 5 }),
    ], 5, now)

    expect(prioritized.map((item) => item.id)).toEqual(["overdue", "critical", "normal"])
  })
})
