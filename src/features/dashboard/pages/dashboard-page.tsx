import { lazy, Suspense } from "react"
import { BarChart3, LayoutDashboard, Radar } from "lucide-react"
import { useSearchParams } from "react-router"

import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/features/auth/auth.store"
import {
  availableDashboardViews,
  resolveDashboardView,
  type DashboardView,
} from "@/features/dashboard/dashboard-view"

const DashboardOverviewPage = lazy(() => import("./dashboard-overview-page").then((module) => ({ default: module.DashboardOverviewPage })))
const OperationalDashboardPage = lazy(() => import("./operational-dashboard-page").then((module) => ({ default: module.OperationalDashboardPage })))
const ExecutiveDashboardPage = lazy(() => import("./executive-dashboard-page").then((module) => ({ default: module.ExecutiveDashboardPage })))

const viewMetadata = {
  overview: {
    label: "Visão geral",
    description: "Carteira e documentos",
    icon: LayoutDashboard,
  },
  operational: {
    label: "Operacional",
    description: "Pendências e alertas",
    icon: Radar,
  },
  executive: {
    label: "Executivo",
    description: "Valores e desempenho",
    icon: BarChart3,
  },
} satisfies Record<DashboardView, {
  label: string
  description: string
  icon: typeof LayoutDashboard
}>

function DashboardPanelFallback() {
  return (
    <div className="space-y-5" role="status" aria-live="polite">
      <span className="sr-only">Carregando perspectiva do dashboard</span>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)}
      </div>
    </div>
  )
}

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const availableViews = availableDashboardViews(hasPermission)
  const activeView = resolveDashboardView(availableViews, searchParams.get("view"))

  const handleViewChange = (view: string) => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set("view", view)
    setSearchParams(nextSearchParams, { replace: true })
  }

  if (!activeView) return null

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Dashboard integrado"
        title="Centro de controle do SAGEP"
        description="Uma única visão para acompanhar a carteira, atuar nas prioridades e analisar os resultados do portfólio."
        icon={LayoutDashboard}
        meta="Dados reais dos painéis geral, operacional e executivo, com acesso conforme o perfil."
      />

      <Tabs value={activeView} onValueChange={handleViewChange} className="gap-6">
        <div className="overflow-x-auto border-b border-border/80">
          <TabsList variant="line" className="h-auto min-w-max gap-1 p-0">
            {availableViews.map((view) => {
              const item = viewMetadata[view]
              const Icon = item.icon
              return (
                <TabsTrigger
                  key={view}
                  value={view}
                  className="h-auto min-w-44 justify-start gap-3 rounded-none px-4 py-3 text-left"
                >
                  <span className="flex size-9 items-center justify-center rounded-sm border border-primary/15 bg-primary/[.06] text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-0.5 block text-[10px] font-normal tracking-wide text-muted-foreground">{item.description}</span>
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {availableViews.includes("overview") && (
          <TabsContent value="overview"><Suspense fallback={<DashboardPanelFallback />}><DashboardOverviewPage /></Suspense></TabsContent>
        )}
        {availableViews.includes("operational") && (
          <TabsContent value="operational"><Suspense fallback={<DashboardPanelFallback />}><OperationalDashboardPage embedded /></Suspense></TabsContent>
        )}
        {availableViews.includes("executive") && (
          <TabsContent value="executive"><Suspense fallback={<DashboardPanelFallback />}><ExecutiveDashboardPage embedded /></Suspense></TabsContent>
        )}
      </Tabs>
    </div>
  )
}
