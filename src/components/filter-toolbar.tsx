import { Search, SlidersHorizontal } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type FilterToolbarProps = {
  children: React.ReactNode
  className?: string
}

function FilterToolbar({ children, className }: FilterToolbarProps) {
  return (
    <Card className="border-primary/10 bg-card/80 shadow-sm">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 border-b border-primary/10 px-4 py-3 text-xs font-medium tracking-wide text-muted-foreground sm:px-5">
          <SlidersHorizontal className="size-3.5 text-primary" aria-hidden="true" />
          Filtros da consulta
        </div>
        <div className={cn("grid gap-3 p-4 sm:p-5 md:grid-cols-2", className)}>{children}</div>
      </CardContent>
    </Card>
  )
}

type SearchFieldProps = Omit<React.ComponentProps<typeof Input>, "type"> & {
  containerClassName?: string
}

function SearchField({ className, containerClassName, ...props }: SearchFieldProps) {
  return (
    <div className={cn("relative", containerClassName)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input type="search" className={cn("pl-9", className)} {...props} />
    </div>
  )
}

export { FilterToolbar, SearchField }
