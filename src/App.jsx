import { useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AddListing from './pages/AddListing'
import ComparePage from './pages/ComparePage'
import ContactPage from './pages/ContactPage'
import FavoritesPage from './pages/FavoritesPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import Home from './pages/Home'
import ListingDetailPage from './pages/ListingDetailPage'
import LoginPage from './pages/LoginPage'
import MessagesPage from './pages/MessagesPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'

function AuthRedirectHandler() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.pathname !== '/') {
      return
    }

    const hash = window.location.hash || ''
    const search = location.search || ''

    if (hash.includes('type=recovery')) {
      navigate(`/sifre-sifirla${search}${hash}`, { replace: true })
      return
    }

    if (hash.includes('access_token') || search.includes('code=')) {
      navigate(`/profil${search}${hash}`, { replace: true })
    }
  }, [location.pathname, location.search, navigate])

  return null
}

function App() {
  return (
    <>
      <AuthRedirectHandler />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ilan/:id" element={<ListingDetailPage />} />
        <Route
          path="/ilan-ekle"
          element={
            <ProtectedRoute>
              <AddListing
                title="İlanını Yayına Hazırla"
                description="Fotoğraf limiti, plaka gizleme kuralı ve ilan formunun ana alanları artık hazır. Sonraki adımda bu ekran doğrudan backend'e bağlanabilir."
              />
            </ProtectedRoute>
          }
        />
        <Route path="/iletisim" element={<ContactPage />} />
        <Route path="/giris" element={<LoginPage />} />
        <Route path="/kayit-ol" element={<RegisterPage />} />
        <Route path="/sifre-sifirla" element={<ForgotPasswordPage />} />
        <Route
          path="/karsilastir"
          element={
            <ProtectedRoute>
              <ComparePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favoriler"
          element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mesajlar"
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App
