import { useCallback, useEffect, useRef, useState } from "react"
import { LockKeyhole } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/features/auth/auth.service"
import { useAuthStore } from "@/features/auth/auth.store"
import { registerStepUpHandler } from "@/features/auth/step-up.manager"

type PendingChallenge = {
  resolve: (token: string) => void
  reject: (error: Error) => void
}

export function StepUpDialog() {
  const userId = useAuthStore((state) => state.user?.id)
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const pendingRef = useRef<PendingChallenge | null>(null)
  const cacheRef = useRef<{ token: string; expiresAt: number } | null>(null)

  const requestChallenge = useCallback((force: boolean) => {
    const cached = cacheRef.current
    if (!force && cached && cached.expiresAt > Date.now() + 10_000) {
      return Promise.resolve(cached.token)
    }

    return new Promise<string>((resolve, reject) => {
      pendingRef.current = { resolve, reject }
      setPassword("")
      setError(null)
      setOpen(true)
    })
  }, [])

  useEffect(() => {
    registerStepUpHandler(requestChallenge)
    return () => {
      registerStepUpHandler(null)
      pendingRef.current?.reject(new Error("Confirmação de segurança interrompida."))
      pendingRef.current = null
    }
  }, [requestChallenge])

  useEffect(() => {
    cacheRef.current = null
  }, [userId])

  const cancel = () => {
    if (submitting) return
    pendingRef.current?.reject(new Error("Operação cancelada: senha não confirmada."))
    pendingRef.current = null
    setOpen(false)
  }

  const confirm = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!password) return
    setSubmitting(true)
    setError(null)

    try {
      const result = await authService.reauthenticate(password)
      cacheRef.current = {
        token: result.stepUpToken,
        expiresAt: Date.now() + result.expiresInSeconds * 1000,
      }
      pendingRef.current?.resolve(result.stepUpToken)
      pendingRef.current = null
      setOpen(false)
      setPassword("")
    } catch (challengeError) {
      setError(challengeError instanceof Error ? challengeError.message : "Senha inválida.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && cancel()}>
      <DialogContent showCloseButton={!submitting}>
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <DialogTitle>Confirme sua identidade</DialogTitle>
          <DialogDescription>
            Esta operação altera dados sensíveis. Informe sua senha para continuar. A autorização será válida por até 5 minutos.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={confirm}>
          <div className="space-y-2">
            <Label htmlFor="step-up-password">Senha atual</Label>
            <Input
              id="step-up-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(error)}
            />
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={cancel} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!password || submitting}>
              {submitting ? "Confirmando..." : "Confirmar e continuar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
