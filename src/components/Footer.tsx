import { useAppStore } from '@/store'

export function Footer() {
  const { userConfig } = useAppStore()
  const footerLink = (userConfig?.footerLink as string) || 'https://github.com/monster1935/CloudFlare-ImgBed'
  const disableFooter = userConfig?.disableFooter || false
  const year = new Date().getFullYear()

  if (disableFooter) return null

  return (
    <footer className="py-4 text-center text-sm text-muted-foreground">
      <p>
        © {year}{' '}
        <a href={footerLink} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
          Yuebin ImgHub
        </a>
      </p>
    </footer>
  )
}
