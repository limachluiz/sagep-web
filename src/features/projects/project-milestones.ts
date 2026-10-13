export function visibleProjectMilestones(milestones: Record<string, string | null>) {
  return Object.entries(milestones).filter(([key, value]) => {
    if (key === "asBuiltRejectionReason") return Boolean(value)
    return true
  })
}

export function projectMilestonePresentation(
  key: string,
  value: string | null,
  milestones: Record<string, string | null>,
) {
  if (key === "asBuiltRejectedAt" && !value && milestones.asBuiltApprovedAt) {
    return { completed: true, value: "As-Built não foi reprovado", isDate: false }
  }

  return { completed: Boolean(value), value, isDate: key.endsWith("At") }
}
