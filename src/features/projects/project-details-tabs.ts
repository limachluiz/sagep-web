export type ProjectDetailsTab = "overview" | "tasks" | "documents" | "timeline"

const projectDetailsTabs = new Set<ProjectDetailsTab>([
  "overview",
  "tasks",
  "documents",
  "timeline",
])

export function resolveProjectDetailsTab(
  value: string | null,
  canViewTasks: boolean,
): ProjectDetailsTab {
  if (!value || !projectDetailsTabs.has(value as ProjectDetailsTab)) return "overview"
  if (value === "tasks" && !canViewTasks) return "overview"
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
