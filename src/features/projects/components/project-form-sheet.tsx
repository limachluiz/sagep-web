import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { militaryOrganizationsService } from "@/features/projects/military-organizations.service"
import type {
  FederativeUnit,
  ProjectDetailsResponse,
  ProjectMutationPayload,
  ProjectType,
} from "@/features/projects/projects.types"

const schema = z.object({
  title: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres."),
  projectType: z.enum(["CFTV", "FIBRA_OPTICA_PONTO_LOGICO"], { message: "Selecione o tipo do projeto." }),
  stateUf: z.enum(["AM", "RO", "RR", "AC"], { message: "Selecione o estado." }),
  omId: z.string().min(1, "Selecione a Organização Militar."),
  description: z.string(),
  startDate: z.string(),
})

type FormValues = z.infer<typeof schema>

const projectTypeLabels: Record<ProjectType, string> = {
  CFTV: "CFTV",
  FIBRA_OPTICA_PONTO_LOGICO: "Fibra Óptica / Ponto Lógico",
}

const stateLabels: Record<FederativeUnit, string> = {
  AM: "Amazonas",
  RO: "Rondônia",
  RR: "Roraima",
  AC: "Acre",
}

type ProjectFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: ProjectDetailsResponse["project"]
  pending?: boolean
  onSubmit: (payload: ProjectMutationPayload) => Promise<void>
}

function dateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : ""
}

export function ProjectFormSheet({ open, onOpenChange, project, pending, onSubmit }: ProjectFormSheetProps) {
  const isEditing = Boolean(project)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      projectType: undefined,
      stateUf: undefined,
      omId: "",
      description: "",
      startDate: "",
    },
  })
  const projectType = useWatch({ control: form.control, name: "projectType" })
  const stateUf = useWatch({ control: form.control, name: "stateUf" })
  const omId = useWatch({ control: form.control, name: "omId" })

  const organizationsQuery = useQuery({
    queryKey: ["military-organizations", stateUf, projectType],
    queryFn: () => militaryOrganizationsService.list({
      stateUf,
      cityName: projectType === "CFTV" ? "Manaus" : undefined,
      active: true,
    }),
    enabled: open && Boolean(stateUf && projectType),
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      title: project?.title ?? "",
      projectType: project?.projectType ?? undefined,
      stateUf: project?.om?.stateUf ?? undefined,
      omId: project?.omId ?? "",
      description: project?.description ?? "",
      startDate: dateInputValue(project?.startDate),
    })
  }, [form, open, project])

  const submit = form.handleSubmit(async (values) => {
    const payload: ProjectMutationPayload = {
      title: values.title.trim(),
      projectType: values.projectType,
      omId: values.omId,
    }

    if (values.description.trim()) payload.description = values.description.trim()
    if (values.startDate) payload.startDate = values.startDate

    await onSubmit(payload)
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-xl">{isEditing ? "Editar projeto" : "Novo projeto"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Atualize os dados gerais. O responsável permanece vinculado à criação do projeto."
              : "O projeto será criado sob sua responsabilidade e iniciará na etapa de estimativa de preço."}
          </SheetDescription>
        </SheetHeader>

        <form id="project-form" className="space-y-5 px-6 py-2" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="project-title">Título</Label>
            <Input id="project-title" placeholder="Ex.: Adequação elétrica do pavilhão" {...form.register("title")} />
            {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Descrição</Label>
            <Textarea id="project-description" rows={5} placeholder="Objetivo, escopo e observações relevantes..." {...form.register("description")} />
          </div>

          <div className="space-y-2">
            <Label>Tipo do projeto</Label>
            <Select
              value={projectType}
              onValueChange={(value) => {
                const nextType = value as ProjectType
                form.setValue("projectType", nextType, { shouldValidate: true })
                if (nextType === "CFTV") form.setValue("stateUf", "AM", { shouldValidate: true })
                else form.resetField("stateUf")
                form.setValue("omId", "", { shouldValidate: false })
              }}
            >
              <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>
                {Object.entries(projectTypeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.formState.errors.projectType && <p className="text-xs text-destructive">{form.formState.errors.projectType.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={stateUf}
                disabled={!projectType || projectType === "CFTV"}
                onValueChange={(value) => {
                  form.setValue("stateUf", value as FederativeUnit, { shouldValidate: true })
                  form.setValue("omId", "", { shouldValidate: false })
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(stateLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
              {projectType === "CFTV" && <p className="text-xs text-muted-foreground">A ATA de CFTV atende exclusivamente Manaus/AM.</p>}
              {form.formState.errors.stateUf && <p className="text-xs text-destructive">{form.formState.errors.stateUf.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Organização Militar</Label>
              <Select value={omId} disabled={!stateUf || organizationsQuery.isLoading} onValueChange={(value) => form.setValue("omId", value, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder={organizationsQuery.isLoading ? "Carregando OMs..." : "Selecione a OM"} /></SelectTrigger>
                <SelectContent>
                  {organizationsQuery.data?.items.map((om) => (
                    <SelectItem key={om.id} value={om.id}>{om.sigla} · {om.name} ({om.cityName})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {organizationsQuery.isError && <p className="text-xs text-destructive">Não foi possível carregar as OMs deste estado.</p>}
              {form.formState.errors.omId && <p className="text-xs text-destructive">{form.formState.errors.omId.message}</p>}
            </div>
          </div>

          <div className="rounded-xl border bg-muted/40 p-4 text-sm">
            <p className="font-medium">Status gerenciado pelo workflow</p>
            <p className="mt-1 leading-5 text-muted-foreground">
              O projeto inicia em Planejamento, passa para Em andamento após a estimativa e é concluído ao final do fluxo.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-start-date">Data de início (opcional)</Label>
            <Input id="project-start-date" type="date" {...form.register("startDate")} />
          </div>
        </form>

        <SheetFooter className="border-t px-6 py-5 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancelar</Button>
          <Button type="submit" form="project-form" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isEditing ? "Salvar alterações" : "Criar projeto"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
