const labels: Record<string, string> = {
  A_CONFERIR: "A conferir", DIVERGENTE: "Divergente", NAO_LIQUIDADA: "Não liquidada",
  PARCIALMENTE_LIQUIDADA: "Parcialmente liquidada", LIQUIDADA: "Liquidada", PARCIALMENTE_PAGA: "Parcialmente paga", PAGA: "Paga",
  ANULADA: "Anulada", PARCIALMENTE_ANULADA: "Parcialmente anulada",
}
export const financialStatusLabel = (status: string) => labels[status] ?? status.replaceAll("_", " ")
export const formatNeMoney = (value: number | null) => value === null ? "Não informado" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
export const formatNeDate = (value?: string | Date | null) => {
  if (!value) return "Data não informada"
  if (typeof value === "string") {
    const br = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
    if (br) return `${br[1]}/${br[2]}/${br[3]}`
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "Data não informada" : parsed.toLocaleDateString("pt-BR")
}
