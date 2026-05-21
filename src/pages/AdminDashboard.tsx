import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Images, Filter, SortDesc, Grid3X3, List, LogOut, Search,
  Home, Trash2, CheckSquare, Square,
  ChevronLeft, ChevronRight, FolderOpen, Monitor, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ToggleDark } from '@/components/ToggleDark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useAppStore } from '@/store'
import { toast } from '@/hooks/useToast'
import axios from '@/utils/axios'

interface FileItem {
  name: string
  metadata?: {
    channel?: string
    channelName?: string
    ListType?: string
    Label?: string
    TimeStamp?: number
    fileSize?: number
    mimeType?: string
    tags?: string
    [key: string]: unknown
  }
}

interface DirectoryItem {
  name: string
  fileCount?: number
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { setAdminLoggedIn } = useAppStore()
  const [files, setFiles] = useState<FileItem[]>([])
  const [directories, setDirectories] = useState<DirectoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [currentPath, setCurrentPath] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const pageSize = 20

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  // Build the image thumbnail URL from file name
  const getFileUrl = (name: string) => `/file/${name}`

  // Get channel label from metadata
  const getChannelLabel = (metadata?: FileItem['metadata']) => {
    if (!metadata?.channel) return null
    const ch = metadata.channel
    if (ch === 'TelegramNew' || ch === 'Telegram') return 'TG'
    if (ch === 'CloudflareR2') return 'R2'
    if (ch === 'S3') return 'S3'
    if (ch === 'Backblaze') return 'B2'
    if (ch.includes('HuggingFace') || ch === 'Huggingface') return 'HF'
    return ch.substring(0, 2).toUpperCase()
  }

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const start = (currentPage - 1) * pageSize
      const params: Record<string, string | number> = {
        start,
        count: pageSize,
      }
      if (currentPath) params.dir = currentPath
      if (search) params.search = search

      const res = await axios.get('/api/manage/list', { params })
      const data = res.data
      if (data) {
        setFiles(data.files || [])
        setDirectories(data.directories || [])
        setTotalCount(data.totalCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch files:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, currentPath, search])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout')
    } catch { /* ignore */ }
    setAdminLoggedIn(false)
    navigate('/adminLogin', { replace: true })
  }

  const handleDelete = async (fileNames: string[]) => {
    if (fileNames.length === 0) return
    try {
      await axios.post('/api/manage/batch/delete', { keys: fileNames })
      toast({ title: t('dashboard.deleted', { count: fileNames.length }) })
      setSelectedFiles([])
      fetchFiles()
    } catch {
      toast({ title: t('dashboard.deleteFailed'), variant: 'destructive' })
    }
  }

  const toggleSelect = (name: string) => {
    setSelectedFiles((prev) =>
      prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]
    )
  }

  const selectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(files.map((f) => f.name))
    }
  }

  const navigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath)
    setCurrentPage(1)
    setSelectedFiles([])
  }

  const pathParts = currentPath.split('/').filter(Boolean)

  // Navigation tabs
  const navTabs = [
    { label: t('dashboard.title') || 'File Manager', icon: Images, path: '/dashboard' },
    { label: t('systemConfig.title') || 'System Config', icon: Monitor, path: '/systemConfig' },
    { label: t('common.publicBrowse') || 'Public Browse', icon: Globe, path: '/browse' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left: Nav Tabs */}
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

          {/* Right: Search & Actions */}
          <div className="flex items-center gap-2">
            <ToggleDark />
            <LanguageSwitcher />
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('dashboard.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchFiles()}
                className="pl-9 w-48 md:w-64 h-9"
              />
            </div>
            <Button variant="ghost" size="icon" title="Filter">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Sort">
              <SortDesc className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
              title={viewMode === 'card' ? 'List view' : 'Card view'}
            >
              {viewMode === 'card' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="px-4 py-2 flex items-center gap-1 text-sm border-b">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateToFolder('')}>
          <Home className="h-4 w-4" />
        </Button>
        {pathParts.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-muted-foreground">/</span>
            <button
              className="hover:text-primary transition-colors"
              onClick={() => navigateToFolder(pathParts.slice(0, i + 1).join('/'))}
            >
              {part}
            </button>
          </span>
        ))}

        {/* Batch actions */}
        {selectedFiles.length > 0 && (
          <div className="ml-auto flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">
              {selectedFiles.length} {t('dashboard.selected')}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={selectAll}>
              <CheckSquare className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(selectedFiles)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {directories.length > 0 && <span>📁 {directories.length} </span>}
          📄 {totalCount}
        </span>
      </div>

      {/* Content */}
      <main className="flex-1 p-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : files.length === 0 && directories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FolderOpen className="h-16 w-16 mb-4" />
            <p>{t('common.noData') || 'No files'}</p>
          </div>
        ) : viewMode === 'card' ? (
          /* Card Grid View */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Directories first */}
            {directories.map((dir, index) => (
              <Card
                key={`dir-${index}`}
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => navigateToFolder(currentPath ? `${currentPath}/${dir.name}` : dir.name)}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center aspect-[4/3]">
                  <FolderOpen className="h-12 w-12 text-amber-500 mb-2" />
                  <p className="text-sm font-medium truncate w-full text-center">{dir.name}</p>
                  {dir.fileCount !== undefined && (
                    <p className="text-xs text-muted-foreground">{dir.fileCount} files</p>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Files */}
            {files.map((file, index) => {
              const channelLabel = getChannelLabel(file.metadata)
              return (
                <Card
                  key={`file-${index}`}
                  className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                >
                  {/* Channel Badge */}
                  {channelLabel && (
                    <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-600 text-white">
                      {channelLabel}
                    </span>
                  )}

                  {/* Select Checkbox */}
                  <button
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); toggleSelect(file.name) }}
                  >
                    {selectedFiles.includes(file.name) ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Image Thumbnail */}
                  <div className="aspect-[4/3] bg-muted">
                    <img
                      src={getFileUrl(file.name)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>

                  {/* File Name Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
                    <p className="text-xs text-white truncate">{file.name}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-1">
            {/* Directories first */}
            {directories.map((dir, index) => (
              <div
                key={`dir-${index}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigateToFolder(currentPath ? `${currentPath}/${dir.name}` : dir.name)}
              >
                <FolderOpen className="h-8 w-8 text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{dir.name}</p>
                  {dir.fileCount !== undefined && (
                    <p className="text-xs text-muted-foreground">{dir.fileCount} files</p>
                  )}
                </div>
              </div>
            ))}

            {/* Files */}
            {files.map((file, index) => (
              <div
                key={`file-${index}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <button onClick={() => toggleSelect(file.name)}>
                  {selectedFiles.includes(file.name) ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>

                <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={getFileUrl(file.name)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  {file.metadata?.channel && (
                    <p className="text-xs text-muted-foreground">{getChannelLabel(file.metadata)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
