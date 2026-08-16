import { CircleDollarSign, FileCheck2, Landmark, ReceiptText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  calculateProjectFinancialBalance,
  projectDocumentCompletion,
} from "@/features/projects/project-financial-summary"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function ProjectFinancialCard({
  details,
}: {
  details: ProjectDetailsResponse
}) {
  const summary = details.financialSummary
  const balance = calculateProjectFinancialBalance(summary)
  const completion = projectDocumentCompletion(summary)
  const values = [
    {
      label: "Estimativas",
      value: summary.estimatedTotalAmount,
      detail: `${summary.finalizedEstimatesCount}/${summary.estimatesCount} finalizada(s)`,
      icon: CircleDollarSign,
    },
    {
      label: "Estimativa finalizada",
      value: summary.finalizedEstimatedTotalAmount,
      detail: "Base consolidada",
      icon: FileCheck2,
    },
    {
      label: "DIEx requisitórios",
      value: summary.diexTotalAmount,
      detail: `${summary.diexRequestsCount} documento(s)`,
      icon: ReceiptText,
    },
    {
      label: "Ordens de Serviço",
      value: summary.serviceOrderTotalAmount,
      detail: `${summary.serviceOrdersCount} documento(s)`,
      icon: Landmark,
    },
  ]

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Resumo financeiro e documental</CardTitle>
          <Badge variant={balance < 0 ? "destructive" : "outline"}>
            {balance < 0 ? "OS acima da estimativa" : "Saldo controlado"}
          </Badge>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Etapas documentais</span>
            <span>{completion.completedSteps}/{completion.expectedSteps}</span>
          </div>
          <Progress value={completion.percentage} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {values.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold">{formatCurrency(item.value)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/50 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Saldo entre estimativa finalizada e OS</p>
            <p className={balance < 0 ? "mt-1 text-lg font-semibold text-destructive" : "mt-1 text-lg font-semibold text-primary"}>
              {formatCurrency(balance)}
            </p>
          </div>
          <p className="max-w-sm text-xs text-muted-foreground">
            Valor indicativo calculado pelas movimentações internas do SAGEP.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
