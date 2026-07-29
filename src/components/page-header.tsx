import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"

type PageHeaderProps = {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  actions?: ReactNode
  meta?: ReactNode
}

function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  meta,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
      <div className="max-w-3xl">
        <Badge className="mb-3">{eyebrow}</Badge>
        <div className="flex items-start gap-3 sm:items-center">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary shadow-sm sm:size-10">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        {meta && <div className="mt-2 text-xs text-muted-foreground">{meta}</div>}
      </div>
      {actions && (
        <div className="flex w-full shrink-0 flex-col gap-2 *:w-full sm:w-auto sm:flex-row sm:flex-wrap sm:*:w-auto">
          {actions}
        </div>
      )}
    </header>
  )
}

export { PageHeader }
