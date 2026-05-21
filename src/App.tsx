import { useEffect } from 'react'
import AppRouter from '@/router'
import { Toaster } from '@/components/ui/toaster'
import { useAppStore } from '@/store'
import { useDarkMode } from '@/hooks/useDarkMode'

export default function App() {
  const { fetchUserConfig, userConfig, useDarkMode: isDark } = useAppStore()

  useDarkMode()

  useEffect(() => {
    fetchUserConfig()
  }, [fetchUserConfig])

  // Update page title and icon based on config
  useEffect(() => {
    if (userConfig?.siteTitle) {
      document.title = userConfig.siteTitle
    }

    // Update favicon
    const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (iconLink && userConfig?.siteIcon) {
      iconLink.href = userConfig.siteIcon
    }
  }, [userConfig, isDark])

  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  )
}
