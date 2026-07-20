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

const navigation: NavigationItem[] = [
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

  const visibleNavigation = navigation.filter((item) =>
    hasAnyPermission(item.anyOf),
  )

  const handleLogout = async () => {
    const tokenToRevoke = refreshToken
    logout()
    navigate("/login", { replace: true })

    if (tokenToRevoke) {
      await authService.logout(tokenToRevoke).catch(() => undefined)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-slate-950">
      <a href="#main-content" className="sr-only fixed left-4 top-4 z-[60] rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only">Pular para o conteúdo</a>
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-slate-950 text-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <Gauge className="size-6 text-emerald-300" />
          </div>

          <div>
            <p className="text-sm font-semibold tracking-[0.28em] text-emerald-300">
              SAGEP
            </p>
            <p className="text-xs text-slate-400">4º CTA • Projetos</p>
          </div>
        </div>

        <div className="px-4">
          <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Ambiente</span>
              <Badge className="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15">
                Operacional
              </Badge>
            </div>
            <p className="mt-3 text-sm font-medium text-white">
              Sistema de Apoio à Gestão de Projetos
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Controle de estimativas, DIEx, empenhos, OS e saldo de ATA.
            </p>
          </div>
        </div>

        <nav className="mt-6 min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pb-4" aria-label="Navegação principal">
          {visibleNavigation.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/dashboard"}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-emerald-500 text-slate-950"
                      : "text-slate-300 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon className="size-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4">
          <Separator className="mb-4 bg-white/10" />
          <div className="flex items-center gap-3 rounded-2xl bg-white/4 p-3">
            <Avatar>
              <AvatarFallback className="bg-emerald-500 text-slate-950">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userDisplayName}</p>
              <p className="truncate text-xs text-slate-400">{userRole}</p>
            </div>

            <Button
              size="icon"
              variant="ghost"
              className="text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={handleLogout}
              title="Sair"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b bg-white/85 px-4 backdrop-blur-xl lg:px-8">
          <Sheet>
            <SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menu principal"><Menu className="size-4" /></Button></SheetTrigger>
            <SheetContent side="left" className="w-[min(88vw,320px)] gap-0 bg-slate-950 p-0 text-white">
              <SheetHeader className="border-b border-white/10 px-5 py-5"><SheetTitle className="flex items-center gap-3 text-white"><span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15"><Gauge className="size-5 text-emerald-300" /></span><span><span className="block text-sm tracking-[0.24em] text-emerald-300">SAGEP</span><span className="block text-xs font-normal text-slate-400">4º CTA • Projetos</span></span></SheetTitle></SheetHeader>
              <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4" aria-label="Navegação móvel">{visibleNavigation.map((item) => { const Icon = item.icon; return <SheetClose asChild key={item.href}><NavLink to={item.href} end={item.href === "/dashboard"} className={({ isActive }) => ["flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", isActive ? "bg-emerald-500 text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"].join(" ")}><Icon className="size-4" />{item.label}</NavLink></SheetClose> })}</nav>
              <div className="border-t border-white/10 p-4"><div className="flex items-center gap-3"><Avatar><AvatarFallback className="bg-emerald-500 text-slate-950">{initials}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{userDisplayName}</p><p className="truncate text-xs text-slate-400">{userRole}</p></div><Button size="icon" variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={handleLogout} aria-label="Sair"><LogOut className="size-4" /></Button></div></div>
            </SheetContent>
          </Sheet>

          <div className="md:hidden"><GlobalSearchDialog compact /></div>

          <div className="hidden max-w-md flex-1 md:block">
            <GlobalSearchDialog />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Badge variant="outline" className="hidden md:inline-flex">
              UASG 160016
            </Badge>

            <NotificationsMenu />

            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="p-4 outline-none lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
