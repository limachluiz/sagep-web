import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { Building2, CalendarDays, Check, ChevronsUpDown, FileText, Loader2, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { FormSection } from "@/components/form-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  const [cityFilter, setCityFilter] = useState("all")
  const [organizationSearch, setOrganizationSearch] = useState("")
  const [organizationPickerOpen, setOrganizationPickerOpen] = useState(false)
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
      active: true,
      pageSize: 100,
    }),
    enabled: open && Boolean(stateUf && projectType),
  })

  const stateOrganizations = useMemo(() => (organizationsQuery.data?.items ?? []).filter((organization) =>
    organization.isActive && organization.stateUf === stateUf &&
    (projectType !== "CFTV" || organization.cityName.trim().toLocaleLowerCase("pt-BR") === "manaus")
  ), [organizationsQuery.data?.items, projectType, stateUf])
  const availableCities = useMemo(() => Array.from(new Set(stateOrganizations.map((organization) => organization.cityName.trim()))).sort((a, b) => a.localeCompare(b, "pt-BR")), [stateOrganizations])
  const availableOrganizations = useMemo(() => {
    const term = organizationSearch.trim().toLocaleLowerCase("pt-BR")
    return stateOrganizations.filter((organization) =>
      (cityFilter === "all" || organization.cityName === cityFilter) &&
      (!term || organization.sigla.toLocaleLowerCase("pt-BR").includes(term) || organization.name.toLocaleLowerCase("pt-BR").includes(term))
    )
  }, [cityFilter, organizationSearch, stateOrganizations])
  const selectedOrganization = stateOrganizations.find((organization) => organization.id === omId)

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
    setCityFilter(project?.om?.cityName ?? "all")
    setOrganizationSearch("")
    setOrganizationPickerOpen(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:!max-w-4xl">
        <DialogHeader className="border-b pb-4 pr-8">
          <DialogTitle className="text-xl">{isEditing ? "Editar projeto" : "Novo projeto"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados gerais. O responsável permanece vinculado à criação do projeto."
              : "O projeto será criado sob sua responsabilidade e iniciará na etapa de estimativa de preço."}
          </DialogDescription>
        </DialogHeader>

        <form id="project-form" className="grid gap-4 lg:grid-cols-2" onSubmit={submit}>
          <FormSection icon={FileText} title="Dados principais" description="Identifique o projeto e descreva seu objetivo operacional.">
            <div className="space-y-2">
              <Label htmlFor="project-title">Título</Label>
              <Input id="project-title" placeholder="Ex.: Adequação elétrica do pavilhão" {...form.register("title")} />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Descrição</Label>
              <Textarea id="project-description" rows={5} placeholder="Objetivo, escopo e observações relevantes..." {...form.register("description")} />
            </div>
          </FormSection>

          <FormSection icon={Building2} title="Classificação e destino" description="Defina o tipo de contratação e a Organização Militar atendida.">
            <div className="space-y-2">
              <Label>Tipo do projeto</Label>
              <Select
                value={projectType ?? ""}
                onValueChange={(value) => {
                  const nextType = value as ProjectType
                  form.setValue("projectType", nextType, { shouldValidate: true })
                  if (nextType === "CFTV") form.setValue("stateUf", "AM", { shouldValidate: true })
                  else form.resetField("stateUf")
                  form.setValue("omId", "", { shouldValidate: false })
                  setCityFilter("all")
                  setOrganizationSearch("")
                }}
              >
                <SelectTrigger className="w-full" aria-label="Tipo do projeto"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
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
                  value={stateUf ?? ""}
                  disabled={!projectType || projectType === "CFTV"}
                  onValueChange={(value) => {
                    form.setValue("stateUf", value as FederativeUnit, { shouldValidate: true })
                    form.setValue("omId", "", { shouldValidate: false })
                    setCityFilter("all")
                    setOrganizationSearch("")
                  }}
                >
                  <SelectTrigger className="w-full" aria-label="Estado"><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(stateLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {projectType === "CFTV" && <p className="text-xs text-muted-foreground">A ATA de CFTV atende exclusivamente Manaus/AM.</p>}
                {form.formState.errors.stateUf && <p className="text-xs text-destructive">{form.formState.errors.stateUf.message}</p>}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Município</Label>
                <Select value={cityFilter} disabled={!stateUf || organizationsQuery.isLoading} onValueChange={(value) => { setCityFilter(value); form.setValue("omId", "", { shouldValidate: false }); setOrganizationSearch("") }}><SelectTrigger className="w-full" aria-label="Município"><SelectValue placeholder="Todos os municípios" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os municípios</SelectItem>{availableCities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent></Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Organização Militar</Label>
                <Popover open={organizationPickerOpen} onOpenChange={(nextOpen) => { setOrganizationPickerOpen(nextOpen); if (!nextOpen) setOrganizationSearch("") }}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" role="combobox" aria-label="Organização Militar" aria-expanded={organizationPickerOpen} aria-describedby="project-om-help" disabled={!stateUf || organizationsQuery.isLoading || stateOrganizations.length === 0} className="w-full justify-between px-3 font-normal">
                      <span className={selectedOrganization ? "truncate" : "text-muted-foreground"}>{organizationsQuery.isLoading ? "Carregando OMs..." : selectedOrganization ? `${selectedOrganization.sigla} · ${selectedOrganization.name} (${selectedOrganization.cityName})` : "Selecione a OM"}</span>
                      <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" onOpenAutoFocus={(event) => event.preventDefault()}>
                    <div className="sticky top-0 z-10 border-b bg-popover p-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input autoFocus aria-label="Pesquisar Organização Militar" className="pl-9" value={organizationSearch} onChange={(event) => setOrganizationSearch(event.target.value)} placeholder="Pesquisar por nome ou sigla..." />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1">
                      {availableOrganizations.length === 0 ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhuma OM encontrada.</p> : availableOrganizations.map((om) => (
                        <button key={om.id} type="button" className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none" onClick={() => { form.setValue("omId", om.id, { shouldValidate: true }); setOrganizationPickerOpen(false); setOrganizationSearch("") }}>
                          <Check className={`mt-0.5 size-4 shrink-0 ${om.id === omId ? "opacity-100" : "opacity-0"}`} />
                          <span>{om.sigla} · {om.name} <span className="text-muted-foreground">({om.cityName})</span></span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <div id="project-om-help" aria-live="polite">
                  {organizationsQuery.isError && <p className="text-xs text-destructive">Não foi possível carregar as OMs deste estado.</p>}
                  {organizationsQuery.isSuccess && availableOrganizations.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma OM ativa disponível para esta seleção.</p>}
                </div>
                {form.formState.errors.omId && <p className="text-xs text-destructive">{form.formState.errors.omId.message}</p>}
              </div>
            </div>
          </FormSection>

          <FormSection icon={CalendarDays} title="Planejamento" description="Registre a referência temporal; o status seguirá o workflow documental.">
            <div className="rounded-md border border-primary/10 bg-primary/[.04] p-4 text-sm">
              <p className="font-medium">Status gerenciado pelo workflow</p>
              <p className="mt-1 leading-5 text-muted-foreground">
                O projeto inicia em Planejamento, passa para Em andamento após a estimativa e é concluído ao final do fluxo.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-start-date">Data de início (opcional)</Label>
              <Input id="project-start-date" type="date" {...form.register("startDate")} />
            </div>
          </FormSection>
        </form>

        <DialogFooter className="border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancelar</Button>
          <Button type="submit" form="project-form" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {isEditing ? "Salvar alterações" : "Criar projeto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
