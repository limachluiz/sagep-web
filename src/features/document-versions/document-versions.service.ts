import { api } from "@/lib/api"

export type DocumentVersion = {
  id: string; entityType: string; entityId: string; documentType: string; version: number; filename: string; mimeType: string; checksumSha256: string; sizeBytes: number; reason: string | null; generatedAt: string; originalVersionId: string | null; signatureStatus: "NOT_SIGNED" | "PENDING_VALIDATION" | "VALID" | "INVALID"; signatureProvider: string | null; signerName: string | null; signedAt: string | null; invalidatedAt: string | null; invalidationReason: string | null; generatedBy: { id: string; name: string; email: string } | null
}

export const documentVersionsService = {
  list(entityType: string, entityId: string, documentType?: string) { const query = new URLSearchParams({ entityType, entityId }); if (documentType) query.set("documentType", documentType); return api.get<DocumentVersion[]>(`/document-versions?${query}`) },
  download(id: string) { return api.getBlob(`/document-versions/${id}/download`) },
  registerSigned(id: string, payload: { fileBase64: string; filename: string; signerName: string; signerDocument?: string; signatureProvider: string; reason?: string }) { return api.post<DocumentVersion>(`/document-versions/${id}/signed`, payload) },
}
