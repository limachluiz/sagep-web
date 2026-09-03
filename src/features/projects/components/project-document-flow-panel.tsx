import {
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Landmark,
  RotateCcw,
} from "lucide-react"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buildProjectDocumentFlow } from "@/features/projects/project-document-flow"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

const icons = {
  estimate: FileSpreadsheet,
  "credit-note": CircleDollarSign,
  diex: FileText,
  "commitment-note": Landmark,
  "service-order": FileCheck2,
} as const

function money(value: string | null) {
  if (!value) return null
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ProjectDocumentFlowPanel({
  details,
  canCancelCommitmentNote = false,
  onCancelCommitmentNote,
}: {
  details: ProjectDetailsResponse
  canCancelCommitmentNote?: boolean
  onCancelCommitmentNote?: () => void
}) {
  const steps = buildProjectDocumentFlow(details)

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Cadeia financeira e documental</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe os vínculos e o efeito de cada marco sobre o saldo da ATA.
          </p>
        </div>
        {canCancelCommitmentNote && onCancelCommitmentNote && (
          <Button
            variant="outline"
            className="shrink-0 text-destructive hover:text-destructive"
            onClick={onCancelCommitmentNote}
          >
            <RotateCcw className="size-4" />
            Cancelar NE
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" aria-label="Cadeia documental do projeto">
          {steps.map((step, index) => {
            const Icon = icons[step.key]
            return (
              <li
                key={step.key}
                aria-current={step.current ? "step" : undefined}
                className={`relative rounded-xl border p-4 ${
                  step.current
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : step.completed
                      ? "border-primary/20"
                      : "bg-muted/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex size-9 items-center justify-center rounded-xl ${
                    step.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {step.completed ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                  </span>
                  <Badge variant={step.completed ? "default" : step.current ? "secondary" : "outline"}>
                    {step.completed ? "Concluído" : step.current ? "Em andamento" : "Pendente"}
                  </Badge>
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {index + 1}. {step.label}
                </p>
                <p className="mt-1 truncate font-semibold">{step.code ?? "Não informado"}</p>
                <p className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground">{step.description}</p>
                {money(step.amount) && <p className="mt-2 text-sm font-medium">{money(step.amount)}</p>}
                {step.href && (
                  <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs">
                    <Link to={step.href}>
                      Abrir registro
                      <ExternalLink className="size-3" />
                    </Link>
                  </Button>
                )}
              </li>
            )
          })}
        </ol>
        {details.workflow.creditFunding.notes.length > 0 && (
          <div className="mt-5 rounded-xl border bg-muted/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">Notas de Crédito vinculadas</p>
                <p className="text-xs text-muted-foreground">
                  {details.workflow.creditFunding.mode === "MULTIPLE"
                    ? "Crédito composto por múltiplas descentralizações"
                    : "Crédito recebido em uma única descentralização"}
                </p>
              </div>
              <Badge variant="outline">
                {details.workflow.creditFunding.notes.length} {details.workflow.creditFunding.notes.length === 1 ? "NC" : "NCs"}
              </Badge>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {details.workflow.creditFunding.notes.map((note) => (
                <div key={note.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{note.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.receivedAt).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                      {note.issuingManagementUnit ? ` · UG ${note.issuingManagementUnit}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold">{money(note.amount)}</span>
                    {note.documentLink && (
                      <Button asChild variant="ghost" size="icon" title="Comprovante da NC">
                        <a href={note.documentLink} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
