import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { GoogleIcon } from '../components/Icons'
import { useAppState } from '../context/useAppState'
import '../App.css'

function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { authConfigured, login, resendVerificationEmail, signInWithGoogle } = useAppState()

  const verificationEmail = useMemo(
    () => location.state?.verificationEmail || '',
    [location.state],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      await login({ identifier, password })
      navigate(location.state?.from || '/profil')
    } catch (error) {
      setErrorMessage(error.message || 'Giriş sırasında bir sorun oluştu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await signInWithGoogle()
    } catch (error) {
      setErrorMessage(error.message || 'Google ile giriş başlatılamadı.')
    }
  }

  const handleResendVerification = async () => {
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await resendVerificationEmail(verificationEmail)
      setSuccessMessage('Doğrulama maili tekrar gönderildi.')
    } catch (error) {
      setErrorMessage(error.message || 'Doğrulama maili tekrar gönderilemedi.')
    }
  }

  return (
    <div className="page-shell">
      <Navbar minimal />

      <main className="auth-page">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>Giriş Yap</h1>
          <p>Mail, kullanıcı adı ya da telefon ile hesabına güvenli şekilde giriş yap.</p>

          {!authConfigured ? (
            <div className="auth-card__alert auth-card__alert--warning">
              Supabase ayarları eksik. Önce `.env` dosyasına `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` eklenmeli.
            </div>
          ) : null}

          {location.search.includes('verified=1') ? (
            <div className="auth-card__alert auth-card__alert--success">
              Mail doğrulaması tamamlandıysa şimdi giriş yapabilirsin.
            </div>
          ) : null}

          {verificationEmail ? (
            <div className="auth-card__alert auth-card__alert--info">
              <span>{verificationEmail} adresine doğrulama maili gönderildi.</span>
              <button className="ghost-button ghost-button--compact" type="button" onClick={handleResendVerification}>
                Tekrar Gönder
              </button>
            </div>
          ) : null}

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          {successMessage ? <p className="form-success">{successMessage}</p> : null}

          <label className="field-stack">
            <span>Kullanıcı Adı, Mail ya da Tel No</span>
            <input
              className="input-shell"
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="field-stack">
            <span>Şifre</span>
            <input
              className="input-shell"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>

          <button className="primary-button auth-card__submit" type="submit" disabled={isSubmitting || !authConfigured}>
            {isSubmitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>

          <button className="ghost-button auth-card__submit auth-card__oauth" type="button" onClick={handleGoogleLogin} disabled={!authConfigured}>
            <span className="auth-card__oauth-icon" aria-hidden="true">
              <GoogleIcon />
            </span>
            <span>Google</span>
          </button>

          <p className="auth-card__switch">
            Hesabın yok mu? <Link to="/kayit-ol">Kayıt Ol</Link>
          </p>

          <p className="auth-card__helper">
            <Link to="/sifre-sifirla">Şifremi Unuttum</Link>
          </p>
        </form>
      </main>

      <Footer />
    </div>
  )
}

export default LoginPage
