import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, UserRound } from "lucide-react"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserRole } from "@/features/auth/auth.types"
import { isMilitaryRank, militaryRanks } from "@/features/users/military-ranks"
import type { AdminUser, UserFormPayload } from "@/features/users/users.types"

const NO_RANK = "NONE"

const schema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo."),
  warName: z.string(),
  email: z.email("Informe um e-mail válido."),
  password: z.string(),
  role: z.enum(["ADMIN", "GESTOR", "PROJETISTA", "CONSULTA"]),
  rank: z.union([z.literal(""), z.enum(militaryRanks)]),
  cpf: z.string(),
})

type FormValues = z.infer<typeof schema>

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  PROJETISTA: "Projetista",
  CONSULTA: "Consulta",
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: AdminUser | null
  currentUserId?: string
  pending: boolean
  onSubmit: (payload: UserFormPayload) => Promise<void>
}

export function UserDialog({ open, onOpenChange, user, currentUserId, pending, onSubmit }: Props) {
  const isEditingSelf = user?.id === currentUserId
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", warName: "", email: "", password: "", role: "PROJETISTA", rank: "", cpf: "" },
  })
  const role = useWatch({ control: form.control, name: "role" })
  const rank = useWatch({ control: form.control, name: "rank" })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: user?.name ?? "",
      warName: user?.warName ?? "",
      email: user?.email ?? "",
      password: "",
      role: user?.role ?? "PROJETISTA",
      rank: user?.rank && isMilitaryRank(user.rank) ? user.rank : "",
      cpf: user?.cpf ?? "",
    })
  }, [form, open, user])

  const submit = form.handleSubmit(async (values) => {
    if (!user && values.password.length < 6) {
      form.setError("password", { message: "A senha deve ter pelo menos 6 caracteres." })
      return
    }

    await onSubmit({
      name: values.name.trim(),
      warName: values.warName.trim() || (user ? null : undefined),
      email: values.email.trim().toLowerCase(),
      password: user ? undefined : values.password,
      role: values.role,
      rank: values.rank || (user ? null : undefined),
      cpf: values.cpf.trim() || undefined,
    })
  })

  const availableRoles: UserRole[] = user ? ["ADMIN", "GESTOR", "PROJETISTA", "CONSULTA"] : ["GESTOR", "PROJETISTA", "CONSULTA"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserRound className="size-5 text-primary" />{user ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>{user ? "Atualize os dados funcionais e o perfil de acesso." : "Crie uma conta e defina o perfil inicial de acesso ao SAGEP."}</DialogDescription>
        </DialogHeader>

        <form id="user-form" className="space-y-4" onSubmit={submit}>
          <div className="space-y-2"><Label htmlFor="user-name">Nome completo</Label><Input id="user-name" {...form.register("name")} autoFocus />{form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}</div>
          <div className="space-y-2"><Label htmlFor="user-email">E-mail</Label><Input id="user-email" type="email" {...form.register("email")} />{form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}</div>

          {!user && <div className="space-y-2"><Label htmlFor="user-password">Senha inicial</Label><Input id="user-password" type="password" autoComplete="new-password" {...form.register("password")} />{form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}</div>}

          <div className="space-y-2">
            <Label>Perfil</Label>
            <Select value={role} disabled={isEditingSelf} onValueChange={(value) => form.setValue("role", value as UserRole, { shouldValidate: true })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{availableRoles.map((value) => <SelectItem key={value} value={value}>{roleLabels[value]}</SelectItem>)}</SelectContent></Select>
            {isEditingSelf && <p className="text-xs text-muted-foreground">Seu próprio perfil ADMIN não pode ser removido nesta tela.</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-rank">Posto/graduação</Label>
              <Select
                value={rank || NO_RANK}
                onValueChange={(value) => form.setValue("rank", value === NO_RANK ? "" : value as FormValues["rank"], { shouldValidate: true })}
              >
                <SelectTrigger id="user-rank"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_RANK}>Não informado</SelectItem>
                  {militaryRanks.map((rank) => <SelectItem key={rank} value={rank}>{rank}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="user-war-name">Nome de guerra</Label><Input id="user-war-name" placeholder="Ex.: Lima" {...form.register("warName")} /></div>
            <div className="space-y-2"><Label htmlFor="user-cpf">CPF</Label><Input id="user-cpf" inputMode="numeric" placeholder="000.000.000-00" {...form.register("cpf")} /></div>
          </div>
        </form>

        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancelar</Button><Button type="submit" form="user-form" disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" />}{user ? "Salvar alterações" : "Criar usuário"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
