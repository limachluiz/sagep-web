export type EvidenceCategory = "IMAGE" | "VIDEO" | "KMZ_KML" | "TECHNICAL_DOCUMENT" | "CERTIFICATION" | "DIAGRAM" | "AS_BUILT" | "OTHER"
export type EvidencePhase = "BEFORE" | "DURING" | "AFTER" | "GENERAL"
export type ProjectEvidence = {
  id: string; projectId: string; taskId: string | null; title: string; description: string | null
  category: EvidenceCategory; phase: EvidencePhase; includeInReport: boolean; sortOrder: number
  originalName: string; mimeType: string; sizeBytes: number; createdAt: string
  task: { id: string; taskCode: number; title: string } | null
  uploadedBy: { id: string; name: string; warName: string | null; rank: string | null } | null
}
