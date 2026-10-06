import { api } from "@/lib/api"
import type { EmailList, EmailListInput, NotificationAutomationConfiguration, NotificationAutomationInput, NotificationAutomationOverview, NotificationAutomationRun, NotificationSettings } from "./notification-settings.types"

export const notificationSettingsService = {
  get: () => api.get<NotificationSettings>("/notification-settings"),
  saveSmtp: (input: { enabled: boolean; host: string; port: number; secure: boolean; username: string | null; password?: string; fromName: string; fromEmail: string }) => api.put<NotificationSettings>("/notification-settings/smtp", input),
  testSmtp: (recipient: string) => api.post<{ success: boolean; message: string }>("/notification-settings/smtp/test", { recipient }),
  saveTelegram: (input: { enabled: boolean; botToken?: string; chatId: string }) => api.put<NotificationSettings>("/notification-settings/telegram", input),
  testTelegram: () => api.post<{ success: boolean; message: string }>("/notification-settings/telegram/test"),
  createList: (input: EmailListInput) => api.post<EmailList>("/notification-settings/email-lists", input),
  updateList: (id: string, input: EmailListInput) => api.put<EmailList>(`/notification-settings/email-lists/${id}`, input),
  deleteList: (id: string) => api.delete<{ deleted: boolean }>(`/notification-settings/email-lists/${id}`),
  getAutomation: () => api.get<NotificationAutomationOverview>("/notification-settings/automation"),
  saveAutomation: (input: NotificationAutomationInput) => api.put<NotificationAutomationConfiguration>("/notification-settings/automation", input),
  runAutomation: () => api.post<NotificationAutomationRun>("/notification-settings/automation/run"),
}
