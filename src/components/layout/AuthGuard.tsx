import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import axios from '@/utils/axios'
import { toast } from '@/hooks/useToast'
import { useTranslation } from 'react-i18next'

interface AuthGuardProps {
  children: React.ReactNode
  type: 'admin' | 'user'
}

export function AuthGuard({ children, type }: AuthGuardProps) {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { adminLoggedIn, userLoggedIn, setAdminLoggedIn, setUserLoggedIn } = useAppStore()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/api/auth/sessionCheck')
        const data = res.data || {}

        if (type === 'admin') {
          if (!data.adminRequired) {
            setAdminLoggedIn(true)
            setAuthorized(true)
            return
          }
          if (data.valid && data.authType === 'admin') {
            setAdminLoggedIn(true)
            setAuthorized(true)
            return
          }
          if (adminLoggedIn) {
            toast({ title: t('login.authRequired'), variant: 'destructive' })
          }
          setAdminLoggedIn(false)
          navigate('/adminLogin', { replace: true })
        } else {
          if (!data.userRequired) {
            setUserLoggedIn(true)
            setAuthorized(true)
            return
          }
          if (data.valid) {
            setUserLoggedIn(true)
            setAuthorized(true)
            return
          }
          if (userLoggedIn) {
            toast({ title: t('login.authRequired'), variant: 'destructive' })
          }
          setUserLoggedIn(false)
          navigate('/login', { replace: true })
        }
      } catch {
        if (type === 'admin') {
          if (adminLoggedIn) {
            toast({ title: t('login.authRequired'), variant: 'destructive' })
          }
          setAdminLoggedIn(false)
          navigate('/adminLogin', { replace: true })
        } else {
          if (userLoggedIn) {
            toast({ title: t('login.authRequired'), variant: 'destructive' })
          }
          setUserLoggedIn(false)
          navigate('/login', { replace: true })
        }
      }
    }

    checkAuth()
  }, [])

  if (authorized === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
