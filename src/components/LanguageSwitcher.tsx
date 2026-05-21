import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import { setLocale } from '@/locales'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLocale = i18n.language === 'zh-CN' ? 'en' : 'zh-CN'
    setLocale(newLocale)
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleLanguage} title={i18n.language === 'zh-CN' ? 'English' : '中文'}>
      <Globe className="h-5 w-5" />
    </Button>
  )
}
