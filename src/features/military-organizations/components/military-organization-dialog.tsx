import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MilitaryOrganizationPayload } from "@/features/projects/military-organizations.service"
import type { FederativeUnit, MilitaryOrganization } from "@/features/projects/projects.types"

const schema = z.object({
  sigla: z.string().trim().min(2, "Informe uma sigla válida."),
  name: z.string().trim().min(3, "Informe o nome completo da OM."),
  cityName: z.string().trim().min(2, "Informe a cidade."),
  stateUf: z.enum(["AM", "RO", "RR", "AC"], { message: "Selecione o estado." }),
})

type FormValues = z.infer<typeof schema>

const stateLabels: Record<FederativeUnit, string> = {
  AM: "Amazonas",
  RO: "Rondônia",
  RR: "Roraima",
  AC: "Acre",
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization?: MilitaryOrganization | null
  pending: boolean
  onSubmit: (payload: MilitaryOrganizationPayload) => Promise<void>
}

export function MilitaryOrganizationDialog({ open, onOpenChange, organization, pending, onSubmit }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { sigla: "", name: "", cityName: "", stateUf: undefined },
  })
  const stateUf = useWatch({ control: form.control, name: "stateUf" })

  useEffect(() => {
    if (!open) return
    form.reset({
      sigla: organization?.sigla ?? "",
      name: organization?.name ?? "",
      cityName: organization?.cityName ?? "",
      stateUf: organization?.stateUf,
    })
  }, [form, open, organization])

  const submit = form.handleSubmit(async (values) => {
    await onSubmit({
      sigla: values.sigla.trim().toUpperCase(),
      name: values.name.trim(),
      cityName: values.cityName.trim(),
      stateUf: values.stateUf,
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Building2 className="size-5 text-primary" />{organization ? "Editar Organização Militar" : "Nova Organização Militar"}</DialogTitle>
          <DialogDescription>{organization ? "Atualize os dados usados na classificação e nas estimativas dos projetos." : "Cadastre uma OM para disponibilizá-la nos fluxos de projeto do estado correspondente."}</DialogDescription>
        </DialogHeader>

        <form id="military-organization-form" className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="om-sigla">Sigla</Label>
              <Input id="om-sigla" placeholder="Ex.: 4º CTA" {...form.register("sigla")} autoFocus />
              {form.formState.errors.sigla && <p className="text-xs text-destructive">{form.formState.errors.sigla.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={stateUf} onValueChange={(value) => form.setValue("stateUf", value as FederativeUnit, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{Object.entries(stateLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
              {form.formState.errors.stateUf && <p className="text-xs text-destructive">{form.formState.errors.stateUf.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="om-name">Nome completo</Label>
            <Input id="om-name" placeholder="Ex.: 4º Centro de Telemática de Área" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="om-city">Cidade</Label>
            <Input id="om-city" placeholder="Ex.: Manaus" {...form.register("cityName")} />
            {form.formState.errors.cityName && <p className="text-xs text-destructive">{form.formState.errors.cityName.message}</p>}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancelar</Button>
          <Button type="submit" form="military-organization-form" disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" />}{organization ? "Salvar alterações" : "Cadastrar OM"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
