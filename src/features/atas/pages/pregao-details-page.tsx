import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Building2, CalendarDays, FileStack } from "lucide-react"
import { Link, useParams } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { pregoesService } from "@/features/atas/atas.service"
import { formatAtaDate } from "@/features/atas/atas.utils"

export function PregaoDetailsPage() {
  const { pregaoId } = useParams<{ pregaoId: string }>()
  const query = useQuery({ queryKey: ["pregoes", "details", pregaoId], queryFn: () => pregoesService.details(pregaoId!), enabled: Boolean(pregaoId) })
  if (query.isLoading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)}</div>
  if (query.isError || !query.data) return <p className="text-sm text-destructive">{query.error?.message ?? "Pregão não encontrado."}</p>
  const pregao = query.data
  const itemCount = pregao.atas.reduce((sum, ata) => sum + (ata._count?.items ?? 0), 0)
  return <div className="space-y-6">
    <div><Button asChild variant="ghost" className="mb-3 -ml-3"><Link to="/atas"><ArrowLeft className="size-4" />Voltar para Pregões e Atas</Link></Button><div className="flex gap-2"><Badge>Pregão eletrônico</Badge><Badge variant="outline">PRG-{pregao.pregaoCode}</Badge></div><h1 className="mt-3 text-3xl font-semibold">PE {pregao.number}/{pregao.year}</h1><p className="mt-2 text-sm text-muted-foreground">UASG {pregao.uasg} · {pregao.managingAgency || "Órgão gerenciador não informado"}</p></div>
    {pregao.object && <Card><CardHeader><CardTitle>Objeto da contratação</CardTitle></CardHeader><CardContent><p className="leading-7">{pregao.object}</p></CardContent></Card>}
    <div className="grid gap-4 sm:grid-cols-3">
      <Card><CardContent className="flex items-center gap-3 pt-6"><FileStack className="size-7 text-primary" /><div><p className="text-sm text-muted-foreground">ATAs vinculadas</p><p className="text-2xl font-semibold">{pregao._count.atas}</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-3 pt-6"><Building2 className="size-7 text-primary" /><div><p className="text-sm text-muted-foreground">Fornecedores</p><p className="text-2xl font-semibold">{new Set(pregao.atas.map((ata) => ata.vendorName)).size}</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-3 pt-6"><CalendarDays className="size-7 text-primary" /><div><p className="text-sm text-muted-foreground">Itens registrados</p><p className="text-2xl font-semibold">{itemCount}</p></div></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Atas de Registro de Preços</CardTitle></CardHeader><CardContent>
      {pregao.atas.length ? <Table><TableHeader><TableRow><TableHead>ATA</TableHead><TableHead>Fornecedor</TableHead><TableHead>Cobertura</TableHead><TableHead>Vigência</TableHead><TableHead>Itens</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader><TableBody>{pregao.atas.map((ata) => <TableRow key={ata.id}><TableCell><p className="font-semibold">{ata.number}</p><p className="mt-1 text-xs text-muted-foreground">ATA-{ata.ataCode}</p></TableCell><TableCell className="max-w-80">{ata.vendorName}</TableCell><TableCell>{ata.coverageGroups.map((group) => group.code).join(", ") || "—"}</TableCell><TableCell>{formatAtaDate(ata.validFrom)} até {formatAtaDate(ata.validUntil)}</TableCell><TableCell>{ata._count?.items ?? 0}</TableCell><TableCell><Badge variant={ata.isActive ? "default" : "secondary"}>{ata.isActive ? "Vigente" : "Inativa"}</Badge></TableCell><TableCell className="text-right"><Button asChild variant="ghost" size="sm"><Link to={`/atas/${ata.id}`}>Abrir ATA</Link></Button></TableCell></TableRow>)}</TableBody></Table> : <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma ATA vinculada a este pregão.</p>}
    </CardContent></Card>
  </div>
}
