export type LoginViewProps = {
  email: string
  password: string
  showPassword: boolean
  pending: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onTogglePassword: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onAccessHelp: () => void
}
