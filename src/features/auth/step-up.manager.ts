type StepUpHandler = (force: boolean) => Promise<string>

let handler: StepUpHandler | null = null
let pendingRequest: Promise<string> | null = null

export function registerStepUpHandler(nextHandler: StepUpHandler | null) {
  handler = nextHandler
}

export function requestStepUpToken(force = false) {
  if (!handler) {
    return Promise.reject(new Error("Confirmação de segurança indisponível."))
  }
  if (!pendingRequest) {
    pendingRequest = handler(force).finally(() => {
      pendingRequest = null
    })
  }
  return pendingRequest
}
