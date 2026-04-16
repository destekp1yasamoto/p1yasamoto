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
  const { authConfigured, isAuthenticated, submitSupportMessage, user } = useAppState()

  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  })
  const [contactFeedback, setContactFeedback] = useState({ error: '', success: '' })

  const [rating, setRating] = useState('iyi')
  const [ratingMessage, setRatingMessage] = useState('')
  const [ratingFeedback, setRatingFeedback] = useState({ error: '', success: '' })

  const updateContactField = (field) => (event) => {
    setContactForm((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const requireAuthMessage = 'Mesaj göndermek için önce hesabına giriş yapmalısın.'
  const contactName = user?.name || ''
  const contactEmail = user?.email || ''

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
        subject: contactForm.subject.trim() || 'P1yasaMoto İletişim Mesajı',
        message: contactForm.message,
      })

      setContactFeedback({
        error: '',
        success: 'Mesajın başarıyla iletildi. Artık mail uygulamasına yönlendirilmiyorsun.',
      })
      setContactForm((current) => ({
        ...current,
        subject: '',
        message: '',
      }))
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
        subject: `Site puanlama - ${selectedRating?.label || 'Geri Bildirim'}`,
        message: ratingMessage,
        rating: selectedRating?.label || '',
      })

      setRatingFeedback({
        error: '',
        success: 'Puanlaman kaydedildi. Geri bildirimin destek paneline düştü.',
      })
      setRatingMessage('')
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
            <p>Sorularını ve görüşlerini bize doğrudan panel üzerinden iletebilirsin.</p>
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
                İletişim mesajları ve site puanlamaları artık doğrudan hesabın üzerinden kaydediliyor. Bu yüzden
                mesaj göndermek için önce hesabına giriş yapman gerekiyor.
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
                  <input className="input-shell" type="text" value={contactName} readOnly />
                </label>

                <label className="field-stack">
                  <span>Email</span>
                  <input className="input-shell" type="email" value={contactEmail} readOnly />
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
            <p className="field-note">Sitede neleri geliştirmemizi istediğini kısa notla bize ilet.</p>

            <form onSubmit={handleRatingSubmit}>
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
                  placeholder="Burada şu özellik olabilir, mobilde şu alan geliştirilebilir, tasarımda bunu güçlendirebiliriz..."
                  value={ratingMessage}
                  onChange={(event) => setRatingMessage(event.target.value)}
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
