import { NavLink, Outlet, useNavigate } from "react-router"
import {
  Building2,
  CalendarRange,
  ChartNoAxesCombined,
  Columns3,
  ClipboardList,
  FileText,
  Files,
  Gauge,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorSmartphone,
  FileChartColumn,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuthStore } from "@/features/auth/auth.store"
import { authService } from "@/features/auth/auth.service"
import type { Permission } from "@/features/auth/auth.types"
import { GlobalSearchDialog } from "@/features/header/components/global-search-dialog"
import { NotificationsMenu } from "@/features/header/components/notifications-menu"

type NavigationItem = {
  label: string
  href: string
  icon: typeof LayoutDashboard
  anyOf: Permission[]
}

type NavigationGroup = {
  label: string
  items: NavigationItem[]
}

const navigation: NavigationGroup[] = [
  { label: "Principal", items: [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    anyOf: ["dashboard.view_operational"],
  },
  {
    label: "Dashboard Executivo",
    href: "/dashboard/executive",
    icon: ChartNoAxesCombined,
    anyOf: ["dashboard.view_executive"],
  },
  ]},
  { label: "Projetos", items: [
  {
    label: "Projetos",
    href: "/projects",
    icon: ClipboardList,
    anyOf: ["projects.view_all", "projects.edit_own"],
  },
  {
    label: "Kanban",
    href: "/kanban",
    icon: Columns3,
    anyOf: ["projects.view_all", "projects.edit_own"],
  },
  {
    label: "Gantt",
    href: "/gantt",
    icon: CalendarRange,
    anyOf: ["projects.view_all", "projects.edit_own"],
  },
  ]},
  { label: "Documentos", items: [
  {
    label: "Estimativas",
    href: "/estimates",
    icon: FileText,
    anyOf: ["estimates.view_all", "estimates.create", "estimates.edit"],
  },
  { label: "DIEx", href: "/diex", icon: Landmark, anyOf: ["diex.issue", "estimates.view_all"] },
  {
    label: "Ordens de Serviço",
    href: "/service-orders",
    icon: ShieldCheck,
    anyOf: ["service_orders.issue", "projects.view_all"],
  },
  ]},
  { label: "Catálogo e saldo", items: [
  {
    label: "ATAs e Saldos",
    href: "/atas",
    icon: Files,
    anyOf: ["atas.manage"],
  },
  {
    label: "Organizações Militares",
    href: "/military-organizations",
    icon: Building2,
    anyOf: ["military_organizations.manage"],
  },
  ]},
  { label: "Administração", items: [
  {
    label: "Usuários",
    href: "/users",
    icon: Users,
    anyOf: ["users.manage"],
  },
  {
    label: "Sessões",
    href: "/sessions",
    icon: MonitorSmartphone,
    anyOf: ["sessions.manage_own"],
  },
  {
    label: "Relatórios",
    href: "/reports",
    icon: FileChartColumn,
    anyOf: ["reports.export"],
  },
  {
    label: "Configurações",
    href: "/settings",
    icon: Settings,
    anyOf: ["permissions.view"],
  },
  ]},
]

function getInitials(nameOrEmail?: string) {
  if (!nameOrEmail) return "US"

  const cleanValue = nameOrEmail.trim()

  if (!cleanValue) return "US"

  const namePart = cleanValue.includes("@")
    ? cleanValue.split("@")[0]
    : cleanValue

  const parts = namePart
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)

  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function AuthenticatedLayout() {
  const navigate = useNavigate()
  const { user, refreshToken, logout, hasAnyPermission } = useAuthStore()

  const userDisplayName = user?.name ?? user?.email ?? "Usuário"
  const userRole = user?.role ?? "USUÁRIO"
  const initials = getInitials(userDisplayName)

  const visibleNavigation = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAnyPermission(item.anyOf)),
    }))
    .filter((group) => group.items.length > 0)

  const handleLogout = async () => {
    const tokenToRevoke = refreshToken
    logout()
    navigate("/login", { replace: true })

    if (tokenToRevoke) {
      await authService.logout(tokenToRevoke).catch(() => undefined)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="sr-only fixed left-4 top-4 z-[70] rounded-sm bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only">Pular para o conteúdo</a>

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center border-b border-primary/10 bg-[#09100d]/95 text-foreground shadow-[0_1px_30px_rgba(0,0,0,.35)] backdrop-blur-xl">
        <div className="hidden h-full w-[248px] shrink-0 items-center gap-3 border-r border-primary/10 px-5 lg:flex">
          <div className="flex size-9 items-center justify-center rounded-sm border border-primary/25 bg-primary/10 text-primary shadow-[0_0_22px_rgba(57,255,136,.08)]">
            <Gauge className="size-5" />
          </div>
          <div>
            <p className="font-heading text-lg font-extrabold tracking-[0.2em] text-primary">SAGEP<span className="animate-pulse">_</span></p>
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">4º CTA · Project Control</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 px-3 sm:px-4 lg:px-6">
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white lg:hidden" aria-label="Abrir menu principal"><Menu className="size-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-[min(88vw,320px)] gap-0 border-primary/15 bg-[#09100d] p-0 text-foreground">
              <SheetHeader className="border-b border-primary/10 px-5 py-5"><SheetTitle className="flex items-center gap-3 text-foreground"><span className="flex size-10 items-center justify-center rounded-sm border border-primary/25 bg-primary/10 text-primary"><Gauge className="size-5" /></span><span><span className="block font-heading text-lg tracking-[0.2em] text-primary">SAGEP_</span><span className="block text-[10px] font-normal uppercase tracking-wider text-muted-foreground">4º CTA · Project Control</span></span></SheetTitle></SheetHeader>
              <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4" aria-label="Navegação móvel">
                {visibleNavigation.map((group) => <div key={group.label}><p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-primary/45">{group.label}</p>{group.items.map((item) => { const Icon = item.icon; return <SheetClose asChild key={item.href}><NavLink to={item.href} end={item.href === "/dashboard"} className={({ isActive }) => ["flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition", isActive ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:bg-white/[.035] hover:text-foreground"].join(" ")}><Icon className="size-4" />{item.label}</NavLink></SheetClose> })}</div>)}
              </nav>
              <div className="border-t border-primary/10 p-4"><div className="flex items-center gap-3"><Avatar><AvatarFallback className="border border-primary/25 bg-primary/10 text-primary">{initials}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{userDisplayName}</p><p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">{userRole}</p></div><Button size="icon" variant="ghost" className="text-muted-foreground hover:bg-primary/10 hover:text-primary" onClick={handleLogout} aria-label="Sair"><LogOut className="size-4" /></Button></div></div>
            </SheetContent>
          </Sheet>

          <div className="mr-auto lg:hidden">
            <p className="font-heading text-base font-extrabold tracking-[0.18em] text-primary">SAGEP_</p>
          </div>

          <div className="md:hidden"><GlobalSearchDialog compact /></div>
          <div className="hidden max-w-md flex-1 md:block">
            <GlobalSearchDialog />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="hidden rounded-sm border-primary/20 bg-primary/5 font-mono text-[10px] tracking-wider text-primary md:inline-flex">
              UASG 160016
            </Badge>
            <NotificationsMenu />
            <div className="hidden text-right sm:block"><p className="max-w-40 truncate text-xs font-medium text-foreground">{userDisplayName}</p><p className="text-[9px] uppercase tracking-wider text-muted-foreground">{userRole}</p></div>
            <Avatar className="size-9"><AvatarFallback className="border border-primary/25 bg-primary/10 text-xs font-bold text-primary">{initials}</AvatarFallback></Avatar>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-[248px] border-r border-primary/10 bg-[#09100d] text-foreground lg:flex lg:flex-col">
        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
          {visibleNavigation.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-primary/45">{group.label}</p>
              <div className="space-y-0.5">{group.items.map((item) => { const Icon = item.icon; return <NavLink key={item.href} to={item.href} end={item.href === "/dashboard"} className={({ isActive }) => ["group flex items-center gap-3 border-l-2 px-3 py-2 text-[13px] font-medium transition", isActive ? "border-primary bg-primary/[.09] text-primary shadow-[inset_12px_0_24px_-20px_rgba(57,255,136,.9)]" : "border-transparent text-muted-foreground hover:bg-white/[.035] hover:text-foreground"].join(" ")}><Icon className="size-4 transition group-hover:text-primary" />{item.label}</NavLink> })}</div>
            </div>
          ))}
        </nav>

        <div className="p-3">
          <Separator className="mb-3 bg-primary/10" />
          <div className="flex items-center gap-3 border border-primary/10 bg-primary/[.035] p-3">
            <Avatar className="size-9"><AvatarFallback className="border border-primary/25 bg-primary/10 text-xs font-bold text-primary">{initials}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{userDisplayName}</p><p className="truncate text-[9px] uppercase tracking-wider text-muted-foreground">{userRole}</p></div>
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:bg-primary/10 hover:text-primary" onClick={handleLogout} title="Sair" aria-label="Sair do sistema"><LogOut className="size-4" /></Button>
          </div>
        </div>
      </aside>

      <div className="pt-16 lg:pl-[248px]">
        <main id="main-content" tabIndex={-1} className="sagep-grid-pattern min-h-[calc(100vh-4rem)] p-3 outline-none sm:p-5 lg:p-7 xl:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
