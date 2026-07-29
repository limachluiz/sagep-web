import { describe, expect, it } from "vitest"

import { isTaskOverdue, taskStatusLabels } from "./tasks.constants"

describe("task constants", () => {
  it("traduz todos os estados operacionais", () => {
    expect(taskStatusLabels).toEqual({
      PENDENTE: "Pendente",
      EM_ANDAMENTO: "Em andamento",
      REVISAO: "Em revisão",
      CONCLUIDA: "Concluída",
      CANCELADA: "Cancelada",
    })
  })

  it("marca como atrasada apenas tarefa aberta com prazo vencido", () => {
    const now = new Date("2026-07-27T12:00:00-04:00")

    expect(isTaskOverdue({ dueDate: "2026-07-26", status: "EM_ANDAMENTO" }, now)).toBe(true)
    expect(isTaskOverdue({ dueDate: "2026-07-26", status: "CONCLUIDA" }, now)).toBe(false)
    expect(isTaskOverdue({ dueDate: "2026-07-28", status: "PENDENTE" }, now)).toBe(false)
    expect(isTaskOverdue({ dueDate: null, status: "PENDENTE" }, now)).toBe(false)
  })
})

