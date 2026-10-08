export type UserNotification = {
  id: string
  eventKey: string
  category: string
  severity: "CRITICAL" | "WARNING" | "INFO"
  title: string
  description: string
  detailsPath: string
  entityType?: string | null
  entityId?: string | null
  occurredAt: string
  readAt?: string | null
  dismissedAt?: string | null
  resolvedAt?: string | null
  actor?: { id: string; name: string; warName?: string | null; userCode: number } | null
}

export type NotificationsResponse = {
  items: UserNotification[]
  pagination: { page: number; pageSize: number; total: number; pages: number }
  summary: { unread: number; active: number; byCategory: Record<string, number> }
}

