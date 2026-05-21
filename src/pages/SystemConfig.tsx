import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Save, Upload, Shield, Layout, Settings2, LogOut, BarChart3, RefreshCw, Wrench, Plus, Trash2, Copy, Key
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminNav } from '@/components/layout/AdminNav'
import { useAppStore } from '@/store'
import { toast } from '@/hooks/useToast'
import axios from '@/utils/axios'

type TabKey = 'status' | 'upload' | 'page' | 'security' | 'others'

interface SystemStatus {
  totalCount: number
  indexLastUpdated: string | number | null
  quotaStats: Record<string, number>
  totalSizeMB: number
  blockedCount: number
  normalCount: number
}

export default function SystemConfig() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setAdminLoggedIn } = useAppStore()
  const [activeTab, setActiveTab] = useState<TabKey>('status')
  const [uploadConfig, setUploadConfig] = useState<Record<string, unknown> | null>(null)
  const [pageConfig, setPageConfig] = useState<Record<string, unknown> | null>(null)
  const [securityConfig, setSecurityConfig] = useState<Record<string, unknown> | null>(null)
  const [othersConfig, setOthersConfig] = useState<Record<string, unknown> | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)

  // API Token management
  interface ApiToken {
    id: string
    name: string
    owner: string
    permissions: string[]
    createdAt: string
    token: string
    expiresAt: string | null
    autoDelete: boolean
  }
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([])
  const [showCreateToken, setShowCreateToken] = useState(false)
  const [newTokenName, setNewTokenName] = useState('')
  const [newTokenPerms, setNewTokenPerms] = useState<string[]>(['upload'])
  const [newTokenExpiry, setNewTokenExpiry] = useState<'never' | 'custom'>('never')
  const [newTokenExpiryDays, setNewTokenExpiryDays] = useState(30)
  const [newTokenAutoDelete, setNewTokenAutoDelete] = useState(false)
  const [createdTokenValue, setCreatedTokenValue] = useState('')

  const configTabs: { key: TabKey; label: string; icon: typeof Upload }[] = [
    { key: 'status', label: t('systemConfig.status'), icon: BarChart3 },
    { key: 'upload', label: t('systemConfig.upload'), icon: Upload },
    { key: 'security', label: t('systemConfig.security'), icon: Shield },
    { key: 'page', label: t('systemConfig.page'), icon: Layout },
    { key: 'others', label: t('systemConfig.others'), icon: Settings2 },
  ]

  useEffect(() => {
    if (activeTab === 'status') {
      loadSystemStatus()
    } else {
      loadConfig(activeTab)
      if (activeTab === 'security') {
        loadApiTokens()
      }
    }
  }, [activeTab])

  const loadSystemStatus = async () => {
    setLoading(true)
    try {
      const [sumRes, quotaRes, blockedRes] = await Promise.all([
        axios.get('/api/manage/list', { params: { count: -1, sum: 'true' } }),
        axios.get('/api/manage/quota'),
        axios.get('/api/manage/list', { params: { count: -1, sum: 'true', listType: 'block' } }),
      ])
      const totalCount = sumRes.data?.sum || 0
      const indexLastUpdated = sumRes.data?.indexLastUpdated || null
      const quotaData = quotaRes.data || {}
      const blockedCount = blockedRes.data?.sum || 0
      setSystemStatus({
        totalCount,
        indexLastUpdated,
        quotaStats: quotaData.quotaStats || {},
        totalSizeMB: quotaData.totalSizeMB || 0,
        blockedCount,
        normalCount: totalCount - blockedCount,
      })
    } catch (err) {
      console.error('Failed to load system status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRebuildIndex = async () => {
    setRebuilding(true)
    try {
      await axios.get('/api/manage/list', { params: { action: 'rebuild' } })
      toast({ title: t('systemConfig.rebuildStarted') })
      setTimeout(loadSystemStatus, 3000)
    } catch {
      toast({ title: t('systemConfig.rebuildFailed'), variant: 'destructive' })
    } finally {
      setRebuilding(false)
    }
  }

  const handleMergeOperations = async () => {
    try {
      await axios.get('/api/manage/list', { params: { action: 'merge-operations' } })
      toast({ title: t('systemConfig.mergeStarted') })
      setTimeout(loadSystemStatus, 2000)
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' })
    }
  }

  // API Token functions
  const loadApiTokens = async () => {
    try {
      const res = await axios.get('/api/manage/apiTokens')
      setApiTokens(res.data?.tokens || [])
    } catch {
      console.error('Failed to load API tokens')
    }
  }

  const createToken = async () => {
    if (!newTokenName.trim()) {
      toast({ title: t('systemConfig.tokenNameRequired'), variant: 'destructive' })
      return
    }
    try {
      const expiresAt = newTokenExpiry === 'never' ? null
        : new Date(Date.now() + newTokenExpiryDays * 86400000).toISOString()
      const res = await axios.post('/api/manage/apiTokens', {
        name: newTokenName,
        permissions: newTokenPerms,
        owner: 'admin',
        expiresAt,
        autoDelete: newTokenAutoDelete,
      })
      setCreatedTokenValue(res.data?.token || '')
      setNewTokenName('')
      setNewTokenPerms(['upload'])
      setNewTokenExpiry('never')
      setNewTokenAutoDelete(false)
      toast({ title: t('systemConfig.tokenCreated') })
      loadApiTokens()
    } catch {
      toast({ title: t('systemConfig.tokenCreateFailed'), variant: 'destructive' })
    }
  }

  const deleteToken = async (id: string) => {
    try {
      await axios.delete(`/api/manage/apiTokens?id=${id}`)
      toast({ title: t('systemConfig.tokenDeleted') })
      loadApiTokens()
    } catch {
      toast({ title: t('systemConfig.tokenDeleteFailed'), variant: 'destructive' })
    }
  }

  const loadConfig = async (tab: TabKey) => {
    if (tab === 'status') return
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
      toast({ title: t('systemConfig.saveSuccess') })
    } catch {
      toast({ title: t('systemConfig.saveFailed'), variant: 'destructive' })
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
      default: return null
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

                    // Handle nested objects (e.g. auth.user, auth.admin)
                    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                      return (
                        <div key={key} className="space-y-3 pl-3 border-l-2 border-muted">
                          <p className="text-sm font-semibold text-muted-foreground capitalize">{key}</p>
                          {Object.entries(val as Record<string, unknown>).map(([subKey, subVal]) => {
                            if (subKey.startsWith('_') || subKey === 'fixed') return null
                            if (typeof subVal === 'boolean') {
                              return (
                                <div key={subKey} className="flex items-center justify-between">
                                  <label className="text-sm font-medium">{subKey}</label>
                                  <button
                                    className={`w-10 h-5 rounded-full transition-colors ${subVal ? 'bg-primary' : 'bg-muted'}`}
                                    onClick={() => {
                                      const newConfig = { ...config, [section]: { ...(value as Record<string, unknown>), [key]: { ...(val as Record<string, unknown>), [subKey]: !subVal } } }
                                      switch (activeTab) {
                                        case 'upload': setUploadConfig(newConfig); break
                                        case 'page': setPageConfig(newConfig); break
                                        case 'security': setSecurityConfig(newConfig); break
                                        case 'others': setOthersConfig(newConfig); break
                                      }
                                    }}
                                  >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${subVal ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                  </button>
                                </div>
                              )
                            }
                            if (typeof subVal === 'string' || typeof subVal === 'number') {
                              return (
                                <div key={subKey} className="space-y-1">
                                  <label className="text-sm font-medium">{subKey}</label>
                                  <Input
                                    value={String(subVal)}
                                    type={subKey.toLowerCase().includes('password') || subKey.toLowerCase().includes('authcode') ? 'password' : 'text'}
                                    placeholder={subKey.toLowerCase().includes('password') || subKey.toLowerCase().includes('authcode') ? '(leave empty to keep unchanged)' : ''}
                                    onChange={(e) => {
                                      const newConfig = { ...config, [section]: { ...(value as Record<string, unknown>), [key]: { ...(val as Record<string, unknown>), [subKey]: e.target.value } } }
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
                            return null
                          })}
                        </div>
                      )
                    }
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
                          <pre className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md overflow-x-auto max-h-40 whitespace-pre-wrap break-all">
                            {JSON.stringify(val, null, 2)}
                          </pre>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              ) : (
                <pre className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify(value, null, 2)}</pre>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <AdminNav>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </AdminNav>

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
          {activeTab === 'status' ? (
            /* System Status Dashboard */
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">{t('systemConfig.status')}</h2>

              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : systemStatus && (
                <>
                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">{t('systemConfig.totalFiles')}</p>
                        <p className="text-3xl font-bold">{systemStatus.totalCount}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">{t('systemConfig.indexUpdated')}</p>
                        <p className="text-lg font-bold">
                          {systemStatus.indexLastUpdated
                            ? new Date(systemStatus.indexLastUpdated).toLocaleString()
                            : '-'}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">{t('systemConfig.version')}</p>
                        <p className="text-3xl font-bold">v2.5.6</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Channel Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('systemConfig.channelDist')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(systemStatus.quotaStats).length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(systemStatus.quotaStats).map(([channel, rawCount]) => {
                            const fileCount = typeof rawCount === 'object' && rawCount !== null
                              ? (rawCount as { fileCount?: number }).fileCount || 0
                              : (rawCount as number) || 0
                            const percentage = systemStatus.totalCount > 0
                              ? Math.round((fileCount / systemStatus.totalCount) * 100)
                              : 0
                            return (
                              <div key={channel} className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-sm bg-primary" style={{
                                  backgroundColor: channel.includes('Telegram') ? '#f59e0b' :
                                    channel.includes('R2') ? '#ef4444' :
                                    channel.includes('Hugging') ? '#3b82f6' :
                                    channel.includes('Discord') ? '#22c55e' :
                                    channel.includes('S3') ? '#8b5cf6' : '#6b7280'
                                }} />
                                <span className="text-sm flex-1">{channel}</span>
                                <span className="text-sm font-medium">{fileCount}</span>
                                <span className="text-xs text-muted-foreground w-10 text-right">{percentage}%</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* File Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('systemConfig.fileStatus')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-sm bg-green-500" />
                          <span className="text-sm flex-1">{t('systemConfig.normal')}</span>
                          <span className="text-sm font-medium">{systemStatus.normalCount}</span>
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {systemStatus.totalCount > 0 ? Math.round((systemStatus.normalCount / systemStatus.totalCount) * 100) : 0}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-sm bg-blue-500" />
                          <span className="text-sm flex-1">{t('systemConfig.blocked')}</span>
                          <span className="text-sm font-medium">{systemStatus.blockedCount}</span>
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {systemStatus.totalCount > 0 ? Math.round((systemStatus.blockedCount / systemStatus.totalCount) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Maintenance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        {t('systemConfig.maintenance')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                      <Button variant="outline" onClick={handleRebuildIndex} disabled={rebuilding} className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${rebuilding ? 'animate-spin' : ''}`} />
                        {t('systemConfig.rebuildIndex')}
                      </Button>
                      <Button variant="outline" onClick={handleMergeOperations} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        {t('systemConfig.mergeOps')}
                      </Button>
                      <Button variant="outline" onClick={loadSystemStatus} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        {t('systemConfig.refresh')}
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          ) : (
            /* Config Tabs Content */
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {configTabs.find(t => t.key === activeTab)?.label}
                </h2>
                <Button onClick={saveConfig} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? t('systemConfig.saving') : t('systemConfig.save')}
                </Button>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {renderConfigFields(currentConfig)}

                  {/* API Token Management - only in security tab */}
                  {activeTab === 'security' && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            {t('systemConfig.apiTokenManagement')}
                          </span>
                          <Button size="sm" variant="outline" onClick={() => { setShowCreateToken(!showCreateToken); setCreatedTokenValue('') }} className="gap-1">
                            <Plus className="h-3 w-3" />
                            {t('systemConfig.createToken')}
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Create Token Form */}
                        {showCreateToken && (
                          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                            <div className="space-y-1">
                              <label className="text-sm font-medium">{t('systemConfig.tokenName')}</label>
                              <Input
                                value={newTokenName}
                                onChange={(e) => setNewTokenName(e.target.value)}
                                placeholder={t('systemConfig.tokenNamePlaceholder')}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium">{t('systemConfig.permissions')}</label>
                              <div className="flex flex-wrap gap-2">
                                {['upload', 'delete', 'list', 'manage'].map(perm => (
                                  <button
                                    key={perm}
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                      newTokenPerms.includes(perm) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'
                                    }`}
                                    onClick={() => setNewTokenPerms(prev =>
                                      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
                                    )}
                                  >
                                    {t(`systemConfig.perm${perm.charAt(0).toUpperCase() + perm.slice(1)}`)}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-sm font-medium">{t('systemConfig.expiry')}</label>
                              <div className="flex items-center gap-3">
                                <button
                                  className={`px-3 py-1 text-xs rounded-full border ${newTokenExpiry === 'never' ? 'bg-primary text-primary-foreground' : ''}`}
                                  onClick={() => setNewTokenExpiry('never')}
                                >{t('systemConfig.neverExpire')}</button>
                                <button
                                  className={`px-3 py-1 text-xs rounded-full border ${newTokenExpiry === 'custom' ? 'bg-primary text-primary-foreground' : ''}`}
                                  onClick={() => setNewTokenExpiry('custom')}
                                >{t('systemConfig.validPeriod')}</button>
                                {newTokenExpiry === 'custom' && (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      className="w-20 h-7 text-xs"
                                      value={newTokenExpiryDays}
                                      onChange={(e) => setNewTokenExpiryDays(Number(e.target.value))}
                                    />
                                    <span className="text-xs text-muted-foreground">{t('systemConfig.days')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {newTokenExpiry === 'custom' && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={newTokenAutoDelete}
                                  onChange={(e) => setNewTokenAutoDelete(e.target.checked)}
                                  className="rounded"
                                />
                                <span className="text-xs">{t('systemConfig.autoDeleteOnExpire')}</span>
                              </div>
                            )}
                            <Button size="sm" onClick={createToken}>{t('systemConfig.createBtn')}</Button>

                            {createdTokenValue && (
                              <div className="mt-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                                <p className="text-xs text-green-700 dark:text-green-300 mb-1">{t('systemConfig.tokenCreatedCopy')}</p>
                                <div className="flex items-center gap-2">
                                  <code className="text-xs flex-1 break-all">{createdTokenValue}</code>
                                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(createdTokenValue); toast({ title: t('common.copied') }) }}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Token List */}
                        {apiTokens.length === 0 ? (
                          <p className="text-sm text-muted-foreground">{t('systemConfig.noTokens')}</p>
                        ) : (
                          <div className="space-y-2">
                            {apiTokens.map(token => (
                              <div key={token.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{token.name}</span>
                                    <span className="text-xs text-muted-foreground">{token.token}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {token.permissions.map(p => (
                                      <span key={p} className="px-1.5 py-0.5 text-[10px] rounded bg-muted">{p}</span>
                                    ))}
                                    <span className="text-[10px] text-muted-foreground">
                                      {token.expiresAt ? `${t('systemConfig.expiresAt')}: ${new Date(token.expiresAt).toLocaleDateString()}` : t('systemConfig.neverExpire')}
                                    </span>
                                  </div>
                                </div>
                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteToken(token.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
