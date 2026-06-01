import { NavLink, Outlet, useNavigate } from "react-router"
import {
  Bell,
  ClipboardList,
  FileText,
  Gauge,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/features/auth/auth.store"

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projetos", href: "/projects", icon: ClipboardList },
  { label: "Estimativas", href: "/estimates", icon: FileText },
  { label: "DIEx", href: "/diex", icon: Landmark },
  { label: "Ordens de Serviço", href: "/service-orders", icon: ShieldCheck },
  { label: "Usuários", href: "/users", icon: Users },
  { label: "Configurações", href: "/settings", icon: Settings },
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
  const { user, logout } = useAuthStore()

  const userDisplayName = user?.name ?? user?.email ?? "Usuário"
  const userRole = user?.role ?? "USUÁRIO"
  const initials = getInitials(userDisplayName)

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-slate-950">
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

        <nav className="mt-6 flex-1 space-y-1 px-4">
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.href}
                to={item.href}
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
          <Button variant="outline" size="icon" className="lg:hidden">
            <Menu className="size-4" />
          </Button>

          <div className="hidden max-w-md flex-1 md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Buscar projetos, estimativas, DIEx, OS..."
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Badge variant="outline" className="hidden md:inline-flex">
              UASG 160016
            </Badge>

            <Button variant="outline" size="icon" title="Notificações">
              <Bell className="size-4" />
            </Button>

            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}