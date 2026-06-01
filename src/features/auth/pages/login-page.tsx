//import { Navigate } from "react-router"
import { ArrowRight, BadgeCheck, Lock, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginPage() {
  const demoLogin = () => {
    toast.success("Login visual validado. A integração com a API vem na próxima fase.")
  }

  return (
    <div className="grid min-h-screen bg-slate-950 text-white lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden p-10 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.32),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.20),transparent_32%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[48px_48px]" />

        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <Badge className="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15">
              4º Centro de Telemática de Área
            </Badge>

            <h1 className="mt-8 max-w-2xl text-5xl font-semibold tracking-tight">
              Gestão técnica de projetos com rastreabilidade documental.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              Controle integrado de estimativas, Notas de Crédito, DIEx
              requisitório, Notas de Empenho, Ordens de Serviço, execução,
              auditoria e saldo de itens da ATA.
            </p>
          </div>

          <div className="grid max-w-3xl grid-cols-3 gap-4">
            {[
              ["Workflow", "Fluxo documental rígido"],
              ["Auditoria", "Histórico rastreável"],
              ["Dashboards", "Visão operacional e executiva"],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <BadgeCheck className="mb-3 size-5 text-emerald-300" />
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-[#f5f7f4] p-6 text-slate-950">
        <Card className="w-full max-w-md border-none shadow-2xl">
          <CardContent className="p-8">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-emerald-300">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.28em] text-emerald-700">
                  SAGEP
                </p>
                <p className="text-sm text-slate-500">
                  Sistema de Apoio à Gestão de Projetos
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight">
              Acesse sua conta
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Entre com suas credenciais institucionais para acessar o painel.
            </p>

            <div className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@sagep.com"
                  defaultValue="admin@sagep.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  defaultValue="123456"
                />
              </div>

              <Button className="h-11 w-full gap-2" onClick={demoLogin}>
                Entrar no sistema
                <ArrowRight className="size-4" />
              </Button>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
              <Lock className="mt-0.5 size-4 text-slate-500" />
              <p>
                A próxima etapa vai conectar esta tela ao endpoint real{" "}
                <strong>POST /auth/login</strong>.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}