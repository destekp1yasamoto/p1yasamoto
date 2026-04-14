import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAppState } from '../context/useAppState'
import '../App.css'

function LoginPage() {
  const [identifier, setIdentifier] = useState('demohesapmoto@gmail.com')
  const [password, setPassword] = useState('123456')
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAppState()

  const handleSubmit = (event) => {
    event.preventDefault()
    login(identifier)
    navigate(location.state?.from || '/profil')
  }

  return (
    <div className="page-shell">
      <Navbar minimal />

      <main className="auth-page">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>Giriş Yap</h1>
          <p>Hesabınıza giriş yapın.</p>

          <label className="field-stack">
            <span>Kullanıcı Adı, Mail ya da Tel No</span>
            <input
              className="input-shell"
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
          </label>

          <label className="field-stack">
            <span>Şifre</span>
            <input
              className="input-shell"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button className="primary-button auth-card__submit" type="submit">
            Giriş Yap
          </button>

          <p className="auth-card__switch">
            Hesabın yok mu? <Link to="/kayit-ol">Kayıt Ol</Link>
          </p>

          <div className="auth-card__demo">
            <span>Demo hesap:</span>
            <strong>demohesapmoto@gmail.com / 123456</strong>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  )
}

export default LoginPage
