import { api } from "@/lib/api"
import type { EvidenceCategory, EvidencePhase, ProjectEvidence } from "./evidences.types"

export const evidencesService = {
  list(projectId: string) { return api.get<ProjectEvidence[]>(`/evidences?projectId=${encodeURIComponent(projectId)}`) },
  upload(file: File, data: { projectId: string; taskId?: string; title: string; description?: string; category: EvidenceCategory; phase: EvidencePhase; includeInReport: boolean }) {
    return api.upload<ProjectEvidence>("/evidences", file, file.name, { headers: {
      "X-Project-Id": data.projectId, ...(data.taskId ? { "X-Task-Id": data.taskId } : {}),
      "X-File-Name": encodeURIComponent(file.name), "X-Evidence-Title": encodeURIComponent(data.title),
      ...(data.description ? { "X-Evidence-Description": encodeURIComponent(data.description) } : {}),
      "X-Evidence-Category": data.category, "X-Evidence-Phase": data.phase, "X-Include-In-Report": String(data.includeInReport),
    } })
  },
  update(id: string, data: Partial<Pick<ProjectEvidence, "title" | "description" | "category" | "phase" | "includeInReport" | "sortOrder">>) { return api.patch<ProjectEvidence>(`/evidences/${id}`, data) },
  remove(id: string) { return api.delete<void>(`/evidences/${id}`) },
  content(id: string) { return api.getBlob(`/evidences/${id}/content`) },
}
