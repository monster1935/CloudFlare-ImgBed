import { useAppStore } from '@/store'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ToggleDark() {
  const { useDarkMode: isDark, cusDarkMode, setCusDarkMode, setUseDarkMode } = useAppStore()

  const handleToggle = () => {
    const isAuto = !cusDarkMode

    if (isAuto) {
      // Auto → Light
      setCusDarkMode(true)
      setUseDarkMode(false)
    } else if (!isDark) {
      // Light → Dark
      setCusDarkMode(true)
      setUseDarkMode(true)
    } else {
      // Dark → Auto
      setCusDarkMode(false)
    }
  }

  const isAuto = !cusDarkMode

  return (
    <Button variant="ghost" size="icon" onClick={handleToggle} title={isAuto ? 'Auto' : isDark ? 'Dark' : 'Light'}>
      {isAuto ? (
        <Monitor className="h-5 w-5" />
      ) : isDark ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  )
}
