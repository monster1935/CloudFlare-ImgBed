import { useEffect } from 'react'
import { useAppStore } from '@/store'

export function useDarkMode() {
  const { useDarkMode: isDark, cusDarkMode, setUseDarkMode } = useAppStore()

  useEffect(() => {
    const htmlElement = document.documentElement
    let isDarkMode: boolean

    if (cusDarkMode && isDark !== null) {
      isDarkMode = isDark
    } else {
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (!isDarkMode) {
        const hour = new Date().getHours()
        isDarkMode = hour >= 22 || hour < 6
      }
      setUseDarkMode(isDarkMode)
    }

    if (isDarkMode) {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
  }, [isDark, cusDarkMode, setUseDarkMode])
}
