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
  builtInRules: Array<Pick<TextCorrectionRule, "id" | "damagedText" | "correctedText" | "isActive"> & { source: "BUILT_IN" }>
  builtInRuleCount: number
  reviewItems: TextCorrectionReviewItem[]
  unresolvedTokens: Array<{ token: string; occurrences: number }>
}

export type TextCorrectionDecision = {
  damagedText: string
  correctedText: string | null
  alternatives: string[]
  confidence: "HIGH" | "MEDIUM" | "LOW"
  source: "STRUCTURAL" | "LEXICON" | "TECHNICAL"
  applied: boolean
}

export type TextCorrectionReviewItem = {
  itemId: string
  referenceCode: string
  ata: { id: string; number: string; vendorName: string | null }
  originalText: string
  automaticText: string
  currentText: string
  confidence: number
  decisions: TextCorrectionDecision[]
  unresolvedTokens: string[]
}

export type TextCorrectionInput = Pick<TextCorrectionRule, "damagedText" | "correctedText" | "isActive">
