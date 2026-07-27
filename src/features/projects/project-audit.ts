import type { ProjectAuditItem } from "@/features/projects/projects.types"

export type ProjectAuditChange = {
  field: string
  before: unknown
  after: unknown
}

export function projectAuditChanges(item: ProjectAuditItem): ProjectAuditChange[] {
  const before = item.before ?? {}
  const after = item.after ?? {}
  const fields = new Set([...Object.keys(before), ...Object.keys(after)])

  return Array.from(fields)
    .filter((field) => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
    .sort((left, right) => left.localeCompare(right))
    .map((field) => ({
      field,
      before: before[field],
      after: after[field],
    }))
}
