import { describe, expect, it } from "vitest"

import type { Task } from "@/features/tasks/tasks.types"

import { getGreeting, selectPendingTasks } from "../home.utils"

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    taskCode: 1,
    title: "Tarefa de teste",
    description: null,
    status: "PENDENTE",
    priority: 3,
    projectId: "project-1",
    assigneeId: "user-1",
    dueDate: null,
    archivedAt: null,
    deletedAt: null,
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-07-01T12:00:00.000Z",
    project: {
      id: "project-1",
      projectCode: 1,
      title: "Projeto de teste",
      status: "EM_ANDAMENTO",
    },
    assignee: {
      id: "user-1",
      userCode: 1,
      name: "Usuário",
      email: "usuario@sagep.test",
      role: "PROJETISTA",
    },
    ...overrides,
  }
}

describe("página inicial", () => {
  it("altera a saudação conforme o horário de Manaus", () => {
    expect(getGreeting(new Date("2026-07-29T15:59:00.000Z"))).toBe("Bom dia")
    expect(getGreeting(new Date("2026-07-29T16:00:00.000Z"))).toBe("Boa tarde")
    expect(getGreeting(new Date("2026-07-29T22:00:00.000Z"))).toBe("Boa noite")
  })

  it("mantém somente tarefas abertas e prioriza atrasos e criticidade", () => {
    const now = new Date("2026-07-29T16:00:00.000Z")
    const selected = selectPendingTasks(
      [
        task({ id: "completed", taskCode: 5, status: "CONCLUIDA", priority: 5 }),
        task({
          id: "future-critical",
          taskCode: 4,
          priority: 5,
          dueDate: "2026-08-10T12:00:00.000Z",
        }),
        task({
          id: "overdue-medium",
          taskCode: 3,
          priority: 3,
          dueDate: "2026-07-20T12:00:00.000Z",
        }),
        task({
          id: "overdue-critical",
          taskCode: 2,
          priority: 5,
          dueDate: "2026-07-25T12:00:00.000Z",
        }),
      ],
      5,
      now,
    )

    expect(selected.map((item) => item.id)).toEqual([
      "overdue-critical",
      "overdue-medium",
      "future-critical",
    ])
  })
})
