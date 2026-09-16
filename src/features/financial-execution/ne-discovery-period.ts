type Ata = { id?: string; number: string; vendorName: string; vendorCnpj: string | null; validFrom: string | null; validUntil: string | null }
export type Pregao = { id: string; number: string; year: string; uasg: string; type: string | null; atas: Ata[] }

export function suggestedPeriod(pregoes: Pregao[]) {
  const atas = pregoes.flatMap(p => p.atas)
  const starts = atas.flatMap(a => a.validFrom ? [a.validFrom.slice(0, 10)] : []).sort()
  const ends = atas.flatMap(a => a.validUntil ? [a.validUntil.slice(0, 10)] : []).sort()
  return { start: starts[0] ?? "", end: ends.at(-1) ?? "", incomplete: !atas.length || pregoes.some(p => !p.atas.length) || atas.some(a => !a.validFrom || !a.validUntil) }
}

