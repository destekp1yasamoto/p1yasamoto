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
  const navigate = useNavigate()
  const { register } = useAppState()

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    register(form)
    navigate('/profil')
  }

  return (
    <div className="page-shell">
      <Navbar minimal />

      <main className="auth-page">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>Kayıt Ol</h1>
          <p>Ücretsiz hesap oluştur, ilan ver.</p>

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
            />
          </label>

          <button className="primary-button auth-card__submit" type="submit">
            Hesap Oluştur
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
