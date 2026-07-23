import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-sm border border-input bg-background/55 px-3 py-2 text-base shadow-[inset_0_1px_0_rgba(255,255,255,.02)] transition-[border-color,box-shadow,background-color] outline-none placeholder:text-muted-foreground/70 hover:border-primary/20 focus-visible:border-ring focus-visible:bg-background/75 focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
