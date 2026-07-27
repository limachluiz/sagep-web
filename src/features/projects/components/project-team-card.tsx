import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, UserRound } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { projectsService } from "@/features/projects/projects.service"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"
import { usersService } from "@/features/users/users.service"

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}

type ProjectTeamCardProps = {
  details: ProjectDetailsResponse
  canManage: boolean
}

export function ProjectTeamCard({ details, canManage }: ProjectTeamCardProps) {
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [memberRole, setMemberRole] = useState("")
  const [memberToRemove, setMemberToRemove] = useState<ProjectDetailsResponse["project"]["members"][number] | null>(null)

  const refreshProject = () => queryClient.invalidateQueries({ queryKey: ["projects", "details", details.project.id] })
  const userOptionsQuery = useQuery({
    queryKey: ["users", "options"],
    queryFn: () => usersService.options(),
    enabled: addOpen,
  })
  const unavailableIds = new Set([
    details.project.owner.id,
    ...details.project.members.map((member) => member.user.id),
  ])
  const availableUsers = userOptionsQuery.data?.items.filter((user) => !unavailableIds.has(user.id)) ?? []

  const addMutation = useMutation({
    mutationFn: () => projectsService.addMember(details.project.id, {
      userId: selectedUserId,
      role: memberRole.trim() || undefined,
    }),
    onSuccess: (member) => {
      toast.success(`${member.user.name} foi adicionado à equipe.`)
      setSelectedUserId("")
      setMemberRole("")
      setAddOpen(false)
      refreshProject()
    },
    onError: (error) => toast.error(error.message),
  })

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => projectsService.removeMember(details.project.id, memberId),
    onSuccess: (response) => {
      toast.success(response.message)
      setMemberToRemove(null)
      refreshProject()
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <>
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Equipe</CardTitle>
          {canManage && <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}><Plus className="size-4" />Adicionar</Button>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Responsável</p>
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
              <Avatar><AvatarFallback>{initials(details.project.owner.name)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{details.project.owner.name}</p>
                <p className="truncate text-xs text-muted-foreground">{details.project.owner.email}</p>
              </div>
              <Badge>Responsável</Badge>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Membros</p>
            {details.project.members.length ? (
              <div className="space-y-2">
                {details.project.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-xl border p-3">
                    <Avatar className="size-8"><AvatarFallback className="text-xs">{initials(member.user.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{member.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">USR-{member.user.userCode} · {member.user.email}</p>
                    </div>
                    <Badge variant="outline">{member.role || "Membro"}</Badge>
                    {canManage && (
                      <Button variant="ghost" size="icon-sm" title="Remover membro" onClick={() => setMemberToRemove(member)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-xl border border-dashed p-6 text-center">
                <UserRound className="size-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Nenhum membro adicional.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar membro</DialogTitle>
            <DialogDescription>Selecione um usuário ativo cadastrado no SAGEP.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={userOptionsQuery.isLoading || userOptionsQuery.isError}>
                <SelectTrigger className="w-full" aria-label="Usuário da equipe">
                  <SelectValue placeholder={userOptionsQuery.isLoading ? "Carregando usuários..." : "Selecione um usuário"} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} · USR-{user.userCode}{user.rank ? ` · ${user.rank}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {userOptionsQuery.isError && <p className="text-xs text-destructive">Não foi possível carregar os usuários disponíveis.</p>}
              {!userOptionsQuery.isLoading && !userOptionsQuery.isError && availableUsers.length === 0 && (
                <p className="text-xs text-muted-foreground">Todos os usuários ativos já estão vinculados a este projeto.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-role">Função no projeto (opcional)</Label>
              <Input id="member-role" placeholder="Ex.: Fiscal técnico" value={memberRole} onChange={(event) => setMemberRole(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={addMutation.isPending}>Cancelar</Button></DialogClose>
            <Button disabled={!selectedUserId || addMutation.isPending} onClick={() => addMutation.mutate()}>
              {addMutation.isPending && <Loader2 className="size-4 animate-spin" />}Adicionar membro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(memberToRemove)} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover membro da equipe?</DialogTitle>
            <DialogDescription>
              {memberToRemove?.user.name} perderá o acesso vinculado a este projeto. Usuários com tarefas atribuídas não podem ser removidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={removeMutation.isPending}>Cancelar</Button></DialogClose>
            <Button variant="destructive" disabled={removeMutation.isPending} onClick={() => memberToRemove && removeMutation.mutate(memberToRemove.id)}>
              {removeMutation.isPending && <Loader2 className="size-4 animate-spin" />}Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
