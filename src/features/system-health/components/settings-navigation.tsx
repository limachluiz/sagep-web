import { Activity, Settings2, ShieldCheck } from "lucide-react"
import { NavLink } from "react-router"

import { useAuthStore } from "@/features/auth/auth.store"
import { cn } from "@/lib/utils"

export function SettingsNavigation() {
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const items = [
    { label: "Saúde do sistema", href: "/settings", icon: Activity, visible: true },
    { label: "Integrações e parâmetros", href: "/settings/integrations", icon: Settings2, visible: hasPermission("settings.view") },
    { label: "Acessos e permissões", href: "/settings/access", icon: ShieldCheck, visible: hasPermission("permissions.view") },
  ].filter((item) => item.visible)

  return (
    <nav className="flex max-w-full gap-1 overflow-x-auto rounded-lg border bg-muted/35 p-1" aria-label="Seções de configurações">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === "/settings"}
            className={({ isActive }) => cn(
              "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />{item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
