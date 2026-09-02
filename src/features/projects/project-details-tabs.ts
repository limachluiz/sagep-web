export type ProjectDetailsTab =
  | "overview"
  | "execution"
  | "tasks"
  | "documents"
  | "evidences"
  | "delivery"
  | "team"
  | "timeline"
  | "audit"

const projectDetailsTabs = new Set<ProjectDetailsTab>([
  "overview",
  "execution",
  "tasks",
  "documents",
  "evidences",
  "delivery",
  "team",
  "timeline",
  "audit",
])

export function resolveProjectDetailsTab(
  value: string | null,
  canViewTasks: boolean,
  canViewAudit = false,
): ProjectDetailsTab {
  if (!value || !projectDetailsTabs.has(value as ProjectDetailsTab)) return "overview"
  if (value === "tasks" && !canViewTasks) return "overview"
  if (value === "audit" && !canViewAudit) return "overview"
  return value as ProjectDetailsTab
}

export function searchParamsForProjectTab(
  current: URLSearchParams,
  tab: ProjectDetailsTab,
) {
  const next = new URLSearchParams(current)
  if (tab === "overview") next.delete("tab")
  else next.set("tab", tab)
  return next
}
