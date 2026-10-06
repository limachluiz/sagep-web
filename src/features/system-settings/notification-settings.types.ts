export type NotificationRole = "ADMIN" | "GESTOR" | "PROJETISTA" | "CONSULTA"
export type EmailRecipient = { id?: string; email: string; name: string | null; active: boolean }
export type EmailList = { id: string; name: string; description: string | null; active: boolean; roles: NotificationRole[]; recipients: EmailRecipient[]; createdAt: string; updatedAt: string }
export type NotificationSettings = {
  smtp: { enabled: boolean; host: string | null; port: number; secure: boolean; username: string | null; fromName: string | null; fromEmail: string | null; password: { configured: boolean; encryption: string | null } }
  telegram: { enabled: boolean; chatId: string | null; botToken: { configured: boolean; encryption: string | null } }
  emailLists: EmailList[]
}
export type EmailListInput = Omit<EmailList, "id" | "createdAt" | "updatedAt" | "recipients"> & { recipients: Array<Omit<EmailRecipient, "id">> }

export type NotificationAutomationConfiguration = {
  id: string; enabled: boolean; timeZone: string; hour: number; minute: number; weekdays: number[]
  syncTrackedCommitments: boolean; discoverCommitments: boolean; syncAtaBalances: boolean
  managementUnits: string[]; emailEnabled: boolean; telegramEnabled: boolean
  emailListIds: string[]; notifyRoles: NotificationRole[]; maxDiscoveryPages: number
  lastScheduledKey: string | null; updatedAt: string
}
export type NotificationAutomationRun = { id: string; trigger: string; status: "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED" | "SKIPPED"; startedAt: string; finishedAt: string | null; summary: unknown; error: string | null }
export type NotificationAutomationEvent = { id: string; type: string; title: string; description: string; occurredAt: string; emailSentAt: string | null; telegramSentAt: string | null; emailError: string | null; telegramError: string | null }
export type NotificationAutomationOverview = { configuration: NotificationAutomationConfiguration; runs: NotificationAutomationRun[]; events: NotificationAutomationEvent[] }
export type NotificationAutomationInput = Omit<NotificationAutomationConfiguration, "id" | "lastScheduledKey" | "updatedAt">
