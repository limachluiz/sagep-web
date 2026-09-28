import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { MilitaryOrganization } from "@/features/projects/projects.types"

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  ariaLabel?: string
  className?: string
}

export function useAttendedOmOptions() {
  return useQuery({
    queryKey: ["financial-execution", "attended-organizations"],
    queryFn: () => api.get<MilitaryOrganization[]>("/financial-execution/discovery/attended-organizations"),
    staleTime: 5 * 60 * 1000,
  })
}

export function AttendedOmSelect({ value, onChange, disabled, ariaLabel, className = "h-10 w-full rounded-md border bg-background px-3 text-sm" }: Props) {
  const query = useAttendedOmOptions()
  const groups = new Map<string, MilitaryOrganization[]>()
  for (const organization of query.data ?? []) {
    const key = `${organization.stateUf} · ${organization.cityName}`
    groups.set(key, [...(groups.get(key) ?? []), organization])
  }

  return (
    <select aria-label={ariaLabel} className={className} value={value} disabled={disabled || query.isLoading} onChange={(event) => onChange(event.target.value)}>
      <option value="">{query.isLoading ? "Carregando OMs…" : "Nenhuma OM selecionada"}</option>
      {[...groups.entries()].map(([label, organizations]) => (
        <optgroup key={label} label={label}>
          {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.sigla} · {organization.name}</option>)}
        </optgroup>
      ))}
    </select>
  )
}

export function attendedOmLabel(organization: Pick<MilitaryOrganization, "sigla" | "name" | "cityName" | "stateUf"> | null | undefined) {
  return organization ? `${organization.sigla} · ${organization.name} · ${organization.cityName}/${organization.stateUf}` : "Não informada"
}
