import { ChevronRight, UserRound, Users } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProjectDetailsResponse } from "@/features/projects/projects.types"

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function ProjectTeamSummary({
  canManage,
  details,
  onShowTeam,
}: {
  canManage: boolean
  details: ProjectDetailsResponse
  onShowTeam: () => void
}) {
  const preview = details.project.members.slice(0, 4)
  const remaining = Math.max(0, details.project.members.length - preview.length)

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Equipe do projeto</CardTitle>
        <Badge variant="outline">{details.operationalSummary.membersCount + 1} pessoa(s)</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
          <Avatar>
            <AvatarFallback>{initials(details.project.owner.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{details.project.owner.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              USR-{details.project.owner.userCode} · Responsável
            </p>
          </div>
          <UserRound className="size-4 text-primary" />
        </div>

        {preview.length ? (
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {preview.map((member) => (
                <Avatar key={member.id} className="border-2 border-background">
                  <AvatarFallback className="text-xs">{initials(member.user.name)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium">{details.project.members.length} membro(s)</p>
              <p className="truncate text-xs text-muted-foreground">
                {preview.map((member) => member.user.name).join(", ")}
                {remaining > 0 ? ` e mais ${remaining}` : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            <Users className="size-5" />
            Nenhum membro adicional vinculado.
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={onShowTeam}>
          {canManage ? "Gerenciar equipe" : "Ver equipe"}
          <ChevronRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
