import { api } from "@/lib/api"
import type { TextCorrectionInput, TextCorrectionRule, TextCorrectionsCatalog } from "./text-corrections.types"

export const textCorrectionsService = {
  list: () => api.get<TextCorrectionsCatalog>("/text-corrections"),
  create: (input: TextCorrectionInput) => api.post<TextCorrectionRule>("/text-corrections", input),
  update: (id: string, input: TextCorrectionInput) => api.put<TextCorrectionRule>(`/text-corrections/${id}`, input),
  remove: (id: string) => api.delete<{ message: string }>(`/text-corrections/${id}`),
  test: (input: { text: string; damagedText?: string; correctedText?: string }) => api.post<{ originalText: string; correctedText: string; changed: boolean; unresolvedTokens: string[] }>("/text-corrections/test", input),
  applyCatalog: () => api.post<{ scope: "CATALOG"; total: number; corrected: number; unresolvedTokens: string[] }>("/text-corrections/apply", { scope: "CATALOG" }),
}
