import '../styles/globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import { useRouter } from 'next/router'

function AppContent({ Component, pageProps }) {
  const router = useRouter()

  // Pages that don't need the layout
  const noLayoutPages = ['/', '/login', '/register']
  const isSharedChat = router.pathname.startsWith('/chat/') && router.pathname !== '/chat'
  const shouldUseLayout = !noLayoutPages.includes(router.pathname) && !isSharedChat

  return shouldUseLayout ? (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  ) : (
    <Component {...pageProps} />
  )
}

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AppContent Component={Component} pageProps={pageProps} />
    </AuthProvider>
  )
}
