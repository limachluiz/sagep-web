import { describe, expect, it } from "vitest"

import {
  resolveProjectDetailsTab,
  searchParamsForProjectTab,
} from "@/features/projects/project-details-tabs"

describe("abas dos detalhes do projeto", () => {
  it("resolve abas válidas e protege a aba de tarefas por permissão", () => {
    expect(resolveProjectDetailsTab("documents", true)).toBe("documents")
    expect(resolveProjectDetailsTab("tasks", true)).toBe("tasks")
    expect(resolveProjectDetailsTab("tasks", false)).toBe("overview")
    expect(resolveProjectDetailsTab("unknown", true)).toBe("overview")
  })

  it("persiste a aba na URL sem remover outros parâmetros", () => {
    const archived = new URLSearchParams("includeArchived=true")
    const tasks = searchParamsForProjectTab(archived, "tasks")

    expect(tasks.get("tab")).toBe("tasks")
    expect(tasks.get("includeArchived")).toBe("true")

    const overview = searchParamsForProjectTab(tasks, "overview")
    expect(overview.has("tab")).toBe(false)
    expect(overview.get("includeArchived")).toBe("true")
  })
})
