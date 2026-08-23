import { api } from "@/lib/api"
import type { CertificateStatus, DeploymentPreflight, DeploymentSettings, NetworkDiagnostics, UpdateDeploymentSettings } from "./deployment.types"

export const deploymentService = {
  get: () => api.get<DeploymentSettings>("/deployment"),
  update: (input: UpdateDeploymentSettings) => api.put<DeploymentSettings>("/deployment", input),
  diagnostics: () => api.get<NetworkDiagnostics>("/deployment/diagnostics"),
  preflight: () => api.get<DeploymentPreflight>("/deployment/preflight"),
  initializeCertificate: (hostName: string, rotate: boolean) =>
    api.post<CertificateStatus>("/deployment/certificate/internal", { hostName, rotate }),
  trustKit: (platform: "windows" | "linux") => api.getBlob(`/deployment/trust-kit/${platform}`),
}
