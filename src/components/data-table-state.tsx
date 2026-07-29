import type { LucideIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type DataTableSkeletonProps = {
  rows?: number
  className?: string
}

function DataTableSkeleton({ rows = 6, className }: DataTableSkeletonProps) {
  return (
    <div className={cn("space-y-2.5", className)} aria-label="Carregando dados" aria-busy="true">
      <div className="hidden grid-cols-[1.4fr_repeat(4,1fr)_5rem] gap-4 border-b px-3 pb-3 md:grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-3/4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-4 rounded-md border border-border/55 bg-card/45 px-4 py-3 md:grid-cols-[1.4fr_repeat(4,1fr)_5rem]"
        >
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          {Array.from({ length: 5 }).map((__, cellIndex) => (
            <Skeleton key={cellIndex} className="hidden h-4 w-2/3 md:block" />
          ))}
          <Skeleton className="h-8 w-16 md:hidden" />
        </div>
      ))}
    </div>
  )
}

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-primary/20 bg-muted/15 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full border border-primary/15 bg-primary/[.07] text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="mt-4 font-heading text-base font-semibold tracking-wide">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export { DataTableSkeleton, EmptyState }
