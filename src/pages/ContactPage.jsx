import { useState } from 'react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import '../App.css'

const SUPPORT_EMAIL = 'destekp1yasamoto@gmail.com'

const ratingOptions = [
  { id: 'kotu', emoji: '😞', label: 'Kötü' },
  { id: 'orta', emoji: '😐', label: 'Orta' },
  { id: 'iyi', emoji: '🙂', label: 'İyi' },
  { id: 'cok-iyi', emoji: '🤩', label: 'Çok İyi' },
]

function buildMailtoLink({ subject, body }) {
  const params = new URLSearchParams({
    subject,
    body,
  })

  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`
}

function ContactPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [contactFeedback, setContactFeedback] = useState('')

  const [rating, setRating] = useState('iyi')
  const [ratingMessage, setRatingMessage] = useState('')
  const [ratingFeedback, setRatingFeedback] = useState('')

  const updateContactField = (field) => (event) => {
    setContactForm((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const handleContactSubmit = (event) => {
    event.preventDefault()

    const subject = contactForm.subject?.trim() || 'P1yasaMoto İletişim Mesajı'
    const body = [
      `Ad: ${contactForm.name || '-'}`,
      `Mail: ${contactForm.email || '-'}`,
      '',
      'Mesaj:',
      contactForm.message || '-',
    ].join('\n')

    window.location.href = buildMailtoLink({ subject, body })
    setContactFeedback('Varsayılan mail uygulaman açılıyor. Mesaj hazır şekilde destek adresine yönlendirildi.')
  }

  const handleRatingSubmit = (event) => {
    event.preventDefault()

    const selectedRating = ratingOptions.find((item) => item.id === rating)
    const subject = `P1yasaMoto Site Puanlama - ${selectedRating?.label || 'Geri Bildirim'}`
    const body = [
      `Puan: ${selectedRating?.emoji || ''} ${selectedRating?.label || '-'}`,
      '',
      'Açıklama / Öneri:',
      ratingMessage || '-',
    ].join('\n')

    window.location.href = buildMailtoLink({ subject, body })
    setRatingFeedback('Puanlama maili hazırlıkla açıldı. İstersen metni kontrol edip doğrudan gönderebilirsin.')
  }

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-content page-content--compact">
        <section className="contact-page">
          <div className="contact-header">
            <h1>İletişim & Geri Bildirim</h1>
            <p>Sorularınızı ve görüşlerinizi bizimle paylaşın.</p>
          </div>

          <article className="contact-card">
            <h2>İletişim Formu</h2>
            <form onSubmit={handleContactSubmit}>
              <div className="form-grid">
                <label className="field-stack">
                  <span>Ad</span>
                  <input
                    className="input-shell"
                    type="text"
                    placeholder="Adınız"
                    value={contactForm.name}
                    onChange={updateContactField('name')}
                  />
                </label>
                <label className="field-stack">
                  <span>Email</span>
                  <input
                    className="input-shell"
                    type="email"
                    placeholder="email@ornek.com"
                    value={contactForm.email}
                    onChange={updateContactField('email')}
                  />
                </label>
                <label className="field-stack field-stack--full">
                  <span>Konu</span>
                  <input
                    className="input-shell"
                    type="text"
                    placeholder="Mesajınızın konusu"
                    value={contactForm.subject}
                    onChange={updateContactField('subject')}
                  />
                </label>
                <label className="field-stack field-stack--full">
                  <span>Mesaj</span>
                  <textarea
                    className="textarea-shell"
                    placeholder="Mesajınızı buraya yazın..."
                    value={contactForm.message}
                    onChange={updateContactField('message')}
                  />
                </label>
              </div>

              {contactFeedback ? <p className="form-success">{contactFeedback}</p> : null}

              <button className="primary-button contact-card__button" type="submit">
                Gönder
              </button>
            </form>
          </article>

          <article className="contact-card">
            <h2>Site Puanlama</h2>
            <p className="field-note">Sitede neler daha iyi olabilir, hangi bölüm geliştirilmeli bize yaz.</p>

            <form onSubmit={handleRatingSubmit}>
              <div className="rating-grid">
                {ratingOptions.map((item) => (
                  <button
                    key={item.id}
                    className={`rating-option${rating === item.id ? ' is-active' : ''}`}
                    type="button"
                    onClick={() => setRating(item.id)}
                  >
                    <span className="rating-option__emoji" aria-hidden="true">{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <label className="field-stack field-stack--full">
                <span>Açıklama / Metin</span>
                <textarea
                  className="textarea-shell"
                  placeholder="Şurada şu olabilir, bu bölüm şöyle geliştirilebilir, mobilde şunu iyileştirebiliriz..."
                  value={ratingMessage}
                  onChange={(event) => setRatingMessage(event.target.value)}
                />
              </label>

              {ratingFeedback ? <p className="form-success">{ratingFeedback}</p> : null}

              <button className="primary-button contact-card__button" type="submit">
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
