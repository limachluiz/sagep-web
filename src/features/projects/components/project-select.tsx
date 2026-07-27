import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  projectOptionLabel,
  type ProjectSelectOption,
} from "@/features/projects/components/project-select.utils"

const ALL_PROJECTS_VALUE = "__all_projects__"
const EMPTY_PROJECTS_VALUE = "__empty_projects__"

type ProjectSelectProps = {
  projects: ProjectSelectOption[]
  value?: string
  onValueChange: (projectId: string) => void
  allowAll?: boolean
  allLabel?: string
  placeholder?: string
  loading?: boolean
  error?: boolean
  disabled?: boolean
  ariaLabel?: string
  className?: string
}

export function ProjectSelect({
  projects,
  value = "",
  onValueChange,
  allowAll = false,
  allLabel = "Todos os projetos",
  placeholder = "Selecione o projeto",
  loading = false,
  error = false,
  disabled = false,
  ariaLabel = "Selecionar projeto",
  className,
}: ProjectSelectProps) {
  const displayPlaceholder = loading
    ? "Carregando projetos..."
    : error
      ? "Projetos indisponíveis"
      : placeholder

  return (
    <Select
      value={value || (allowAll ? ALL_PROJECTS_VALUE : undefined)}
      onValueChange={(nextValue) => onValueChange(nextValue === ALL_PROJECTS_VALUE ? "" : nextValue)}
      disabled={disabled || loading || error}
    >
      <SelectTrigger className={className ?? "w-full"} aria-label={ariaLabel}>
        <SelectValue placeholder={displayPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value={ALL_PROJECTS_VALUE}>{allLabel}</SelectItem>}
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            {projectOptionLabel(project)}
          </SelectItem>
        ))}
        {!loading && !projects.length && (
          <SelectItem value={EMPTY_PROJECTS_VALUE} disabled>
            Nenhum projeto disponível
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}
