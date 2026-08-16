import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { LoginVersionTwo } from "@/features/auth/components/login-version-two"
import { authService } from "@/features/auth/auth.service"
import { useAuthStore } from "@/features/auth/auth.store"

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, setAuth } = useAuthStore()
  const [email, setEmail] = useState("admin@sagep.com")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      })

      toast.success("Login realizado com sucesso.")
      const destination = location.state?.from?.pathname ?? "/inicio"
      navigate(destination, { replace: true })
    },
    onError: (error) => {
      toast.error(error.message || "Não foi possível realizar o login.")
    },
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    loginMutation.mutate({ email, password })
  }

  if (isAuthenticated) {
    return <Navigate to="/inicio" replace />
  }

  return (
    <LoginVersionTwo
      email={email}
      password={password}
      showPassword={showPassword}
      pending={loginMutation.isPending}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onTogglePassword={() => setShowPassword((value) => !value)}
      onSubmit={handleSubmit}
      onAccessHelp={() => toast.info("Entre em contato com o administrador do SAGEP.")}
    />
  )
}
