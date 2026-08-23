export type CertificateMode = "INTERNAL_CA" | "IMPORTED" | "ACME_DNS"
export type CertificateStatus = {
  configured: boolean
  toolAvailable: boolean
  status: "NOT_CONFIGURED" | "VALID" | "EXPIRING" | "EXPIRED" | "INVALID"
  subject?: string
  issuer?: string
  validFrom?: string
  expiresAt?: string
  daysRemaining?: number
  fingerprintSha256?: string
  rootFingerprintSha256?: string
}

export type DeploymentSettings = {
  id: string
  hostName: string | null
  expectedIp: string | null
  gateway: string | null
  dnsServers: string[]
  ntpServers: string[]
  allowedNetworks: string[]
  proxyUrl: string | null
  certificateMode: CertificateMode
  updatedAt: string
  certificate: CertificateStatus
}

export type UpdateDeploymentSettings = Omit<DeploymentSettings, "id" | "updatedAt" | "certificate" | "certificateMode"> & {
  certificateMode: "INTERNAL_CA"
}

export type NetworkDiagnostics = {
  checkedAt: string
  hostName: string
  environmentHostName: string | null
  bindIp: string | null
  interfaces: Array<{ interface: string; address: string; netmask: string; mac: string }>
  systemDnsServers: string[]
  configuredHostName: string | null
  resolvedAddresses: string[]
  dnsError: string | null
  expectedIpMatches: boolean
  dnsMatchesExpectedIp: boolean
}

export type DeploymentPreflight = {
  checkedAt: string
  status: "READY" | "ATTENTION" | "BLOCKED"
  counts: { pass: number; warn: number; fail: number }
  checks: Array<{
    id: string
    category: "RUNTIME" | "SECURITY" | "NETWORK" | "STORAGE" | "CERTIFICATE" | "DATABASE"
    label: string
    status: "PASS" | "WARN" | "FAIL"
    message: string
    remediation?: string
  }>
}
