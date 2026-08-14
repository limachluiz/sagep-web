import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Bell, Boxes, RefreshCw, Trash2 } from "lucide-react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/features/auth/auth.store"
import { headerService } from "@/features/header/header.service"

const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 }

export function NotificationsMenu() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const canManageAtas = useAuthStore((state) => state.hasPermission("atas.manage"))
  const query = useQuery({ queryKey: ["header", "operational-alerts"], queryFn: headerService.alerts, staleTime: 30_000, refetchInterval: 60_000 })
  const alerts = [...(query.data?.alerts ?? [])].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  const stockCount = canManageAtas ? query.data?.inventoryAlerts.lowStock.length ?? 0 : 0
  const total = (query.data?.summary.total ?? 0) + stockCount
  const dismissMutation = useMutation({
    mutationFn: headerService.dismissAllAlerts,
    onSuccess: async ({ dismissed }) => {
      await queryClient.invalidateQueries({ queryKey: ["header", "operational-alerts"] })
      toast.success(dismissed === 1 ? "1 notificação foi limpa." : `${dismissed} notificações foram limpas.`)
    },
    onError: (error) => toast.error(error.message),
  })

  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="relative border-primary/15 bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-primary" aria-label={`${total} notificações operacionais`}><Bell className="size-4" />{total > 0 && <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-md bg-primary px-1 text-[10px] font-bold leading-5 text-primary-foreground shadow-sm">{total > 99 ? "99+" : total}</span>}</Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="sagep-panel w-[min(92vw,420px)] p-0">
      <DropdownMenuLabel className="flex items-center justify-between gap-3 px-4 py-3"><span><span className="block text-sm text-foreground">Central de alertas</span><span className="mt-0.5 block font-normal">Atualização automática a cada minuto</span></span><span className="flex items-center gap-1"><Button variant="ghost" size="icon-sm" onClick={(event) => { event.preventDefault(); dismissMutation.mutate() }} disabled={alerts.length === 0 || dismissMutation.isPending} aria-label="Limpar notificações"><Trash2 className="size-3.5" /></Button><Button variant="ghost" size="icon-sm" onClick={(event) => { event.preventDefault(); query.refetch() }} disabled={query.isFetching} aria-label="Atualizar alertas"><RefreshCw className={query.isFetching ? "size-3.5 animate-spin" : "size-3.5"} /></Button></span></DropdownMenuLabel>
      <DropdownMenuSeparator className="m-0" />
      <div className="max-h-[60vh] overflow-y-auto p-2">
        {query.isError && <div className="m-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{query.error.message}</div>}
        {query.isLoading && <div className="p-6 text-center text-sm text-muted-foreground">Carregando alertas...</div>}
        {!query.isLoading && !query.isError && total === 0 && <div className="p-8 text-center"><Bell className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Nenhuma pendência operacional</p></div>}
        {alerts.slice(0, 8).map((alert) => <DropdownMenuItem key={alert.id} className="mb-1 cursor-pointer items-start rounded-lg border p-3" onSelect={() => navigate(alert.detailsPath)}><AlertTriangle className={alert.severity === "CRITICAL" ? "mt-0.5 size-4 text-destructive" : "mt-0.5 size-4 text-status-warning"} /><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate font-medium">{alert.title}</span><Badge variant={alert.severity === "CRITICAL" ? "destructive" : "outline"}>{alert.severity === "CRITICAL" ? "Crítico" : "Atenção"}</Badge></span><span className="mt-1 line-clamp-2 text-xs text-muted-foreground">{alert.description}</span></span></DropdownMenuItem>)}
        {stockCount > 0 && <DropdownMenuItem className="cursor-pointer items-start rounded-lg border p-3" onSelect={() => navigate("/atas")}><Boxes className="mt-0.5 size-4 text-status-warning" /><span><span className="block font-medium">{stockCount} item(ns) de ATA com saldo crítico</span><span className="mt-1 block text-xs text-muted-foreground">Alerta dinâmico de estoque: será removido quando o saldo for regularizado.</span></span></DropdownMenuItem>}
      </div>
      <DropdownMenuSeparator className="m-0" /><DropdownMenuItem className="cursor-pointer justify-center rounded-none py-3 text-primary" onSelect={() => navigate("/dashboard?view=operational")}>Ver painel operacional</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
}
