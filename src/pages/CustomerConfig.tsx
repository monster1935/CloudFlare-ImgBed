import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Images, Monitor, Globe, LogOut, ChevronDown, ChevronRight, Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ToggleDark } from '@/components/ToggleDark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAppStore } from '@/store'
import { toast } from '@/hooks/useToast'
import axios from '@/utils/axios'

interface IPRecord {
  ip: string
  address: string
  count: number
}

interface FileRecord {
  id: string
  metadata?: {
    TimeStamp?: number
    [key: string]: unknown
  }
}

export default function CustomerConfig() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { setAdminLoggedIn } = useAppStore()
  const [ipList, setIpList] = useState<IPRecord[]>([])
  const [blockedIps, setBlockedIps] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedIp, setExpandedIp] = useState<string | null>(null)
  const [ipFiles, setIpFiles] = useState<FileRecord[]>([])
  const [ipFilesTotal, setIpFilesTotal] = useState(0)
  const [filesLoading, setFilesLoading] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 10

  const navTabs = [
    { label: t('dashboard.title') || 'File Manager', icon: Images, path: '/dashboard' },
    { label: t('customerConfig.title') || 'User Management', icon: Users, path: '/customerConfig' },
    { label: t('systemConfig.title') || 'System Config', icon: Monitor, path: '/systemConfig' },
    { label: t('common.publicBrowse') || 'Public Browse', icon: Globe, path: '/browse' },
  ]

  useEffect(() => {
    fetchIpList()
    fetchBlockedIps()
  }, [page])

  const fetchIpList = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/manage/cusConfig/list', {
        params: { start: page * pageSize, count: pageSize }
      })
      setIpList(res.data || [])
    } catch (err) {
      console.error('Failed to fetch IP list:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBlockedIps = async () => {
    try {
      const res = await axios.get('/api/manage/cusConfig/blockipList')
      const list = res.data ? String(res.data).split(',').filter(Boolean) : []
      setBlockedIps(list)
    } catch {
      // ignore
    }
  }

  const toggleBlock = async (ip: string) => {
    const isBlocked = blockedIps.includes(ip)
    try {
      if (isBlocked) {
        await axios.post('/api/manage/cusConfig/whiteip', ip, {
          headers: { 'Content-Type': 'text/plain' }
        })
        setBlockedIps((prev) => prev.filter((i) => i !== ip))
        toast({ title: t('customerConfig.unblocked') })
      } else {
        await axios.post('/api/manage/cusConfig/blockip', ip, {
          headers: { 'Content-Type': 'text/plain' }
        })
        setBlockedIps((prev) => [...prev, ip])
        toast({ title: t('customerConfig.blocked') })
      }
    } catch {
      toast({ title: t('common.error') || 'Error', variant: 'destructive' })
    }
  }

  const expandRow = async (ip: string) => {
    if (expandedIp === ip) {
      setExpandedIp(null)
      return
    }
    setExpandedIp(ip)
    setFilesLoading(true)
    try {
      const res = await axios.get('/api/manage/cusConfig/files', {
        params: { ip, start: 0, count: 20 }
      })
      setIpFiles(res.data?.data || [])
      setIpFilesTotal(res.data?.total || 0)
    } catch {
      setIpFiles([])
    } finally {
      setFilesLoading(false)
    }
  }

  const handleLogout = async () => {
    try { await axios.post('/api/auth/logout') } catch {}
    setAdminLoggedIn(false)
    navigate('/adminLogin', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
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

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <h2 className="text-xl font-semibold mb-6">{t('customerConfig.title')}</h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 py-3 border-b text-sm font-medium text-muted-foreground">
                <span>{t('customerConfig.ip')}</span>
                <span>{t('customerConfig.address')}</span>
                <span className="text-center">{t('customerConfig.uploadCount')}</span>
                <span className="text-center">{t('customerConfig.allowUpload')}</span>
              </div>

              {/* Table Rows */}
              {ipList.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  {t('common.noData')}
                </div>
              ) : (
                ipList.map((record) => {
                  const isBlocked = blockedIps.includes(record.ip)
                  const isExpanded = expandedIp === record.ip
                  return (
                    <div key={record.ip} className="border-b last:border-b-0">
                      <div
                        className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-4 py-3 items-center hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => expandRow(record.ip)}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="text-sm font-mono truncate">{record.ip}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{record.address}</span>
                        <span className="text-sm text-center min-w-[60px]">{record.count}</span>
                        <div className="flex items-center gap-2 min-w-[120px] justify-center">
                          <span className="text-xs text-muted-foreground">
                            {isBlocked ? t('customerConfig.blocked') : ''}
                          </span>
                          <button
                            className={`w-10 h-5 rounded-full transition-colors ${!isBlocked ? 'bg-primary' : 'bg-destructive'}`}
                            onClick={(e) => { e.stopPropagation(); toggleBlock(record.ip) }}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${!isBlocked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                          <span className="text-xs text-muted-foreground">
                            {!isBlocked ? t('customerConfig.allowed') : ''}
                          </span>
                        </div>
                      </div>

                      {/* Expanded: file list */}
                      {isExpanded && (
                        <div className="px-6 pb-4 bg-muted/20">
                          <h4 className="text-sm font-medium py-2 text-center">{t('customerConfig.fileList')}</h4>
                          {filesLoading ? (
                            <div className="py-4 text-center text-muted-foreground text-sm">{t('common.loading')}</div>
                          ) : ipFiles.length === 0 ? (
                            <div className="py-4 text-center text-muted-foreground text-sm">{t('common.noData')}</div>
                          ) : (
                            <div className="border rounded-md overflow-hidden">
                              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                                <span>{t('customerConfig.fileName')}</span>
                                <span>{t('customerConfig.preview')}</span>
                                <span>{t('customerConfig.uploadTime')}</span>
                              </div>
                              {ipFiles.map((file, idx) => (
                                <div key={idx} className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 border-t items-center">
                                  <span className="text-sm truncate">{file.id}</span>
                                  <div className="w-16 h-12 rounded overflow-hidden bg-muted">
                                    <img
                                      src={`/file/${file.id}`}
                                      alt={file.id}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {file.metadata?.TimeStamp
                                      ? new Date(file.metadata.TimeStamp).toLocaleString()
                                      : '-'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {ipFilesTotal > 20 && (
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              {t('customerConfig.showingOf', { shown: ipFiles.length, total: ipFilesTotal })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            {t('common.prev') || 'Prev'}
          </Button>
          <span className="text-sm text-muted-foreground">{page + 1}</span>
          <Button variant="outline" size="sm" disabled={ipList.length < pageSize} onClick={() => setPage(p => p + 1)}>
            {t('common.next') || 'Next'}
          </Button>
        </div>
      </main>
    </div>
  )
}
