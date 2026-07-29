import { describe, expect, it } from "vitest"

import {
  resolveProjectDetailsTab,
  searchParamsForProjectTab,
} from "@/features/projects/project-details-tabs"

describe("abas dos detalhes do projeto", () => {
  it("resolve abas válidas e protege tarefas e auditoria por permissão", () => {
    expect(resolveProjectDetailsTab("documents", true, false)).toBe("documents")
    expect(resolveProjectDetailsTab("execution", true, false)).toBe("execution")
    expect(resolveProjectDetailsTab("team", true, false)).toBe("team")
    expect(resolveProjectDetailsTab("tasks", true, false)).toBe("tasks")
    expect(resolveProjectDetailsTab("tasks", false, false)).toBe("overview")
    expect(resolveProjectDetailsTab("audit", true, false)).toBe("overview")
    expect(resolveProjectDetailsTab("audit", true, true)).toBe("audit")
    expect(resolveProjectDetailsTab("unknown", true, true)).toBe("overview")
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
