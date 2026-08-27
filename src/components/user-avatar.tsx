import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type UserAvatarProps = {
  user: {
    name?: string | null
    email?: string | null
    avatarDataUrl?: string | null
  }
  className?: string
  fallbackClassName?: string
}

function initials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "Usuário"
  const parts = source.split(/\s+/).filter(Boolean)
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}` : source.slice(0, 2)).toUpperCase()
}

export function UserAvatar({ user, className, fallbackClassName }: UserAvatarProps) {
  const label = user.name?.trim() || user.email || "Usuário"
  return (
    <Avatar className={cn("shrink-0", className)} title={label}>
      {user.avatarDataUrl && <AvatarImage src={user.avatarDataUrl} alt={`Foto de ${label}`} />}
      <AvatarFallback className={cn("bg-primary/10 text-xs font-semibold text-primary", fallbackClassName)}>
        {initials(user.name, user.email)}
      </AvatarFallback>
    </Avatar>
  )
}
