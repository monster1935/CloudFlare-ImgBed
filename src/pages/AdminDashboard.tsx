import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  Images, Filter, SortDesc, Grid3X3, List, Link2, LogOut, Search,
  Home, MoreHorizontal, Trash2, Download, Move, Tag, CheckSquare, Square,
  ChevronLeft, ChevronRight, FolderOpen, RefreshCw
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
  url: string
  name: string
  channel?: string
  channelName?: string
  metadata?: Record<string, unknown>
  isFolder?: boolean
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setAdminLoggedIn } = useAppStore()
  const [tableData, setTableData] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [currentPath, setCurrentPath] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [sortOption, setSortOption] = useState('dateDesc')
  const pageSize = 15

  const fetchFiles = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        pageSize,
        sort: sortOption,
      }
      if (currentPath) params.path = currentPath
      if (search) params.search = search

      const res = await axios.get('/api/manage/list', { params })
      const data = res.data
      if (data) {
        setTableData(data.data || data.files || [])
        const total = data.totalCount || data.total || 0
        setTotalPages(Math.ceil(total / pageSize) || 1)
      }
    } catch (err) {
      console.error('Failed to fetch files:', err)
    } finally {
      setLoading(false)
    }
  }, [currentPage, currentPath, search, sortOption])

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

  const handleDelete = async (files: string[]) => {
    if (files.length === 0) return
    try {
      await axios.post('/api/manage/delete', { keys: files })
      toast({ title: `Deleted ${files.length} file(s)` })
      setSelectedFiles([])
      fetchFiles()
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
    }
  }

  const toggleSelect = (url: string) => {
    setSelectedFiles((prev) =>
      prev.includes(url) ? prev.filter((f) => f !== url) : [...prev, url]
    )
  }

  const selectAll = () => {
    if (selectedFiles.length === tableData.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(tableData.map((f) => f.url))
    }
  }

  const navigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath)
    setCurrentPage(1)
    setSelectedFiles([])
  }

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    setCurrentPath(parts.join('/'))
    setCurrentPage(1)
  }

  const pathParts = currentPath.split('/').filter(Boolean)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Left: Title & Nav */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate('/dashboard')}
            >
              <Images className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.title') || '文件管理'}</span>
            </Button>
            <ToggleDark />
            <LanguageSwitcher />
          </div>

          {/* Right: Search & Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索：#标签 -#排除标签"
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
              {selectedFiles.length} selected
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(selectedFiles)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          📁 {tableData.filter(f => f.isFolder).length} 📄 {tableData.filter(f => !f.isFolder).length}
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
        ) : tableData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FolderOpen className="h-16 w-16 mb-4" />
            <p>{t('common.noData')}</p>
          </div>
        ) : viewMode === 'card' ? (
          /* Card Grid View */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tableData.map((file, index) => (
              file.isFolder ? (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => navigateToFolder(currentPath ? `${currentPath}/${file.name}` : file.name)}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center aspect-[4/3]">
                    <FolderOpen className="h-12 w-12 text-amber-500 mb-2" />
                    <p className="text-sm font-medium truncate w-full text-center">{file.name}</p>
                  </CardContent>
                </Card>
              ) : (
                <Card
                  key={index}
                  className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                >
                  {/* Channel Badge */}
                  {file.channel && (
                    <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-600 text-white">
                      {file.channel === 'TelegramNew' ? 'TG' :
                       file.channel === 'CloudflareR2' ? 'R2' :
                       file.channel === 'S3' ? 'S3' :
                       file.channel?.substring(0, 2).toUpperCase()}
                    </span>
                  )}

                  {/* Select Checkbox */}
                  <button
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); toggleSelect(file.url) }}
                  >
                    {selectedFiles.includes(file.url) ? (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Image */}
                  <div className="aspect-[4/3] bg-muted">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* File Name Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2">
                    <p className="text-xs text-white truncate">{file.name}</p>
                  </div>
                </Card>
              )
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-1">
            {tableData.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <button onClick={() => toggleSelect(file.url)}>
                  {selectedFiles.includes(file.url) ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>

                {file.isFolder ? (
                  <FolderOpen className="h-8 w-8 text-amber-500 flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  {file.channel && (
                    <p className="text-xs text-muted-foreground">{file.channel}</p>
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
