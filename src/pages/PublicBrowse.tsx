import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Image, FileText, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminNav } from '@/components/layout/AdminNav'
import axios from '@/utils/axios'

interface PublicFile {
  name: string
  metadata?: {
    FileType?: string
    TimeStamp?: string
    FileSize?: number
  }
}

export default function PublicBrowse() {
  const { t } = useTranslation()
  const { '*': rawDir } = useParams()
  const navigate = useNavigate()
  const dir = rawDir || ''

  const [files, setFiles] = useState<PublicFile[]>([])
  const [directories, setDirectories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadFiles()
  }, [dir])

  const loadFiles = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.get('/api/public/list', { params: { dir } })
      setFiles(res.data?.files || [])
      setDirectories(res.data?.directories || [])
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to load'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const navigateToDir = (subdir: string) => {
    const newDir = dir ? `${dir}/${subdir}` : subdir
    navigate(`/browse/${newDir}`)
  }

  const goUp = () => {
    const parts = dir.split('/').filter(Boolean)
    parts.pop()
    navigate(parts.length ? `/browse/${parts.join('/')}` : '/browse')
  }

  const isImage = (file: PublicFile) => {
    const type = file.metadata?.FileType || ''
    return type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(file.name)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <AdminNav />

      <div className="container mx-auto max-w-6xl py-8 px-4 flex-1">
      {/* Directory Header */}
      <div className="flex items-center gap-3 mb-6">
        {dir && (
          <Button variant="ghost" size="sm" onClick={goUp}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('common.back') || 'Back'}
          </Button>
        )}
        <h1 className="text-xl font-semibold">
          /{dir || ''}
        </h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : (
        <>
          {/* Directories */}
          {directories.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
              {directories.map(subdir => (
                <Card
                  key={subdir}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => navigateToDir(subdir)}
                >
                  <CardContent className="p-4 flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-yellow-500 shrink-0" />
                    <span className="text-sm truncate">{subdir}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Files */}
          {files.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {files.map(file => (
                <a
                  key={file.name}
                  href={`/file/${file.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Card className="overflow-hidden hover:ring-2 ring-primary transition-all">
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {isImage(file) ? (
                        <img
                          src={`/file/${file.name}`}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <FileText className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs truncate text-muted-foreground">{file.name.split('/').pop()}</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          ) : directories.length === 0 && (
            <div className="text-center py-20">
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t('common.noData')}</p>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  )
}
