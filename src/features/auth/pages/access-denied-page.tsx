import { ArrowLeft, ShieldX } from "lucide-react"
import { Link, useLocation } from "react-router"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function AccessDeniedPage() {
  const location = useLocation()
  const requestedPath = location.state?.requestedPath as string | undefined

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
      <Card className="w-full max-w-lg border-none shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-800">
            <ShieldX className="size-8" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold">Acesso não autorizado</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Seu perfil não possui a permissão necessária para acessar esta área.
            {requestedPath ? ` Rota solicitada: ${requestedPath}.` : ""}
          </p>
          <Button asChild className="mt-6 gap-2">
            <Link to="/dashboard">
              <ArrowLeft className="size-4" />
              Voltar ao dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
