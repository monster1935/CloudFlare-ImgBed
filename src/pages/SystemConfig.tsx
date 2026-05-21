import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Images, Monitor, Globe, Save, Upload, Shield, Layout, Settings2, LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleDark } from '@/components/ToggleDark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAppStore } from '@/store'
import { toast } from '@/hooks/useToast'
import axios from '@/utils/axios'

type TabKey = 'upload' | 'page' | 'security' | 'others'

export default function SystemConfig() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { setAdminLoggedIn } = useAppStore()
  const [activeTab, setActiveTab] = useState<TabKey>('upload')
  const [uploadConfig, setUploadConfig] = useState<Record<string, unknown> | null>(null)
  const [pageConfig, setPageConfig] = useState<Record<string, unknown> | null>(null)
  const [securityConfig, setSecurityConfig] = useState<Record<string, unknown> | null>(null)
  const [othersConfig, setOthersConfig] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const navTabs = [
    { label: t('dashboard.title') || 'File Manager', icon: Images, path: '/dashboard' },
    { label: t('systemConfig.title') || 'System Config', icon: Monitor, path: '/systemConfig' },
    { label: t('common.publicBrowse') || 'Public Browse', icon: Globe, path: '/browse' },
  ]

  const configTabs: { key: TabKey; label: string; icon: typeof Upload }[] = [
    { key: 'upload', label: '上传设置', icon: Upload },
    { key: 'page', label: '页面设置', icon: Layout },
    { key: 'security', label: '安全设置', icon: Shield },
    { key: 'others', label: '其他设置', icon: Settings2 },
  ]

  useEffect(() => {
    loadConfig(activeTab)
  }, [activeTab])

  const loadConfig = async (tab: TabKey) => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/manage/sysConfig/${tab}`)
      switch (tab) {
        case 'upload': setUploadConfig(res.data); break
        case 'page': setPageConfig(res.data); break
        case 'security': setSecurityConfig(res.data); break
        case 'others': setOthersConfig(res.data); break
      }
    } catch (err) {
      console.error('Failed to load config:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      let data: Record<string, unknown> | null = null
      switch (activeTab) {
        case 'upload': data = uploadConfig; break
        case 'page': data = pageConfig; break
        case 'security': data = securityConfig; break
        case 'others': data = othersConfig; break
      }
      await axios.post(`/api/manage/sysConfig/${activeTab}`, data)
      toast({ title: '保存成功' })
    } catch {
      toast({ title: '保存失败', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try { await axios.post('/api/auth/logout') } catch {}
    setAdminLoggedIn(false)
    navigate('/adminLogin', { replace: true })
  }

  const currentConfig = (() => {
    switch (activeTab) {
      case 'upload': return uploadConfig
      case 'page': return pageConfig
      case 'security': return securityConfig
      case 'others': return othersConfig
    }
  })()

  // Render config items recursively from the "config" array pattern used by page/upload APIs
  const renderConfigFields = (config: Record<string, unknown> | null) => {
    if (!config) return null

    // If it has a "config" array (like page config), render those fields
    if (Array.isArray((config as { config?: unknown[] }).config)) {
      const items = (config as { config: Array<{ id: string; label: string; label_en?: string; placeholder?: string; category?: string; value?: string }> }).config
      const categories = [...new Set(items.map(item => item.category || 'General'))]

      return (
        <div className="space-y-6">
          {categories.map(cat => (
            <Card key={cat}>
              <CardHeader>
                <CardTitle className="text-base">{cat}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.filter(item => (item.category || 'General') === cat).map(item => (
                  <div key={item.id} className="space-y-1">
                    <label className="text-sm font-medium">{item.label}</label>
                    <Input
                      placeholder={item.placeholder}
                      value={item.value || ''}
                      onChange={(e) => {
                        const newConfig = { ...config }
                        const arr = [...(newConfig as { config: typeof items }).config]
                        const idx = arr.findIndex(i => i.id === item.id)
                        arr[idx] = { ...arr[idx], value: e.target.value }
                        ;(newConfig as { config: typeof items }).config = arr
                        switch (activeTab) {
                          case 'page': setPageConfig(newConfig); break
                          case 'upload': setUploadConfig(newConfig); break
                        }
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    // Otherwise render as JSON key-value pairs grouped by top-level keys
    return (
      <div className="space-y-6">
        {Object.entries(config).map(([section, value]) => (
          <Card key={section}>
            <CardHeader>
              <CardTitle className="text-base capitalize">{section}</CardTitle>
            </CardHeader>
            <CardContent>
              {typeof value === 'object' && value !== null ? (
                <div className="space-y-3">
                  {Object.entries(value as Record<string, unknown>).map(([key, val]) => {
                    if (key.startsWith('_') || key === 'fixed') return null
                    if (typeof val === 'boolean') {
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <label className="text-sm font-medium">{key}</label>
                          <button
                            className={`w-10 h-5 rounded-full transition-colors ${val ? 'bg-primary' : 'bg-muted'}`}
                            onClick={() => {
                              const newConfig = { ...config, [section]: { ...(value as Record<string, unknown>), [key]: !val } }
                              switch (activeTab) {
                                case 'upload': setUploadConfig(newConfig); break
                                case 'page': setPageConfig(newConfig); break
                                case 'security': setSecurityConfig(newConfig); break
                                case 'others': setOthersConfig(newConfig); break
                              }
                            }}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${val ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                      )
                    }
                    if (typeof val === 'string' || typeof val === 'number') {
                      return (
                        <div key={key} className="space-y-1">
                          <label className="text-sm font-medium">{key}</label>
                          <Input
                            value={String(val)}
                            type={key.toLowerCase().includes('password') ? 'password' : 'text'}
                            onChange={(e) => {
                              const newConfig = { ...config, [section]: { ...(value as Record<string, unknown>), [key]: e.target.value } }
                              switch (activeTab) {
                                case 'upload': setUploadConfig(newConfig); break
                                case 'page': setPageConfig(newConfig); break
                                case 'security': setSecurityConfig(newConfig); break
                                case 'others': setOthersConfig(newConfig); break
                              }
                            }}
                          />
                        </div>
                      )
                    }
                    if (Array.isArray(val)) {
                      return (
                        <div key={key} className="space-y-1">
                          <label className="text-sm font-medium">{key}</label>
                          <p className="text-xs text-muted-foreground">{JSON.stringify(val)}</p>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{JSON.stringify(value)}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Bar - same as dashboard */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-1">
            {navTabs.map((tab) => (
              <Button
                key={tab.path}
                variant={location.pathname === tab.path ? 'default' : 'ghost'}
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
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar tabs */}
        <aside className="w-48 border-r p-3 space-y-1">
          {configTabs.map((tab) => (
            <button
              key={tab.key}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 max-w-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {configTabs.find(t => t.key === activeTab)?.label}
            </h2>
            <Button onClick={saveConfig} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            renderConfigFields(currentConfig)
          )}
        </main>
      </div>
    </div>
  )
}
