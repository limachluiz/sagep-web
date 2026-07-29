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
        <section
          className="rounded-xl border border-primary/15 bg-card/80 p-2 shadow-sm"
          aria-label="Perspectivas do dashboard"
        >
          <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Perspectiva
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Escolha o nível de informação que deseja acompanhar.
              </p>
            </div>
            <span className="hidden rounded-full border border-primary/15 bg-primary/[.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary sm:inline-flex">
              {availableViews.length} {availableViews.length === 1 ? "visão disponível" : "visões disponíveis"}
            </span>
          </div>

          <TabsList className="grid h-auto w-full grid-cols-1 gap-1.5 bg-muted/60 p-1.5 sm:grid-flow-col sm:auto-cols-fr sm:grid-cols-none">
            {availableViews.map((view) => {
              const item = viewMetadata[view]
              const Icon = item.icon
              return (
                <TabsTrigger
                  key={view}
                  value={view}
                  className="group/dashboard-view h-auto min-w-0 justify-start gap-3 rounded-lg border px-3 py-3 text-left whitespace-normal shadow-none hover:border-primary/25 hover:bg-background/75 data-active:border-primary data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm sm:px-4"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/[.07] text-primary transition-colors group-data-active/dashboard-view:border-primary-foreground/20 group-data-active/dashboard-view:bg-primary-foreground/15 group-data-active/dashboard-view:text-primary-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-5">{item.label}</span>
                    <span className="block text-xs font-normal leading-4 text-muted-foreground group-data-active/dashboard-view:text-primary-foreground/75">
                      {item.description}
                    </span>
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </section>

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
