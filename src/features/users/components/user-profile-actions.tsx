import { useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  BellRing,
  Camera,
  KeyRound,
  Loader2,
  MonitorCog,
  Trash2,
  UserRoundPen,
} from "lucide-react"
import { useNavigate } from "react-router"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { authService } from "@/features/auth/auth.service"
import { useAuthStore } from "@/features/auth/auth.store"
import type {
  AuthUser,
  UpdateOwnProfilePayload,
  UserThemePreference,
} from "@/features/auth/auth.types"

const MAX_AVATAR_BYTES = 256 * 1024
const AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])

function getInitials(user: AuthUser) {
  return (user.name?.trim() || user.email)
    .split(/[.\s_@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function cpfDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11)
}

function formatCpfInput(value: string) {
  const digits = cpfDigits(value)
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2")
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11)
}

function formatPhoneInput(value: string) {
  const digits = phoneDigits(value)
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  }
  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
}

function readAvatar(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."))
    reader.readAsDataURL(file)
  })
}

export function EditOwnProfileDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AuthUser
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(user.name ?? "")
  const [warName, setWarName] = useState(user.warName ?? "")
  const [rank, setRank] = useState(user.rank ?? "")
  const [cpf, setCpf] = useState(formatCpfInput(user.cpf ?? ""))
  const [phone, setPhone] = useState(formatPhoneInput(user.phone ?? ""))
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(user.avatarDataUrl ?? null)
  const [formError, setFormError] = useState("")

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateOwnProfilePayload) => authService.updateProfile(payload),
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
      queryClient.setQueryData(["auth", "me"], updatedUser)
      toast.success("Dados pessoais atualizados.")
      onOpenChange(false)
    },
    onError: (error) => setFormError(error.message),
  })

  const selectAvatar = async (file?: File) => {
    setFormError("")
    if (!file) return
    if (!AVATAR_TYPES.has(file.type)) {
      setFormError("Use uma imagem PNG, JPEG ou WebP.")
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setFormError("A imagem deve ter no máximo 256 KB.")
      return
    }
    try {
      setAvatarDataUrl(await readAvatar(file))
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Não foi possível ler a imagem.")
    }
  }

  const submit = () => {
    setFormError("")
    const normalizedName = name.trim()
    const normalizedCpf = cpfDigits(cpf)
    const normalizedPhone = phoneDigits(phone)
    if (normalizedName.length < 3) {
      setFormError("O nome deve ter pelo menos 3 caracteres.")
      return
    }
    if (normalizedCpf && normalizedCpf.length !== 11) {
      setFormError("O CPF deve conter 11 dígitos.")
      return
    }
    if (normalizedPhone && ![10, 11].includes(normalizedPhone.length)) {
      setFormError("O telefone deve conter 10 ou 11 dígitos.")
      return
    }
    updateMutation.mutate({
      name: normalizedName,
      warName: warName.trim() || null,
      rank: rank.trim() || null,
      cpf: normalizedCpf || null,
      phone: normalizedPhone || null,
      avatarDataUrl,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRoundPen className="size-5 text-primary" />
            Editar dados pessoais
          </DialogTitle>
          <DialogDescription>
            Atualize sua identificação. E-mail, perfil e permissões são administrados separadamente.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-5 overflow-y-auto pr-1">
          <div className="flex flex-col items-center gap-4 rounded-lg border bg-muted/20 p-4 sm:flex-row">
            <Avatar className="size-20">
              {avatarDataUrl && <AvatarImage src={avatarDataUrl} alt="" />}
              <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-wrap justify-center gap-2 sm:justify-start">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => void selectAvatar(event.target.files?.[0])}
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Camera className="size-4" />Escolher imagem
              </Button>
              {avatarDataUrl && (
                <Button type="button" variant="ghost" onClick={() => setAvatarDataUrl(null)}>
                  <Trash2 className="size-4" />Remover
                </Button>
              )}
              <p className="w-full text-center text-xs text-muted-foreground sm:text-left">
                PNG, JPEG ou WebP, até 256 KB.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="own-profile-name">Nome completo</Label>
            <Input
              id="own-profile-name"
              value={name}
              maxLength={120}
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="own-profile-email">E-mail institucional</Label>
            <Input id="own-profile-email" value={user.email} disabled />
            <p className="text-xs text-muted-foreground">Alterações de e-mail são feitas por um administrador.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="own-profile-rank">Posto/graduação</Label>
              <Input
                id="own-profile-rank"
                value={rank}
                maxLength={80}
                onChange={(event) => setRank(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="own-profile-war-name">Nome de guerra</Label>
              <Input
                id="own-profile-war-name"
                value={warName}
                maxLength={80}
                placeholder="Ex.: Lima"
                onChange={(event) => setWarName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="own-profile-cpf">CPF</Label>
              <Input
                id="own-profile-cpf"
                value={cpf}
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                onChange={(event) => setCpf(formatCpfInput(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="own-profile-phone">Telefone</Label>
              <Input
                id="own-profile-phone"
                type="tel"
                value={phone}
                inputMode="tel"
                autoComplete="tel"
                placeholder="(92) 99999-9999"
                onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
              />
            </div>
          </div>
          {formError && (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível salvar</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={submit} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ChangeOwnPasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useAuthStore((state) => state.logout)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [formError, setFormError] = useState("")

  const mutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: (response) => {
      toast.success(response.message)
      logout()
      queryClient.clear()
      navigate("/login", { replace: true })
    },
    onError: (error) => setFormError(error.message),
  })

  const submit = () => {
    setFormError("")
    if (newPassword.length < 8) {
      setFormError("A nova senha deve ter pelo menos 8 caracteres.")
      return
    }
    if (newPassword !== confirmation) {
      setFormError("A confirmação não corresponde à nova senha.")
      return
    }
    if (currentPassword === newPassword) {
      setFormError("A nova senha deve ser diferente da senha atual.")
      return
    }
    mutation.mutate({ currentPassword, newPassword })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />Alterar senha
          </DialogTitle>
          <DialogDescription>
            Por segurança, a troca encerra todas as sessões e exige um novo login.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha atual</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-new-password">Confirmar nova senha</Label>
            <Input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>
          {formError && (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível alterar a senha</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={submit} disabled={mutation.isPending || !currentPassword || !newPassword || !confirmation}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Alterar e sair
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PreferenceToggle({
  id,
  checked,
  onChange,
  title,
  description,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  title: string
  description: string
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition hover:border-primary/35 hover:bg-muted/25">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-primary"
      />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
    </label>
  )
}

export function UserPreferencesCard({ user }: { user: AuthUser }) {
  const { setTheme } = useTheme()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)
  const [themePreference, setThemePreference] = useState<UserThemePreference>(
    user.themePreference ?? "DARK",
  )
  const [notifications, setNotifications] = useState(
    user.notifications ?? {
      taskAssignments: true,
      deadlines: true,
      workflowUpdates: true,
    },
  )

  const mutation = useMutation({
    mutationFn: () =>
      authService.updateProfile({ themePreference, notifications }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser)
      queryClient.setQueryData(["auth", "me"], updatedUser)
      setTheme(themePreference.toLowerCase())
      toast.success("Preferências atualizadas.")
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MonitorCog className="size-5 text-primary" />Preferências pessoais
        </CardTitle>
        <CardDescription>
          Defina a aparência do SAGEP e quais avisos devem aparecer para sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="theme-preference">Tema da interface</Label>
          <Select
            value={themePreference}
            onValueChange={(value) => setThemePreference(value as UserThemePreference)}
          >
            <SelectTrigger id="theme-preference" className="w-full sm:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LIGHT">Claro</SelectItem>
              <SelectItem value="DARK">Escuro</SelectItem>
              <SelectItem value="SYSTEM">Usar preferência do dispositivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <BellRing className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Avisos no sistema</h3>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <PreferenceToggle
              id="notify-task-assignments"
              checked={notifications.taskAssignments}
              onChange={(checked) => setNotifications((current) => ({ ...current, taskAssignments: checked }))}
              title="Atribuições de tarefas"
              description="Avisar quando uma tarefa for atribuída à sua conta."
            />
            <PreferenceToggle
              id="notify-deadlines"
              checked={notifications.deadlines}
              onChange={(checked) => setNotifications((current) => ({ ...current, deadlines: checked }))}
              title="Prazos e atrasos"
              description="Destacar tarefas e documentos próximos do vencimento."
            />
            <PreferenceToggle
              id="notify-workflow"
              checked={notifications.workflowUpdates}
              onChange={(checked) => setNotifications((current) => ({ ...current, workflowUpdates: checked }))}
              title="Mudanças no workflow"
              description="Avisar sobre avanços relevantes nos projetos acompanhados."
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar preferências
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
