export type UserNotification = {
  id: string;
  eventKey: string;
  category: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  detailsPath: string;
  entityType?: string | null;
  entityId?: string | null;
  occurredAt: string;
  readAt?: string | null;
  dismissedAt?: string | null;
  resolvedAt?: string | null;
  actor?: {
    id: string;
    name: string;
    warName?: string | null;
    userCode: number;
  } | null;
};

export type NotificationsResponse = {
  items: UserNotification[];
  pagination: { page: number; pageSize: number; total: number; pages: number };
  summary: {
    unread: number;
    active: number;
    byCategory: Record<string, number>;
  };
};

export type MentionTrackingResponse = {
  items: Array<{
    id: string;
    entityType: string;
    entityId: string;
    sourceText: string;
    createdAt: string;
    readAt: string | null;
    resolvedAt: string | null;
    escalatedAt: string | null;
    recipient: {
      id: string;
      userCode: number;
      name: string;
      warName: string | null;
      role: string;
    } | null;
    actor: {
      id: string;
      userCode: number;
      name: string;
      warName: string | null;
      role: string;
    } | null;
    notification: {
      id: string;
      title: string;
      description: string;
      detailsPath: string;
      readAt: string | null;
      resolvedAt: string | null;
      dismissedAt: string | null;
    } | null;
  }>;
  pagination: {
    scope: "MINE" | "ALL";
    status: string;
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
};
