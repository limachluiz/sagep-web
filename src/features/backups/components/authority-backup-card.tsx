import { useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Download, KeyRound, RefreshCw, ShieldAlert, ShieldCheck, Upload } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { backupsService } from "../backups.service"

const MAX_ARCHIVE_BYTES = 1024 * 1024

function saveArchive(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `sagep-autoridade-${new Date().toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z")}.sagep-pki`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return window.btoa(binary)
}

export function AuthorityBackupCard() {
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const [dialog, setDialog] = useState<"export" | "restore" | null>(null)
  const [archive, setArchive] = useState<File | null>(null)
  const [passphrase, setPassphrase] = useState("")
  const [passphraseConfirmation, setPassphraseConfirmation] = useState("")
  const [restoreConfirmation, setRestoreConfirmation] = useState("")

  const clearSecrets = () => {
    setPassphrase("")
    setPassphraseConfirmation("")
    setRestoreConfirmation("")
  }
  const close = () => {
    setDialog(null)
    setArchive(null)
    clearSecrets()
  }
  const refreshCertificateState = () => {
    void queryClient.invalidateQueries({ queryKey: ["deployment-settings"] })
    void queryClient.invalidateQueries({ queryKey: ["deployment-preflight"] })
    void queryClient.invalidateQueries({ queryKey: ["header", "operational-alerts"] })
  }

  const exportMutation = useMutation({
    mutationFn: () => backupsService.exportAuthority(passphrase),
    onSuccess: (blob) => {
      saveArchive(blob)
      close()
      toast.success("Backup criptografado da autoridade exportado.")
    },
    onError: (error) => toast.error(error.message),
  })
  const restoreMutation = useMutation({
    mutationFn: async () => backupsService.restoreAuthority(await fileToBase64(archive!), passphrase),
    onSuccess: (result) => {
      close()
      refreshCertificateState()
      toast.success("Autoridade restaurada e certificado do servidor reemitido.")
      if (result.trustRedistributionRequired) toast.warning("A autoridade mudou. Redistribua os kits de confiança aos clientes.")
      toast.info("Reinicie o proxy Caddy para aplicar o novo certificado.")
    },
    onError: (error) => toast.error(error.message),
  })
  const busy = exportMutation.isPending || restoreMutation.isPending

  const selectArchive = (file?: File) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith(".sagep-pki")) return toast.error("Selecione um arquivo .sagep-pki.")
    if (file.size > MAX_ARCHIVE_BYTES) return toast.error("O arquivo excede o limite de 1 MB.")
    setArchive(file)
    setDialog("restore")
  }

  return <>
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="size-5" />Autoridade certificadora da OM</CardTitle><CardDescription>Custodie uma cópia criptografada da raiz e recupere o HTTPS sem expor a chave privada.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <Alert><ShieldCheck /><AlertTitle>Arquivo protegido e vinculado à OM</AlertTitle><AlertDescription>A senha não é armazenada nem recuperável pelo SAGEP. Guarde o arquivo e a senha em locais separados. A restauração valida a identidade da OM e cria uma cópia de recuperação antes da troca.</AlertDescription></Alert>
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => setDialog("export")}><Download />Exportar autoridade</Button><input ref={fileInput} type="file" accept=".sagep-pki,application/octet-stream" className="hidden" onChange={(event) => { selectArchive(event.target.files?.[0]); event.currentTarget.value = "" }} /><Button variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}><Upload />Restaurar autoridade</Button></div>
      </CardContent>
    </Card>

    <Dialog open={dialog === "export"} onOpenChange={(open) => { if (!open && !busy) close() }}>
      <DialogContent><DialogHeader><DialogTitle>Exportar autoridade criptografada</DialogTitle><DialogDescription>Defina uma senha exclusiva com pelo menos 20 caracteres. Sem ela, o arquivo não poderá ser restaurado.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="authority-export-password">Senha de custódia</Label><Input id="authority-export-password" type="password" autoComplete="new-password" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="authority-export-confirm">Confirmar senha</Label><Input id="authority-export-confirm" type="password" autoComplete="new-password" value={passphraseConfirmation} onChange={(event) => setPassphraseConfirmation(event.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={close} disabled={busy}>Cancelar</Button><Button disabled={passphrase.length < 20 || passphrase !== passphraseConfirmation || busy} onClick={() => exportMutation.mutate()}>{exportMutation.isPending ? <RefreshCw className="animate-spin" /> : <Download />}Gerar arquivo protegido</Button></DialogFooter></DialogContent>
    </Dialog>

    <Dialog open={dialog === "restore"} onOpenChange={(open) => { if (!open && !busy) close() }}>
      <DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><ShieldAlert className="size-5" />Restaurar autoridade da OM</DialogTitle><DialogDescription>O certificado do servidor será reemitido para o DNS atualmente configurado. Arquivo selecionado: <strong>{archive?.name}</strong>.</DialogDescription></DialogHeader><Alert variant="destructive"><ShieldAlert /><AlertTitle>Operação crítica</AlertTitle><AlertDescription>Se a raiz for diferente da atual, todos os computadores clientes precisarão receber um novo kit de confiança. O proxy Caddy deverá ser reiniciado após a conclusão.</AlertDescription></Alert><div className="space-y-4"><div className="space-y-2"><Label htmlFor="authority-restore-password">Senha de custódia</Label><Input id="authority-restore-password" type="password" autoComplete="off" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="authority-restore-confirm">Digite RESTAURAR AUTORIDADE para confirmar</Label><Input id="authority-restore-confirm" autoComplete="off" value={restoreConfirmation} onChange={(event) => setRestoreConfirmation(event.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={close} disabled={busy}>Cancelar</Button><Button variant="destructive" disabled={!archive || passphrase.length < 20 || restoreConfirmation !== "RESTAURAR AUTORIDADE" || busy} onClick={() => restoreMutation.mutate()}>{restoreMutation.isPending ? <RefreshCw className="animate-spin" /> : <Upload />}Restaurar definitivamente</Button></DialogFooter></DialogContent>
    </Dialog>
  </>
}
