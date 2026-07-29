import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Fingerprint,
  KeyRound,
  Mail,
  MonitorSmartphone,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react"
import { Link } from "react-router"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { authService } from "@/features/auth/auth.service"
import { useAuthStore } from "@/features/auth/auth.store"
import type { AccessPermissionGroup, AuthUser } from "@/features/auth/auth.types"
import {
  formatProfileDate,
  getAccessGroups,
  maskCpf,
  roleDescriptions,
  roleLabels,
} from "@/features/users/user-profile.utils"

function getInitials(user: AuthUser) {
  const source = user.name?.trim() || user.email.split("@")[0]
  return source
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-lg border border-border/70 bg-muted/25 p-3.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function AccessGroupGrid({ groups }: { groups: AccessPermissionGroup[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <div key={group.name} className="flex items-center gap-3 rounded-lg border border-border/70 bg-background p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <KeyRound className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{group.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {group.permissions.length} {group.permissions.length === 1 ? "permissão efetiva" : "permissões efetivas"}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function UserProfilePage() {
  const currentUser = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const [search, setSearch] = useState("")

  const profileQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
    initialData: currentUser ?? undefined,
    enabled: Boolean(currentUser),
    refetchOnWindowFocus: false,
  })

  const user = profileQuery.data ?? currentUser
  const groups = useMemo(() => user ? getAccessGroups(user) : [], [user])
  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR")
  const filteredGroups = useMemo(() => {
    if (!normalizedSearch) return groups

    return groups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter((permission) =>
          [group.name, permission.code, permission.description]
            .join(" ")
            .toLocaleLowerCase("pt-BR")
            .includes(normalizedSearch),
        ),
      }))
      .filter((group) => group.permissions.length > 0)
  }, [groups, normalizedSearch])

  if (!user) {
    return (
      <div className="space-y-5" role="status" aria-live="polite">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  const displayName = user.name?.trim() || user.email
  const permissionCount = user.permissions?.length ?? 0
  const active = user.active !== false
  const canManageSessions = hasPermission("sessions.manage_own")
  const canManageUsers = hasPermission("users.manage")
  const canViewPermissions = hasPermission("permissions.view")

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Minha conta"
        title="Perfil e acessos"
        description="Consulte seus dados, perfil funcional e todas as permissões efetivas da sessão atual."
        icon={UserRound}
        actions={
          canManageSessions ? (
            <Button asChild variant="outline">
              <Link to="/sessions"><MonitorSmartphone className="size-4" />Minhas sessões</Link>
            </Button>
          ) : undefined
        }
      />

      {profileQuery.isError && (
        <Alert variant="destructive">
          <Activity />
          <AlertTitle>Não foi possível atualizar o perfil</AlertTitle>
          <AlertDescription>Os dados salvos na sessão continuam disponíveis. Tente novamente mais tarde.</AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden border-primary/15 shadow-sm">
        <div className="h-1.5 bg-primary" />
        <CardContent className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center">
          <Avatar className="size-20">
            <AvatarFallback className="border-2 border-primary/25 bg-primary/10 text-xl font-bold text-primary">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-words text-2xl font-semibold">{displayName}</h2>
              <Badge variant={active ? "default" : "secondary"}>
                <BadgeCheck className="size-3.5" />{active ? "Conta ativa" : "Conta inativa"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{user.rank || "Posto/graduação não informado"} · {user.email}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{roleLabels[user.role]}</Badge>
              {user.userCode && <Badge variant="outline" className="font-mono">USR-{user.userCode}</Badge>}
              <Badge variant="outline">{groups.length} grupos de acesso</Badge>
              <Badge variant="outline">{permissionCount} permissões</Badge>
            </div>
          </div>
          <div className="rounded-lg border border-primary/15 bg-primary/5 p-4 lg:max-w-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Perfil funcional</p>
            <p className="mt-1 font-semibold">{roleLabels[user.role]}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{roleDescriptions[user.role]}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="h-auto w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="overview"><UserRound className="size-4" />Visão geral</TabsTrigger>
          <TabsTrigger value="permissions"><ShieldCheck className="size-4" />Permissões ({permissionCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Dados da conta</CardTitle>
                <CardDescription>Informações vinculadas à sua identificação no SAGEP.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <ProfileField icon={Mail} label="E-mail institucional" value={user.email} />
                <ProfileField icon={Fingerprint} label="CPF" value={maskCpf(user.cpf)} />
                <ProfileField icon={CalendarDays} label="Membro desde" value={formatProfileDate(user.createdAt)} />
                <ProfileField icon={Clock3} label="Último acesso" value={formatProfileDate(user.lastLoginAt, true)} />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Atalhos da conta</CardTitle>
                <CardDescription>Ações disponíveis conforme seu acesso.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {canManageSessions && (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/sessions"><MonitorSmartphone className="size-4" />Gerenciar minhas sessões</Link>
                  </Button>
                )}
                {canManageUsers && (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/users"><UsersRound className="size-4" />Administrar usuários</Link>
                  </Button>
                )}
                {canViewPermissions && (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/settings"><ShieldCheck className="size-4" />Governança de acessos</Link>
                  </Button>
                )}
                {!canManageSessions && !canManageUsers && !canViewPermissions && (
                  <p className="rounded-lg border border-dashed p-4 text-sm leading-5 text-muted-foreground">
                    Não há ações administrativas disponíveis para este perfil.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Grupos de acesso</CardTitle>
              <CardDescription>Áreas do SAGEP nas quais você possui ao menos uma permissão efetiva.</CardDescription>
            </CardHeader>
            <CardContent>
              {groups.length > 0 ? (
                <AccessGroupGrid groups={groups} />
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <KeyRound className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 font-medium">Nenhum grupo de acesso disponível</p>
                  <p className="mt-1 text-sm text-muted-foreground">Seu perfil ainda não possui permissões efetivas.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle>Permissões efetivas</CardTitle>
                <CardDescription className="mt-1">Resultado da matriz do perfil e das exceções individuais aplicadas à sua conta.</CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar permissão..."
                  aria-label="Buscar permissão"
                  className="pl-9"
                />
              </div>
            </CardHeader>
          </Card>

          {filteredGroups.length > 0 ? filteredGroups.map((group) => (
            <Card key={group.name} className="overflow-hidden shadow-sm">
              <CardHeader className="border-b bg-muted/20 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <CardDescription>{group.permissions.length} {group.permissions.length === 1 ? "permissão" : "permissões"}</CardDescription>
                  </div>
                  <Badge variant="outline"><KeyRound className="size-3.5" />Acesso efetivo</Badge>
                </div>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {group.permissions.map((permission) => (
                  <div key={permission.code} className="flex items-start gap-3 px-5 py-4">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{permission.description}</p>
                        {permission.critical && <Badge variant="destructive">Sensível</Badge>}
                      </div>
                      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{permission.code}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )) : (
            <Card className="border-dashed bg-muted/15 shadow-none">
              <CardContent className="py-12 text-center">
                <Search className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 font-medium">Nenhuma permissão encontrada</p>
                <p className="mt-1 text-sm text-muted-foreground">Tente buscar por outro termo ou grupo.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
