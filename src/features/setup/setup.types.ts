export type SetupStatus = {
  requiresSetup: boolean
  setupTokenConfigured: boolean
}

export type SetupPayload = {
  setupToken: string
  administrator: { name: string; email: string; password: string }
  organization: {
    name: string
    acronym: string
    cityName: string
    stateUf: "AM" | "RO" | "RR" | "AC"
    uasg: string
    management: string
    timeZone: string
    commandName: string
  }
  network: {
    hostName: string | null
    expectedIp: string | null
    gateway: string | null
    dnsServers: string[]
    ntpServers: string[]
    allowedNetworks: string[]
    proxyUrl: string | null
  }
}
