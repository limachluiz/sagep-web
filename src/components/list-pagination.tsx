import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type ListPaginationProps = {
  page: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  onPrevious: () => void
  onNext: () => void
  pageSize?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
  itemLabel?: string
  className?: string
}

function ListPagination({
  page,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPrevious,
  onNext,
  pageSize,
  pageSizeOptions = [10, 25, 50],
  onPageSizeChange,
  itemLabel = "itens",
  className,
}: ListPaginationProps) {
  return (
    <nav
      className={cn(
        "mt-6 flex flex-col gap-4 border-t border-primary/10 pt-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      aria-label="Paginação"
    >
      {pageSize && onPageSizeChange ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Exibir</span>
          <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="w-20" aria-label={`${itemLabel} por página`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>por página</span>
        </div>
      ) : <span />}

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="text-sm tabular-nums text-muted-foreground">
          Página <strong className="font-medium text-foreground">{page}</strong> de {totalPages}
        </span>
        <div className="flex gap-1.5">
          <Button variant="outline" size="icon" disabled={!hasPreviousPage} onClick={onPrevious} aria-label="Página anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" disabled={!hasNextPage} onClick={onNext} aria-label="Próxima página">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </nav>
  )
}

export { ListPagination }
