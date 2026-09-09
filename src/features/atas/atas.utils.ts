import type { Ata, AtaItem } from "./atas.types"

export type AtaValidityStatus = "ACTIVE" | "EXPIRING" | "EXPIRED" | "INACTIVE" | "UNDATED"
export type AtaItemBalanceStatus = "AVAILABLE" | "LOW" | "EXHAUSTED" | "INACTIVE"

const DAY_IN_MS = 86_400_000

export function getAtaValidityStatus(
  ata: Pick<Ata, "isActive" | "validUntil">,
  referenceTime = Date.now(),
): AtaValidityStatus {
  if (!ata.isActive) return "INACTIVE"
  if (!ata.validUntil) return "UNDATED"

  const validUntil = new Date(ata.validUntil).getTime()
  if (validUntil < referenceTime) return "EXPIRED"
  if (validUntil <= referenceTime + 90 * DAY_IN_MS) return "EXPIRING"
  return "ACTIVE"
}

export function getAtaItemBalanceStatus(
  item: Pick<AtaItem, "isActive" | "balance">,
): AtaItemBalanceStatus {
  if (!item.isActive) return "INACTIVE"
  if (item.balance.insufficient || Number(item.balance.availableQuantity) <= 0) return "EXHAUSTED"
  if (item.balance.lowStock) return "LOW"
  return "AVAILABLE"
}

export function summarizeAtaItems(items: AtaItem[]) {
  const summary = items.reduce(
    (accumulator, item) => {
      const itemLastChange = [item.balance.lastMovementAt, item.openingBalanceAppliedAt]
        .filter((value): value is string => Boolean(value))
        .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null

      accumulator.initialAmount += Number(item.balance.initialAmount)
      accumulator.availableAmount += Number(item.balance.availableAmount)
      accumulator.reservedAmount += Number(item.balance.reservedAmount)
      accumulator.sagepConsumedAmount += Number(item.balance.consumedAmount)
      accumulator.openingConsumedAmount += Number(item.balance.openingConsumedAmount)
      accumulator.consumedAmount += Number(item.balance.totalConsumedAmount)

      const status = getAtaItemBalanceStatus(item)
      if (status === "LOW" || status === "EXHAUSTED") accumulator.riskCount += 1
      if (status === "INACTIVE") accumulator.inactiveCount += 1

      if (
        itemLastChange &&
        (!accumulator.lastMovementAt ||
          new Date(itemLastChange).getTime() > new Date(accumulator.lastMovementAt).getTime())
      ) {
        accumulator.lastMovementAt = itemLastChange
      }

      return accumulator
    },
    {
      initialAmount: 0,
      availableAmount: 0,
      reservedAmount: 0,
      consumedAmount: 0,
      sagepConsumedAmount: 0,
      openingConsumedAmount: 0,
      riskCount: 0,
      inactiveCount: 0,
      lastMovementAt: null as string | null,
    },
  )

  const allocatedAmount = summary.reservedAmount + summary.consumedAmount
  return {
    ...summary,
    allocatedAmount,
    utilizationPercentage:
      summary.initialAmount > 0
        ? Math.min(100, Math.max(0, (allocatedAmount / summary.initialAmount) * 100))
        : 0,
  }
}

export function formatAtaCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatAtaQuantity(value: string | number) {
  return Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 })
}

export function formatAtaDate(value: string | null, withTime = false) {
  if (!value) return "Não informada"
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  }).format(new Date(value))
}
