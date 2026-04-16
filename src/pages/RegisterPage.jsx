import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAppState } from '../context/useAppState'
import '../App.css'

function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { authConfigured, register, signInWithGoogle } = useAppState()

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const result = await register(form)
      navigate('/giris', {
        state: {
          verificationEmail: result.email,
        },
      })
    } catch (error) {
      setErrorMessage(error.message || 'Kayıt sırasında bir sorun oluştu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleRegister = async () => {
    setErrorMessage('')

    try {
      await signInWithGoogle()
    } catch (error) {
      setErrorMessage(error.message || 'Google ile kayıt başlatılamadı.')
    }
  }

  return (
    <div className="page-shell">
      <Navbar minimal />

      <main className="auth-page">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>Kayıt Ol</h1>
          <p>Gerçek hesap oluştur, mailini doğrula ve ilanlarını hesabına bağlı yönet.</p>

          {!authConfigured ? (
            <div className="auth-card__alert auth-card__alert--warning">
              Supabase ayarları eksik. Önce `.env` dosyasına `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` eklenmeli.
            </div>
          ) : null}

          {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

          <label className="field-stack">
            <span>İsim / Kullanıcı Adı</span>
            <input
              className="input-shell"
              type="text"
              placeholder="En az 3 karakter"
              value={form.name}
              onChange={updateField('name')}
            />
          </label>

          <label className="field-stack">
            <span>E-Posta</span>
            <input
              className="input-shell"
              type="email"
              placeholder="ornek@mail.com"
              value={form.email}
              onChange={updateField('email')}
            />
          </label>

          <label className="field-stack">
            <span>Tel No</span>
            <input
              className="input-shell"
              type="tel"
              placeholder="05xx xxx xx xx"
              value={form.phone}
              onChange={updateField('phone')}
            />
          </label>

          <label className="field-stack">
            <span>Şifre</span>
            <input
              className="input-shell"
              type="password"
              placeholder="En az 6 karakter"
              value={form.password}
              onChange={updateField('password')}
              autoComplete="new-password"
            />
          </label>

          <label className="field-stack">
            <span>Şifre Tekrar</span>
            <input
              className="input-shell"
              type="password"
              placeholder="Şifreni tekrar gir"
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
              autoComplete="new-password"
            />
          </label>

          <button className="primary-button auth-card__submit" type="submit" disabled={isSubmitting || !authConfigured}>
            {isSubmitting ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
          </button>

          <button className="ghost-button auth-card__submit" type="button" onClick={handleGoogleRegister} disabled={!authConfigured}>
            Google ile Kayıt Ol
          </button>

          <p className="auth-card__switch">
            Zaten hesabın var mı? <Link to="/giris">Giriş Yap</Link>
          </p>
        </form>
      </main>

      <Footer />
    </div>
  )
}

export default RegisterPage
