const labels: Record<string, string> = {
  A_CONFERIR: "A conferir", DIVERGENTE: "Divergente", NAO_LIQUIDADA: "Não liquidada",
  PARCIALMENTE_LIQUIDADA: "Parcialmente liquidada", LIQUIDADA: "Liquidada", PARCIALMENTE_PAGA: "Parcialmente paga", PAGA: "Paga",
  ANULADA: "Anulada", PARCIALMENTE_ANULADA: "Parcialmente anulada",
}
export const financialStatusLabel = (status: string) => labels[status] ?? status.replaceAll("_", " ")
export const formatNeMoney = (value: number | null) => value === null ? "Não informado" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
