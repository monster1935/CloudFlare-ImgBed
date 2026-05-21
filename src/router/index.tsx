import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { lazy, Suspense } from 'react'

const UploadHome = lazy(() => import('@/pages/UploadHome'))
const Login = lazy(() => import('@/pages/Login'))
const AdminLogin = lazy(() => import('@/pages/AdminLogin'))
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'))
const CustomerConfig = lazy(() => import('@/pages/CustomerConfig'))
const SystemConfig = lazy(() => import('@/pages/SystemConfig'))
const BlockImage = lazy(() => import('@/pages/BlockImage'))
const WhiteListOn = lazy(() => import('@/pages/WhiteListOn'))
const PublicBrowse = lazy(() => import('@/pages/PublicBrowse'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route
            path="/"
            element={
              <AuthGuard type="user">
                <UploadHome />
              </AuthGuard>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/adminLogin" element={<AdminLogin />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard type="admin">
                <AdminDashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/customerConfig"
            element={
              <AuthGuard type="admin">
                <CustomerConfig />
              </AuthGuard>
            }
          />
          <Route
            path="/systemConfig"
            element={
              <AuthGuard type="admin">
                <SystemConfig />
              </AuthGuard>
            }
          />
          <Route path="/blockimg" element={<BlockImage />} />
          <Route path="/whiteliston" element={<WhiteListOn />} />
          <Route path="/browse/*" element={<PublicBrowse />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
