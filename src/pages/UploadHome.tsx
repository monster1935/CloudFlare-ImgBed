import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, Check, Trash2, RefreshCw, Camera, Settings, Link2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/useToast'
import { useAppStore } from '@/store'
import { Logo } from '@/components/Logo'
import { Footer } from '@/components/Footer'
import { ToggleDark } from '@/components/ToggleDark'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import axios from '@/utils/axios'
import { buildFileUrl, getUrlByFormat } from '@/utils/urlBuilder'

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico', 'avif', 'heic']
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mkv']
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'aac']

function getFileType(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video'
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio'
  return 'other'
}

interface UploadedFile {
  name: string
  src: string
  status: 'uploading' | 'done' | 'exception'
  type: string
  urls: {
    url: string
    markdown: string
    html: string
    bbcode: string
  }
}

type UrlFormat = 'url' | 'markdown' | 'html' | 'bbcode'

export default function UploadHome() {
  const { t } = useTranslation()
  const { uploadFolder, setUploadFolder, userConfig } = useAppStore()
  const [isDragging, setIsDragging] = useState(false)
  const [fileList, setFileList] = useState<UploadedFile[]>([])
  const [selectedUrlForm, setSelectedUrlForm] = useState<UrlFormat>('url')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ownerName = (userConfig?.ownerName as string) || 'Sanyue'
  const siteTitle = (userConfig?.siteTitle as string) || 'ImgHub'

  // Stats
  const imageCount = fileList.filter((f) => f.type === 'image' && f.status === 'done').length
  const videoCount = fileList.filter((f) => f.type === 'video' && f.status === 'done').length
  const audioCount = fileList.filter((f) => f.type === 'audio' && f.status === 'done').length

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      const fileType = getFileType(file.name)
      const placeholder: UploadedFile = {
        name: file.name,
        src: '',
        status: 'uploading',
        type: fileType,
        urls: { url: '', markdown: '', html: '', bbcode: '' },
      }

      setFileList((prev) => [placeholder, ...prev])

      try {
        const formData = new FormData()
        formData.append('file', file)
        if (uploadFolder) {
          formData.append('folder', uploadFolder)
        }

        const res = await axios.post('/upload', formData)
        if (res.data?.[0]?.src) {
          const src = res.data[0].src
          const fullUrl = window.location.origin + src
          const urls = buildFileUrl(file.name, fullUrl)
          setFileList((prev) =>
            prev.map((f) =>
              f.name === placeholder.name && f.status === 'uploading'
                ? { ...f, status: 'done', src: fullUrl, urls }
                : f
            )
          )
        } else {
          setFileList((prev) =>
            prev.map((f) =>
              f.name === placeholder.name && f.status === 'uploading'
                ? { ...f, status: 'exception' }
                : f
            )
          )
          toast({ title: t('upload.failed'), variant: 'destructive' })
        }
      } catch {
        setFileList((prev) =>
          prev.map((f) =>
            f.name === placeholder.name && f.status === 'uploading'
              ? { ...f, status: 'exception' }
              : f
          )
        )
        toast({ title: t('upload.failed'), variant: 'destructive' })
      }
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleUpload(e.dataTransfer.files)
    },
    [uploadFolder]
  )

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      const files: File[] = []
      for (const item of Array.from(items)) {
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
      if (files.length > 0) {
        const dt = new DataTransfer()
        files.forEach((f) => dt.items.add(f))
        handleUpload(dt.files)
      }
    },
    [uploadFolder]
  )

  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast({ title: t('upload.copied') })
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const copyAll = () => {
    const doneFiles = fileList.filter((f) => f.status === 'done')
    const text = doneFiles.map((f) => getUrlByFormat(f.urls, selectedUrlForm)).join('\n')
    navigator.clipboard.writeText(text)
    toast({ title: t('upload.copied') })
  }

  const removeFile = (index: number) => {
    setFileList((prev) => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setFileList([])
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3">
        <Logo size="normal" />
        <div className="flex items-center gap-2">
          <Input
            placeholder="上传目录"
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value)}
            className="w-28 h-8 text-xs"
          />
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" onClick={() => window.open('/dashboard', '_self')}>
            <Settings className="h-5 w-5" />
          </Button>
          <ToggleDark />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-4xl pt-24 pb-8 px-4">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{ownerName}</span>{' '}
          <span>{siteTitle}</span>
        </h1>

        {/* Upload Zone */}
        <Card
          className={`border-2 border-dashed transition-all cursor-pointer mb-6 ${
            isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
            <Camera className="h-12 w-12 text-primary/60 mb-4" />
            <p className="text-muted-foreground">
              拖拽 点击 或 Ctrl + V 粘贴上传
            </p>
          </CardContent>
        </Card>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />

        {/* File List */}
        {fileList.length > 0 && (
          <Card>
            <CardContent className="p-4">
              {/* Stats & Actions */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>🖼 {imageCount}</span>
                  <span>🎬 {videoCount}</span>
                  <span>🎵 {audioCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600" onClick={copyAll} title="Copy all">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600" title="Re-upload failed">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={clearAll} title="Clear all">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* File Items */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {fileList.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    {/* Thumbnail */}
                    <div className="w-24 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {file.type === 'image' && file.src ? (
                        <img src={file.src} alt={file.name} className="w-full h-full object-cover" />
                      ) : file.type === 'video' && file.src ? (
                        <video src={file.src} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Upload className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate mb-1">{file.name}</p>
                      {file.status === 'done' && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {(['url', 'markdown', 'html', 'bbcode'] as UrlFormat[]).map((format) => (
                            <button
                              key={format}
                              onClick={() => copyToClipboard(getUrlByFormat(file.urls, format), index)}
                              className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                                format === 'url' ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' :
                                format === 'markdown' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400' :
                                format === 'html' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
                              }`}
                            >
                              {format === 'url' ? 'URL' : format === 'markdown' ? 'MarkDown' : format.toUpperCase()}
                            </button>
                          ))}
                          <Input
                            readOnly
                            value={getUrlByFormat(file.urls, selectedUrlForm)}
                            className="h-6 text-xs flex-1 min-w-[200px] bg-muted/50"
                            onClick={(e) => {
                              (e.target as HTMLInputElement).select()
                              copyToClipboard(getUrlByFormat(file.urls, selectedUrlForm), index)
                            }}
                          />
                        </div>
                      )}
                      {file.status === 'uploading' && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                          <p className="text-xs text-muted-foreground">{t('upload.uploading')}</p>
                        </div>
                      )}
                      {file.status === 'exception' && (
                        <p className="text-xs text-destructive mt-1">{t('upload.failed')}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      {file.status === 'done' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-green-500 hover:text-green-600"
                          onClick={() => copyToClipboard(getUrlByFormat(file.urls, selectedUrlForm), index)}
                        >
                          {copiedIndex === index ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => removeFile(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  )
}
