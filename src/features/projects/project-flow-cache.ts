import type { QueryClient } from "@tanstack/react-query"

const projectFlowQueryKeys = [
  ["projects"],
  ["dashboard"],
  ["estimates"],
  ["diex"],
  ["service-orders"],
  ["service-orders-gantt"],
  ["atas"],
] as const

export function invalidateProjectFlow(queryClient: QueryClient) {
  return Promise.all(
    projectFlowQueryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  )
}
