import { api } from "@/lib/api"
import type { CertificateStatus, DeploymentSettings, NetworkDiagnostics, UpdateDeploymentSettings } from "./deployment.types"

export const deploymentService = {
  get: () => api.get<DeploymentSettings>("/deployment"),
  update: (input: UpdateDeploymentSettings) => api.put<DeploymentSettings>("/deployment", input),
  diagnostics: () => api.get<NetworkDiagnostics>("/deployment/diagnostics"),
  initializeCertificate: (hostName: string, rotate: boolean) =>
    api.post<CertificateStatus>("/deployment/certificate/internal", { hostName, rotate }),
  trustKit: (platform: "windows" | "linux") => api.getBlob(`/deployment/trust-kit/${platform}`),
}
