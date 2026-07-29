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
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        {meta && <div className="mt-2 text-xs text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-col gap-2 sm:flex-row">{actions}</div>}
    </header>
  )
}

export { PageHeader }
