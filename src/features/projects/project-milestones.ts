export function visibleProjectMilestones(milestones: Record<string, string | null>) {
  return Object.entries(milestones).filter(([key, value]) => {
    if (key === "asBuiltRejectedAt" || key === "asBuiltRejectionReason") return Boolean(value)
    return true
  })
}
