import type { ProjectListItem } from "@/features/projects/projects.types"

export type ProjectSelectOption = Pick<ProjectListItem, "id" | "projectCode" | "title" | "om">

export function projectOptionLabel(project: ProjectSelectOption) {
  return `PRJ-${project.projectCode} · ${project.title}${project.om ? ` · ${project.om.sigla}` : ""}`
}
