import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'
import axios from '@/utils/axios'

interface AuthGuardProps {
  children: React.ReactNode
  type: 'admin' | 'user'
}

export function AuthGuard({ children, type }: AuthGuardProps) {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const navigate = useNavigate()
  const { setAdminLoggedIn, setUserLoggedIn } = useAppStore()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/api/auth/sessionCheck')
        const data = res.data

        // Validate response shape - if not a proper JSON object, treat as unauthorized
        if (!data || typeof data !== 'object' || !('adminRequired' in data || 'userRequired' in data)) {
          throw new Error('Invalid session check response')
        }

        if (type === 'admin') {
          if (data.adminRequired === false) {
            // No admin credentials configured - allow access
            setAdminLoggedIn(true)
            setAuthorized(true)
            return
          }
          if (data.valid && data.authType === 'admin') {
            setAdminLoggedIn(true)
            setAuthorized(true)
            return
          }
          setAdminLoggedIn(false)
          setAuthorized(false)
          navigate('/adminLogin', { replace: true })
        } else {
          if (data.userRequired === false) {
            setUserLoggedIn(true)
            setAuthorized(true)
            return
          }
          if (data.valid) {
            setUserLoggedIn(true)
            setAuthorized(true)
            return
          }
          setUserLoggedIn(false)
          setAuthorized(false)
          navigate('/login', { replace: true })
        }
      } catch {
        setAuthorized(false)
        if (type === 'admin') {
          setAdminLoggedIn(false)
          navigate('/adminLogin', { replace: true })
        } else {
          setUserLoggedIn(false)
          navigate('/login', { replace: true })
        }
      }
    }

    checkAuth()
  }, [])

  if (authorized !== true) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
