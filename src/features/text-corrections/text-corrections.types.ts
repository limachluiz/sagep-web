export type TextCorrectionRule = {
  id: string
  damagedText: string
  correctedText: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type TextCorrectionsCatalog = {
  rules: TextCorrectionRule[]
  builtInRuleCount: number
  unresolvedTokens: Array<{ token: string; occurrences: number }>
}

export type TextCorrectionInput = Pick<TextCorrectionRule, "damagedText" | "correctedText" | "isActive">
