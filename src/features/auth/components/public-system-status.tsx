import { useQuery } from "@tanstack/react-query"

import { systemHealthService } from "@/features/system-health/system-health.service"
import type { HealthStatus } from "@/features/system-health/system-health.types"

type PublicStatus = Extract<HealthStatus, "operational" | "degraded" | "unavailable"> | "checking"

const statusPresentation: Record<PublicStatus, {
  label: string
  containerClass: string
  lightContainerClass: string
  indicatorClass: string
}> = {
  checking: {
    label: "Verificando sistema…",
    containerClass: "border-white/15 text-[#b8b8ae]",
    lightContainerClass: "border-transparent text-[#68736c]",
    indicatorClass: "bg-[#9ca09a] shadow-[0_0_10px_#9ca09a]",
  },
  operational: {
    label: "Sistema operacional",
    containerClass: "border-[#5f9f78]/30 text-[#8ed0a4]",
    lightContainerClass: "border-transparent text-[#315c47]",
    indicatorClass: "bg-[#69c38a] shadow-[0_0_12px_#69c38a]",
  },
  degraded: {
    label: "Sistema instável",
    containerClass: "border-[#c7973b]/30 text-[#e3bd64]",
    lightContainerClass: "border-transparent text-[#8b6a24]",
    indicatorClass: "bg-[#e7b64b] shadow-[0_0_12px_#e7b64b]",
  },
  unavailable: {
    label: "Sistema indisponível",
    containerClass: "border-[#b95555]/35 text-[#ed8d8d]",
    lightContainerClass: "border-transparent text-[#a54242]",
    indicatorClass: "bg-[#df6262] shadow-[0_0_12px_#df6262]",
  },
}

export function PublicSystemStatus({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const healthQuery = useQuery({
    queryKey: ["public-system-health"],
    queryFn: () => systemHealthService.getStatus(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    retry: false,
  })

  const status: PublicStatus = healthQuery.isPending
    ? "checking"
    : healthQuery.isError
      ? "unavailable"
      : healthQuery.data.snapshot.status
  const presentation = statusPresentation[status]

  return (
    <div
      className={`flex items-center gap-2 border ${
        variant === "light"
          ? `px-0 py-2 text-sm font-medium normal-case tracking-normal ${presentation.lightContainerClass}`
          : `rounded-md bg-[#07120f]/70 px-3 py-2 text-[8px] font-semibold uppercase tracking-[.16em] backdrop-blur-md sm:px-4 sm:text-[9px] sm:tracking-[.2em] ${presentation.containerClass}`
      }`}
      role="status"
      aria-live="polite"
      aria-label={presentation.label}
    >
      <span className={`size-2 shrink-0 rounded-full ${presentation.indicatorClass}`} aria-hidden="true" />
      {presentation.label}
    </div>
  )
}
