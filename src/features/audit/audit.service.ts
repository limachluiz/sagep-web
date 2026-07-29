import { api } from "@/lib/api"

import type { AuditListFilters, AuditListResponse } from "./audit.types"

export const auditService = {
  list({
    page = 1,
    limit = 25,
    search,
    actor,
    entityType,
    action,
    startDate,
    endDate,
  }: AuditListFilters = {}) {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })

    if (search) query.set("search", search)
    if (actor) query.set("actor", actor)
    if (entityType) query.set("entityType", entityType)
    if (action) query.set("action", action)
    if (startDate) query.set("startDate", startDate)
    if (endDate) query.set("endDate", endDate)

    return api.get<AuditListResponse>(`/audits?${query.toString()}`)
  },
}
