import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  PackageSearch,
  ShieldAlert,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

const metrics = [
  {
    label: "Projetos ativos",
    value: "42",
    helper: "+8% no período",
    icon: BarChart3,
  },
  {
    label: "Aguardando NC",
    value: "9",
    helper: "Pendência crítica",
    icon: Clock3,
  },
  {
    label: "Itens em risco",
    value: "7",
    helper: "Saldo baixo/insuficiente",
    icon: ShieldAlert,
  },
  {
    label: "OS liberadas",
    value: "16",
    helper: "Prontas para execução",
    icon: CheckCircle2,
  },
]

const pipelineData = [
  { stage: "Estimativa", total: 12 },
  { stage: "NC", total: 9 },
  { stage: "DIEx", total: 7 },
  { stage: "NE", total: 5 },
  { stage: "OS", total: 16 },
  { stage: "Execução", total: 11 },
]

const financeData = [
  { month: "Jan", value: 120000 },
  { month: "Fev", value: 180000 },
  { month: "Mar", value: 155000 },
  { month: "Abr", value: 230000 },
  { month: "Mai", value: 310000 },
  { month: "Jun", value: 270000 },
]

const inventoryData = [
  { name: "Disponível", value: 188000 },
  { name: "Reservado", value: 42000 },
  { name: "Consumido", value: 69000 },
]

const queue = [
  {
    project: "PRJ-2026-0042",
    title: "Implantação de CFTV - Manaus",
    stage: "Aguardando Nota de Crédito",
    severity: "Alta",
  },
  {
    project: "PRJ-2026-0037",
    title: "Fibra Óptica - Rio Branco",
    stage: "Emitir DIEx requisitório",
    severity: "Média",
  },
  {
    project: "PRJ-2026-0028",
    title: "CFTV - Porto Velho",
    stage: "Emitir Ordem de Serviço",
    severity: "Baixa",
  },
]

export function OperationalDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <Badge className="mb-3 bg-emerald-600 hover:bg-emerald-600">
            Dashboard operacional
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Visão geral da operação
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Acompanhamento de projetos, fluxo documental, alertas e saldo dos
            itens da ATA. Os dados abaixo são mockados nesta primeira versão.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline">Exportar</Button>
          <Button className="gap-2">
            Nova estimativa
            <ArrowUpRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon

          return (
            <Card key={metric.label} className="border-none shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Icon className="size-5" />
                  </div>
                  <Badge variant="outline">Hoje</Badge>
                </div>
                <p className="mt-5 text-sm text-slate-500">{metric.label}</p>
                <div className="mt-1 flex items-end justify-between">
                  <p className="text-3xl font-semibold">{metric.value}</p>
                  <p className="text-xs text-slate-500">{metric.helper}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Pipeline documental por fase</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="total" radius={[10, 10, 0, 0]} fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Saldo financeiro da ATA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={["#059669", "#f59e0b", "#0f172a"][index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {inventoryData.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-600">{item.name}</span>
                    <span className="font-medium">
                      {item.value.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                  <Progress value={(item.value / 188000) * 100} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Evolução financeira</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financeData}>
                <defs>
                  <linearGradient id="finance" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#059669"
                  fill="url(#finance)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Fila operacional prioritária</CardTitle>
            <Badge variant="outline">3 pendências</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {queue.map((item) => (
              <div
                key={item.project}
                className="flex flex-col gap-3 rounded-2xl border bg-white p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-emerald-700" />
                    <p className="font-medium">{item.project}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{item.title}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.stage}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      item.severity === "Alta" ? "destructive" : "outline"
                    }
                  >
                    {item.severity}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Abrir
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-amber-900">
              <AlertTriangle className="size-5" />
              <p className="text-sm">
                Projetos parados por mais de 15 dias deverão aparecer aqui com
                prioridade automática.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none bg-slate-950 text-white shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <PackageSearch className="size-6" />
            </div>
            <div>
              <p className="font-semibold">Próximo marco de desenvolvimento</p>
              <p className="text-sm text-slate-400">
                Conectar este dashboard ao endpoint real GET
                /dashboard/operational.
              </p>
            </div>
          </div>

          <Button variant="secondary">Preparar integração</Button>
        </CardContent>
      </Card>
    </div>
  )
}