import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/80 before:absolute before:inset-0 before:-translate-x-full before:animate-[sagep-shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-foreground/[.055] before:to-transparent motion-reduce:before:animate-none",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
