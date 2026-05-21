import { useAppStore } from '@/store'

interface LogoProps {
  size?: 'small' | 'normal' | 'large'
}

export function Logo({ size = 'normal' }: LogoProps) {
  const { userConfig, useDarkMode } = useAppStore()

  const logoUrl: string = (userConfig?.logoUrl as string) || (useDarkMode ? '/static/media/logo-dark.png' : '/static/media/logo.png')
  const href: string = (userConfig?.logoLink as string) || 'https://github.com/MarSeventh/CloudFlare-ImgBed'

  const sizeClasses = {
    small: 'w-8 h-8',
    normal: 'w-10 h-10',
    large: 'w-14 h-14',
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">
      <img
        src={logoUrl as string}
        alt="Sanyue logo"
        className={`${sizeClasses[size]} rounded-full hover:scale-110 transition-transform`}
      />
    </a>
  )
}
