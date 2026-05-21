import { useTranslation } from 'react-i18next'

export default function CustomerConfig() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Customer Config</h1>
      <p className="text-muted-foreground">{t('common.loading')}</p>
    </div>
  )
}
