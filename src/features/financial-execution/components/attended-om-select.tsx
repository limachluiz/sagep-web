import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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

const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR")

export function AttendedOmSelect({ value, onChange, disabled, ariaLabel, className = "h-10 w-full justify-between px-3 font-normal" }: Props) {
  const query = useAttendedOmOptions()
  const [open, setOpen] = useState(false)
  const [stateUf, setStateUf] = useState("")
  const [city, setCity] = useState("")
  const [search, setSearch] = useState("")
  const options = Array.isArray(query.data) ? query.data : []
  const selected = options.find((organization) => organization.id === value)
  const states = useMemo(() => [...new Set(options.map((organization) => organization.stateUf))].sort((a, b) => a.localeCompare(b, "pt-BR")), [options])
  const cities = useMemo(() => [...new Set(options.filter((organization) => !stateUf || organization.stateUf === stateUf).map((organization) => organization.cityName))].sort((a, b) => a.localeCompare(b, "pt-BR")), [options, stateUf])
  const filtered = useMemo(() => {
    const term = normalized(search.trim())
    return options.filter((organization) => (!stateUf || organization.stateUf === stateUf) && (!city || organization.cityName === city) && (!term || normalized(`${organization.sigla} ${organization.name}`).includes(term)))
      .sort((a, b) => a.stateUf.localeCompare(b.stateUf, "pt-BR") || a.cityName.localeCompare(b.cityName, "pt-BR") || a.sigla.localeCompare(b.sigla, "pt-BR"))
  }, [options, stateUf, city, search])

  const choose = (organizationId: string) => {
    onChange(organizationId)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-label={ariaLabel} aria-expanded={open} disabled={disabled || query.isLoading} className={className}>
          <span className={`truncate text-left ${selected ? "" : "text-muted-foreground"}`}>{query.isLoading ? "Carregando OMs…" : selected ? attendedOmLabel(selected) : "Nenhuma OM selecionada"}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(92vw,36rem)] p-0" align="start" onOpenAutoFocus={(event) => event.preventDefault()}>
        <div className="space-y-2 border-b p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <select aria-label="Filtrar OMs por UF" className="h-9 rounded-md border bg-background px-3 text-sm" value={stateUf} onChange={(event) => { setStateUf(event.target.value); setCity("") }}>
              <option value="">Todas as UFs</option>
              {states.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
            <select aria-label="Filtrar OMs por município" className="h-9 rounded-md border bg-background px-3 text-sm" value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">Todos os municípios</option>
              {cities.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus aria-label="Pesquisar OM por nome ou sigla" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por nome ou sigla…" />
          </div>
        </div>
        <div className="max-h-72 overscroll-contain overflow-y-auto p-1" onWheel={(event) => event.stopPropagation()}>
          <button type="button" className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none" onClick={() => choose("")}>
            <Check className={`mt-0.5 size-4 shrink-0 ${value ? "opacity-0" : "opacity-100"}`} />
            <span>Nenhuma OM atendida</span>
          </button>
          {query.isError && <p className="px-3 py-6 text-center text-sm text-destructive">Não foi possível carregar as OMs.</p>}
          {!query.isError && filtered.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhuma OM encontrada para os filtros.</p>}
          {filtered.map((organization) => (
            <button key={organization.id} type="button" className="flex w-full items-start gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none" onClick={() => choose(organization.id)}>
              <Check className={`mt-0.5 size-4 shrink-0 ${organization.id === value ? "opacity-100" : "opacity-0"}`} />
              <span><strong>{organization.sigla}</strong> · {organization.name}<span className="block text-xs text-muted-foreground">{organization.cityName}/{organization.stateUf}</span></span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function attendedOmLabel(organization: Pick<MilitaryOrganization, "sigla" | "name" | "cityName" | "stateUf"> | null | undefined) {
  return organization ? `${organization.sigla} · ${organization.name} · ${organization.cityName}/${organization.stateUf}` : "Não informada"
}
