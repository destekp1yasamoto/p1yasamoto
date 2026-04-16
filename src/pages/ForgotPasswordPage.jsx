import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAppState } from '../context/useAppState'
import '../App.css'

function ForgotPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { authConfigured, sendPasswordReset, session, updatePassword } = useAppState()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isRecoveryMode = useMemo(() => {
    const fullLocation = `${location.pathname}${location.search}${location.hash}`
    return fullLocation.includes('type=recovery') || Boolean(session?.user && location.hash.includes('access_token'))
  }, [location.hash, location.pathname, location.search, session?.user])

  const handleResetRequest = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const targetEmail = await sendPasswordReset(identifier)
      setSuccessMessage(`Şifre sıfırlama bağlantısı ${targetEmail} adresine gönderildi.`)
    } catch (error) {
      setErrorMessage(error.message || 'Şifre sıfırlama bağlantısı gönderilemedi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordUpdate = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (password.length < 6) {
      setErrorMessage('Yeni şifre en az 6 karakter olmalı.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Şifreler birbiriyle eşleşmiyor.')
      return
    }

    setIsSubmitting(true)

    try {
      await updatePassword(password)
      setSuccessMessage('Şifren güncellendi. Şimdi giriş yapabilirsin.')
      window.setTimeout(() => {
        navigate('/giris')
      }, 1200)
    } catch (error) {
      setErrorMessage(error.message || 'Şifre güncellenemedi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-shell">
      <Navbar minimal />

      <main className="auth-page">
        <form className="auth-card" onSubmit={isRecoveryMode ? handlePasswordUpdate : handleResetRequest}>
          <h1>{isRecoveryMode ? 'Yeni Şifre Belirle' : 'Şifremi Unuttum'}</h1>
          <p>
            {isRecoveryMode
              ? 'Mailden gelen güvenli bağlantı ile yeni şifreni oluştur.'
              : 'Mail, kullanıcı adı ya da telefon yazarak şifre sıfırlama bağlantısı iste.'}
          </p>

          {!authConfigured ? (
            <div className="auth-card__alert auth-card__alert--warning">
              Supabase ayarları eksik. Önce `.env` dosyasını doldurman gerekiyor.
            </div>
          ) : null}

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
          {successMessage ? <p className="form-success">{successMessage}</p> : null}

          {!isRecoveryMode ? (
            <label className="field-stack">
              <span>Mail, Kullanıcı Adı ya da Tel No</span>
              <input
                className="input-shell"
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
              />
            </label>
          ) : (
            <>
              <label className="field-stack">
                <span>Yeni Şifre</span>
                <input
                  className="input-shell"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              <label className="field-stack">
                <span>Şifre Tekrar</span>
                <input
                  className="input-shell"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>
            </>
          )}

          <button className="primary-button auth-card__submit" type="submit" disabled={isSubmitting || !authConfigured}>
            {isSubmitting
              ? 'İşleniyor...'
              : isRecoveryMode
                ? 'Şifreyi Güncelle'
                : 'Sıfırlama Linki Gönder'}
          </button>

          <p className="auth-card__switch">
            <Link to="/giris">Giriş ekranına dön</Link>
          </p>
        </form>
      </main>

      <Footer />
    </div>
  )
}

export default ForgotPasswordPage
