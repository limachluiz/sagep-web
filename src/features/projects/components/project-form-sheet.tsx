import { zodResolver } from "@hookform/resolvers/zod"
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
import type {
  ProjectDetailsResponse,
  ProjectMutationPayload,
  ProjectStatus,
} from "@/features/projects/projects.types"

const schema = z.object({
  title: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres."),
  description: z.string(),
  status: z.enum(["PLANEJAMENTO", "EM_ANDAMENTO", "PAUSADO", "CONCLUIDO", "CANCELADO"]),
  startDate: z.string(),
  endDate: z.string(),
}).refine(({ startDate, endDate }) => !startDate || !endDate || endDate >= startDate, {
  message: "A data final não pode ser anterior à data inicial.",
  path: ["endDate"],
})

type FormValues = z.infer<typeof schema>

const statusLabels: Record<ProjectStatus, string> = {
  PLANEJAMENTO: "Planejamento",
  EM_ANDAMENTO: "Em andamento",
  PAUSADO: "Pausado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
}

type ProjectFormSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: ProjectDetailsResponse["project"] & { status: ProjectStatus }
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
      description: "",
      status: "PLANEJAMENTO",
      startDate: "",
      endDate: "",
    },
  })
  const status = useWatch({ control: form.control, name: "status" })

  useEffect(() => {
    if (!open) return
    form.reset({
      title: project?.title ?? "",
      description: project?.description ?? "",
      status: project?.status ?? "PLANEJAMENTO",
      startDate: dateInputValue(project?.startDate),
      endDate: dateInputValue(project?.endDate),
    })
  }, [form, open, project])

  const submit = form.handleSubmit(async (values) => {
    const payload: ProjectMutationPayload = {
      title: values.title.trim(),
      status: values.status,
    }

    if (values.description.trim()) payload.description = values.description.trim()
    if (values.startDate) payload.startDate = values.startDate
    if (values.endDate) payload.endDate = values.endDate

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
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => form.setValue("status", value as ProjectStatus, { shouldValidate: true })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-start-date">Início previsto</Label>
              <Input id="project-start-date" type="date" {...form.register("startDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-end-date">Término previsto</Label>
              <Input id="project-end-date" type="date" {...form.register("endDate")} />
              {form.formState.errors.endDate && <p className="text-xs text-destructive">{form.formState.errors.endDate.message}</p>}
            </div>
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
