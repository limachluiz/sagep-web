import {
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  FileSpreadsheet,
  FolderOpen,
} from "lucide-react"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectDocumentFlowPanel } from "@/features/projects/components/project-document-flow-panel"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function formatDate(value: string | null) {
  if (!value) return "Não informado"
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value))
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\p{L}/u, (letter) => letter.toUpperCase())
}

export function ProjectDocumentsPanel({
  details,
  canCancelCommitmentNote,
  onCancelCommitmentNote,
}: {
  details: ProjectDetailsResponse
  canCancelCommitmentNote?: boolean
  onCancelCommitmentNote?: () => void
}) {
  const groups = [
    {
      title: "Estimativas",
      icon: FileSpreadsheet,
      items: details.documents.estimates.map((item) => ({
        id: item.id,
        code: `EST-${item.estimateCode}`,
        status: item.status,
        description: `${item.destinationCityName}/${item.destinationStateUf}`,
        amount: item.totalAmount,
        date: item.createdAt,
        href: `/estimates/${item.id}${item.archivedAt ? "?includeArchived=true" : ""}`,
      })),
    },
    {
      title: "DIEx requisitórios",
      icon: ClipboardCheck,
      items: details.documents.diexRequests.map((item) => ({
        id: item.id,
        code: item.diexNumber ?? `DIEX-${item.diexCode}`,
        status: item.documentStatus ?? "RASCUNHO",
        description: item.supplierName ?? "Fornecedor não informado",
        amount: item.totalAmount,
        date: item.issuedAt ?? item.createdAt,
        href: `/diex/${item.id}${item.archivedAt ? "?includeArchived=true" : ""}`,
      })),
    },
    {
      title: "Ordens de Serviço",
      icon: FileCheck2,
      items: details.documents.serviceOrders.map((item) => ({
        id: item.id,
        code: item.serviceOrderNumber ?? `OS-${item.serviceOrderCode}`,
        status: item.documentStatus ?? "RASCUNHO",
        description: item.contractorName ?? "Contratada não informada",
        amount: item.totalAmount,
        date: item.issuedAt ?? item.createdAt,
        href: `/service-orders/${item.id}${item.archivedAt ? "?includeArchived=true" : ""}`,
      })),
    },
  ]

  const asBuiltLink = details.workflow.milestones.asBuiltLink

  return (
    <div className="space-y-6">
      <ProjectDocumentFlowPanel
        details={details}
        canCancelCommitmentNote={canCancelCommitmentNote}
        onCancelCommitmentNote={onCancelCommitmentNote}
      />

      <Card className="border-none shadow-sm">
        <CardContent className="flex items-start gap-4 p-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FolderOpen className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">As-Built</p>
            <p className="mt-1 font-semibold">{asBuiltLink ? "Documento vinculado" : "Pendente"}</p>
            {asBuiltLink && (
              <Button asChild variant="link" className="mt-1 h-auto p-0 text-xs">
                <a href={asBuiltLink} target="_blank" rel="noreferrer">
                  Abrir arquivo
                  <ExternalLink className="size-3" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        {groups.map((group) => {
          const Icon = group.icon
          return (
            <Card key={group.title} className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="size-5 text-primary" />
                  {group.title}
                  <Badge variant="outline" className="ml-auto">{group.items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.items.length ? group.items.map((item) => (
                  <div key={item.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-medium">{item.code}</p>
                      <Badge variant="secondary">{formatStatus(item.status)}</Badge>
                    </div>
                    <p className="mt-2 truncate text-xs text-muted-foreground">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="font-medium">{formatCurrency(item.amount)}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                    </div>
                    <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                      <Link to={item.href} aria-label={`Abrir documento ${item.code}`}>
                        Abrir documento
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                )) : (
                  <div className="flex flex-col items-center py-10 text-center">
                    <FolderOpen className="size-8 text-muted-foreground" />
                    <p className="mt-3 text-sm text-muted-foreground">Nenhum documento.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
