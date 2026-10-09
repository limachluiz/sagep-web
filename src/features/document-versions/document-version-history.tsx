import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Download, FileClock, Loader2, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { documentVersionsService } from "./document-versions.service"

type Props = { entityType: string; entityId: string; documentType: string }
const dateTime = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))

export function DocumentVersionHistory({ entityType, entityId, documentType }: Props) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [originalId, setOriginalId] = useState<string | null>(null)
  const queryKey = ["document-versions", entityType, entityId]
  const query = useQuery({ queryKey, queryFn: () => documentVersionsService.list(entityType, entityId), refetchOnWindowFocus: true })
  const download = useMutation({ mutationFn: async (version: { id: string; filename: string }) => ({ blob: await documentVersionsService.download(version.id), filename: version.filename }), onSuccess: ({ blob, filename }) => { const url = URL.createObjectURL(blob); const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 30_000) }, onError: (error) => toast.error(error.message) })
  const upload = useMutation({ mutationFn: async ({ id, file }: { id: string; file: File }) => { const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.onerror = reject; reader.readAsDataURL(file) }); return documentVersionsService.registerSigned(id, { fileBase64: base64, filename: file.name, signerName: "Assinante informado no certificado", signatureProvider: "PDF assinado externamente" }) }, onSuccess: () => { toast.success("Versão assinada preservada; validação externa pendente."); queryClient.invalidateQueries({ queryKey }) }, onError: (error) => toast.error(error.message) })
  const versions = query.data ?? []
  return <Card className="border-none shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><FileClock className="size-5 text-primary" />Histórico do documento</CardTitle><CardDescription>Versões imutáveis com hash SHA-256. Uma nova versão é criada somente quando o conteúdo muda.</CardDescription></CardHeader><CardContent>
    {!versions.length ? <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Gere o PDF para registrar a primeira versão oficial.</p> : <div className="divide-y rounded-lg border">{versions.map((version) => <div key={version.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{version.documentType.endsWith("_SIGNED") ? "Versão assinada" : `Versão ${version.version}`}</p>{version.signatureStatus !== "NOT_SIGNED" && <Badge variant={version.signatureStatus === "VALID" ? "default" : version.signatureStatus === "INVALID" ? "destructive" : "secondary"}>{version.signatureStatus === "PENDING_VALIDATION" ? "Validação pendente" : version.signatureStatus === "VALID" ? "Assinatura válida" : "Assinatura inválida"}</Badge>}{version.invalidatedAt && <Badge variant="destructive">Invalidada</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{dateTime(version.generatedAt)} · SHA-256 {version.checksumSha256.slice(0, 16)}… · {(version.sizeBytes / 1024).toFixed(1)} KB</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => download.mutate(version)} disabled={download.isPending}><Download />Baixar</Button>{version.documentType === documentType && !version.invalidatedAt && <Button size="sm" variant="outline" onClick={() => { setOriginalId(version.id); inputRef.current?.click() }}><Upload />Assinado</Button>}</div></div>)}</div>}
    <Label className="sr-only" htmlFor={`signed-${entityId}`}>PDF assinado</Label><Input ref={inputRef} id={`signed-${entityId}`} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file && originalId) upload.mutate({ id: originalId, file }); event.currentTarget.value = "" }} />
    {upload.isPending && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />Preservando versão assinada…</p>}
  </CardContent></Card>
}
