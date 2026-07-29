import { normalizeDisplayText } from "@/lib/display-text"
import { cn } from "@/lib/utils"

export function ItemDescription({ children, className }: { children: string | null | undefined; className?: string }) {
  const description = normalizeDisplayText(children)
  return <p className={cn("min-w-0 whitespace-normal break-words leading-relaxed [overflow-wrap:anywhere]", className)} title={description}>{description || "Sem descrição"}</p>
}
