import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import AddListing from './pages/AddListing'
import ContactPage from './pages/ContactPage'
import FavoritesPage from './pages/FavoritesPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ListingDetailPage from './pages/ListingDetailPage'
import LoginPage from './pages/LoginPage'
import MessagesPage from './pages/MessagesPage'
import ProtectedRoute from './components/ProtectedRoute'
import ProfilePage from './pages/ProfilePage'
import ComparePage from './pages/ComparePage'
import RegisterPage from './pages/RegisterPage'

function App() {
  return (
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
  )
}

export default App
