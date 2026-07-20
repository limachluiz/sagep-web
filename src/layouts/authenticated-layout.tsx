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
    <div className="min-h-screen bg-[#f7f5ef] text-[#262b1a]">
      <a href="#main-content" className="sr-only fixed left-4 top-4 z-[70] rounded-md bg-[#c8a84b] px-4 py-2 text-[#263012] focus:not-sr-only">Pular para o conteúdo</a>

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center border-b border-[#c8a84b]/20 bg-[#263012] text-white shadow-lg">
        <div className="hidden h-full w-[260px] shrink-0 items-center gap-3 border-r border-[#c8a84b]/20 px-5 lg:flex">
          <div className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#dfc070,#8a6e28)] text-[#263012]">
            <Gauge className="size-5" />
          </div>
          <div>
            <p className="font-heading text-lg font-extrabold tracking-[0.18em] text-[#d8b85e]">SAGEP</p>
            <p className="text-[9px] uppercase tracking-[0.12em] text-white/45">4º CTA · Gestão de Projetos</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 px-3 sm:px-4 lg:px-6">
          <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white lg:hidden" aria-label="Abrir menu principal"><Menu className="size-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-[min(88vw,320px)] gap-0 border-[#c8a84b]/20 bg-[#263012] p-0 text-white">
              <SheetHeader className="border-b border-[#c8a84b]/20 px-5 py-5"><SheetTitle className="flex items-center gap-3 text-white"><span className="flex size-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#dfc070,#8a6e28)] text-[#263012]"><Gauge className="size-5" /></span><span><span className="block font-heading text-lg tracking-[0.2em] text-[#d8b85e]">SAGEP</span><span className="block text-[10px] font-normal uppercase tracking-wider text-white/45">4º CTA · Projetos</span></span></SheetTitle></SheetHeader>
              <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4" aria-label="Navegação móvel">
                {visibleNavigation.map((group) => <div key={group.label}><p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#c8a84b]/55">{group.label}</p>{group.items.map((item) => { const Icon = item.icon; return <SheetClose asChild key={item.href}><NavLink to={item.href} end={item.href === "/dashboard"} className={({ isActive }) => ["flex items-center gap-3 border-l-2 px-3 py-2 text-sm font-medium transition", isActive ? "border-[#c8a84b] bg-[#c8a84b]/12 text-[#dfc070]" : "border-transparent text-white/65 hover:bg-white/6 hover:text-white"].join(" ")}><Icon className="size-4" />{item.label}</NavLink></SheetClose> })}</div>)}
              </nav>
              <div className="border-t border-white/10 p-4"><div className="flex items-center gap-3"><Avatar><AvatarFallback className="bg-[#c8a84b] text-[#263012]">{initials}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{userDisplayName}</p><p className="truncate text-[10px] uppercase tracking-wider text-white/45">{userRole}</p></div><Button size="icon" variant="ghost" className="text-white/65 hover:bg-white/10 hover:text-white" onClick={handleLogout} aria-label="Sair"><LogOut className="size-4" /></Button></div></div>
            </SheetContent>
          </Sheet>

          <div className="mr-auto lg:hidden">
            <p className="font-heading text-base font-extrabold tracking-[0.18em] text-[#d8b85e]">SAGEP</p>
          </div>

          <div className="md:hidden"><GlobalSearchDialog compact /></div>
          <div className="hidden max-w-md flex-1 md:block">
            <GlobalSearchDialog />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="hidden border-[#c8a84b]/30 bg-white/5 text-[#dfc070] md:inline-flex">
              UASG 160016
            </Badge>
            <NotificationsMenu />
            <div className="hidden text-right sm:block"><p className="max-w-40 truncate text-xs font-medium text-white/85">{userDisplayName}</p><p className="text-[9px] uppercase tracking-wider text-white/40">{userRole}</p></div>
            <Avatar className="size-9"><AvatarFallback className="bg-[#c8a84b] text-xs font-bold text-[#263012]">{initials}</AvatarFallback></Avatar>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-[260px] border-r border-[#c8a84b]/15 bg-[#263012] text-white lg:flex lg:flex-col">
        <div className="border-b border-white/8 px-5 py-4">
          <div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[0.16em] text-white/40">Ambiente</span><Badge className="bg-[#c8a84b]/15 text-[#dfc070] hover:bg-[#c8a84b]/15">Operacional</Badge></div>
          <p className="mt-2 text-xs leading-5 text-white/55">Controle técnico e documental integrado.</p>
        </div>

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Navegação principal">
          {visibleNavigation.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#c8a84b]/55">{group.label}</p>
              <div className="space-y-0.5">{group.items.map((item) => { const Icon = item.icon; return <NavLink key={item.href} to={item.href} end={item.href === "/dashboard"} className={({ isActive }) => ["flex items-center gap-3 border-l-2 px-3 py-2 text-[13px] font-medium transition", isActive ? "border-[#c8a84b] bg-[#c8a84b]/12 text-[#dfc070]" : "border-transparent text-white/65 hover:bg-white/6 hover:text-white"].join(" ")}><Icon className="size-4" />{item.label}</NavLink> })}</div>
            </div>
          ))}
        </nav>

        <div className="p-3">
          <Separator className="mb-3 bg-white/10" />
          <div className="flex items-center gap-3 bg-white/5 p-3">
            <Avatar className="size-9"><AvatarFallback className="bg-[#c8a84b] text-xs font-bold text-[#263012]">{initials}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{userDisplayName}</p><p className="truncate text-[9px] uppercase tracking-wider text-white/40">{userRole}</p></div>
            <Button size="icon" variant="ghost" className="text-white/55 hover:bg-white/10 hover:text-white" onClick={handleLogout} title="Sair" aria-label="Sair do sistema"><LogOut className="size-4" /></Button>
          </div>
        </div>
      </aside>

      <div className="pt-16 lg:pl-[260px]">
        <main id="main-content" tabIndex={-1} className="min-h-[calc(100vh-4rem)] p-3 outline-none sm:p-5 lg:p-7 xl:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
