import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { Images, Monitor, Globe, Users, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleDark } from '@/components/ToggleDark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

interface AdminNavProps {
  children?: React.ReactNode
}

export function AdminNav({ children }: AdminNavProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const navTabs = [
    { label: t('common.home') || 'Home', icon: Home, path: '/' },
    { label: t('dashboard.title') || 'File Manager', icon: Images, path: '/dashboard' },
    { label: t('customerConfig.title') || 'User Management', icon: Users, path: '/customerConfig' },
    { label: t('systemConfig.title') || 'System Config', icon: Monitor, path: '/systemConfig' },
    { label: t('common.publicBrowse') || 'Public Browse', icon: Globe, path: '/browse' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-1">
          {navTabs.map((tab) => (
            <Button
              key={tab.path}
              variant={location.pathname.startsWith(tab.path) && (tab.path !== '/' || location.pathname === '/') ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
              onClick={() => navigate(tab.path)}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ToggleDark />
          <LanguageSwitcher />
          {children}
        </div>
      </div>
    </header>
  )
}
