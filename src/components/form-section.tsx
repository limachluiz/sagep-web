import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type FormSectionProps = {
  icon?: LucideIcon
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

function FormSection({ icon: Icon, title, description, children, className }: FormSectionProps) {
  return (
    <fieldset className={cn("space-y-4 rounded-lg border border-primary/10 bg-muted/10 p-4", className)}>
      <legend className="sr-only">{title}</legend>
      <div className="flex items-start gap-3 border-b border-primary/10 pb-3">
        {Icon && (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
        <div>
          <h3 className="font-heading text-sm font-semibold tracking-wide">{title}</h3>
          {description && <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </fieldset>
  )
}

export { FormSection }
