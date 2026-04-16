import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAppState } from '../context/useAppState'
import '../App.css'

const ratingOptions = [
  { id: 'kotu', emoji: '😞', label: 'Kötü' },
  { id: 'orta', emoji: '😐', label: 'Orta' },
  { id: 'iyi', emoji: '🙂', label: 'İyi' },
  { id: 'cok-iyi', emoji: '🤩', label: 'Çok İyi' },
]

function ContactPage() {
  const { authConfigured, isAuthenticated, submitSupportMessage } = useAppState()

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [contactFeedback, setContactFeedback] = useState({ error: '', success: '' })

  const [rating, setRating] = useState('iyi')
  const [ratingForm, setRatingForm] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [ratingFeedback, setRatingFeedback] = useState({ error: '', success: '' })

  const requireAuthMessage = 'Mesaj göndermek için önce hesabına giriş yapmalısın.'

  const updateContactField = (field) => (event) => {
    setContactForm((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const updateRatingField = (field) => (event) => {
    setRatingForm((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const handleContactSubmit = async (event) => {
    event.preventDefault()
    setContactFeedback({ error: '', success: '' })

    if (!isAuthenticated) {
      setContactFeedback({ error: requireAuthMessage, success: '' })
      return
    }

    try {
      await submitSupportMessage({
        kind: 'contact',
        name: contactForm.name,
        email: contactForm.email,
        subject: contactForm.subject.trim() || 'P1yasaMoto İletişim Mesajı',
        message: contactForm.message,
      })

      setContactFeedback({
        error: '',
        success: 'Mesajın başarıyla iletildi.',
      })
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: '',
      })
    } catch (error) {
      setContactFeedback({
        error: error.message || 'Mesaj gönderilirken bir sorun oluştu.',
        success: '',
      })
    }
  }

  const handleRatingSubmit = async (event) => {
    event.preventDefault()
    setRatingFeedback({ error: '', success: '' })

    if (!isAuthenticated) {
      setRatingFeedback({ error: requireAuthMessage, success: '' })
      return
    }

    const selectedRating = ratingOptions.find((item) => item.id === rating)

    try {
      await submitSupportMessage({
        kind: 'rating',
        name: ratingForm.name,
        email: ratingForm.email,
        subject: `Site puanlama - ${selectedRating?.label || 'Geri Bildirim'}`,
        message: ratingForm.message,
        rating: selectedRating?.label || '',
      })

      setRatingFeedback({
        error: '',
        success: 'Puanlaman kaydedildi. Geri bildirimin bize ulaştı.',
      })
      setRatingForm({
        name: '',
        email: '',
        message: '',
      })
    } catch (error) {
      setRatingFeedback({
        error: error.message || 'Puanlama gönderilirken bir sorun oluştu.',
        success: '',
      })
    }
  }

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-content page-content--compact">
        <section className="contact-page">
          <div className="contact-header">
            <h1>İletişim & Geri Bildirim</h1>
            <p>Sorularını ve görüşlerini doğrudan bize iletebilirsin.</p>
          </div>

          {!authConfigured ? (
            <article className="contact-card">
              <h2>Bağlantı Eksik</h2>
              <p className="field-note">
                İletişim mesajlarını doğrudan sisteme kaydetmek için Supabase bağlantısının aktif olması gerekiyor.
              </p>
            </article>
          ) : null}

          {!isAuthenticated ? (
            <article className="contact-card">
              <h2>Önce Giriş Yap</h2>
              <p className="field-note">
                İletişim mesajları ve site puanlamaları artık hesap üzerinden gönderiliyor. Bu yüzden önce giriş
                yapman gerekiyor.
              </p>
              <div className="filter-actions">
                <Link className="primary-button" to="/giris">
                  Giriş Yap
                </Link>
                <Link className="ghost-button" to="/kayit-ol">
                  Hesap Oluştur
                </Link>
              </div>
            </article>
          ) : null}

          <article className="contact-card">
            <h2>İletişim Formu</h2>
            <form onSubmit={handleContactSubmit}>
              <div className="form-grid">
                <label className="field-stack">
                  <span>Ad</span>
                  <input
                    className="input-shell"
                    type="text"
                    placeholder="Adını gir"
                    value={contactForm.name}
                    onChange={updateContactField('name')}
                  />
                </label>

                <label className="field-stack">
                  <span>Email</span>
                  <input
                    className="input-shell"
                    type="email"
                    placeholder="ornek@mail.com"
                    value={contactForm.email}
                    onChange={updateContactField('email')}
                  />
                </label>

                <label className="field-stack field-stack--full">
                  <span>Konu</span>
                  <input
                    className="input-shell"
                    type="text"
                    placeholder="Mesajının konusu"
                    value={contactForm.subject}
                    onChange={updateContactField('subject')}
                  />
                </label>

                <label className="field-stack field-stack--full">
                  <span>Mesaj</span>
                  <textarea
                    className="textarea-shell"
                    placeholder="Mesajını buraya yaz..."
                    value={contactForm.message}
                    onChange={updateContactField('message')}
                  />
                </label>
              </div>

              {contactFeedback.error ? <p className="form-error">{contactFeedback.error}</p> : null}
              {contactFeedback.success ? <p className="form-success">{contactFeedback.success}</p> : null}

              <button className="primary-button contact-card__button" type="submit" disabled={!authConfigured}>
                Gönder
              </button>
            </form>
          </article>

          <article className="contact-card">
            <h2>Site Puanlama</h2>
            <p className="field-note">Sitede neleri geliştirmemizi istediğini kısa bir notla ilet.</p>

            <form onSubmit={handleRatingSubmit}>
              <div className="form-grid">
                <label className="field-stack">
                  <span>Ad</span>
                  <input
                    className="input-shell"
                    type="text"
                    placeholder="Adını gir"
                    value={ratingForm.name}
                    onChange={updateRatingField('name')}
                  />
                </label>

                <label className="field-stack">
                  <span>Email</span>
                  <input
                    className="input-shell"
                    type="email"
                    placeholder="ornek@mail.com"
                    value={ratingForm.email}
                    onChange={updateRatingField('email')}
                  />
                </label>
              </div>

              <div className="rating-grid">
                {ratingOptions.map((item) => (
                  <button
                    key={item.id}
                    className={`rating-option${rating === item.id ? ' is-active' : ''}`}
                    type="button"
                    onClick={() => setRating(item.id)}
                  >
                    <span className="rating-option__emoji" aria-hidden="true">
                      {item.emoji}
                    </span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <label className="field-stack field-stack--full">
                <span>Açıklama / Metin</span>
                <textarea
                  className="textarea-shell"
                  placeholder="Burada şu olabilir, mobilde şu alan geliştirilebilir, tasarımda bunu güçlendirebiliriz..."
                  value={ratingForm.message}
                  onChange={updateRatingField('message')}
                />
              </label>

              {ratingFeedback.error ? <p className="form-error">{ratingFeedback.error}</p> : null}
              {ratingFeedback.success ? <p className="form-success">{ratingFeedback.success}</p> : null}

              <button className="primary-button contact-card__button" type="submit" disabled={!authConfigured}>
                Puanlamayı Gönder
              </button>
            </form>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ContactPage
