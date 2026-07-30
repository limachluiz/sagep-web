import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { authService } from "@/features/auth/auth.service"
import { useAuthStore } from "@/features/auth/auth.store"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const setUser = useAuthStore((state) => state.setUser)
  const isDark = resolvedTheme === "dark"
  const nextThemeLabel = isDark ? "claro" : "escuro"

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark"
    setTheme(nextTheme)
    void authService
      .updateProfile({
        themePreference: nextTheme.toUpperCase() as "LIGHT" | "DARK",
      })
      .then(setUser)
      .catch(() => undefined)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      onClick={toggleTheme}
      aria-label={`Ativar tema ${nextThemeLabel}`}
      title={`Ativar tema ${nextThemeLabel}`}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
