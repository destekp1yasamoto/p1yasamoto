import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import '../App.css'

function ContactPage() {
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
            <div className="form-grid">
              <label className="field-stack">
                <span>Ad</span>
                <input className="input-shell" type="text" placeholder="Adınız" />
              </label>
              <label className="field-stack">
                <span>Email</span>
                <input className="input-shell" type="email" placeholder="email@ornek.com" />
              </label>
              <label className="field-stack field-stack--full">
                <span>Konu</span>
                <input className="input-shell" type="text" placeholder="Mesajınızın konusu" />
              </label>
              <label className="field-stack field-stack--full">
                <span>Mesaj</span>
                <textarea className="textarea-shell" placeholder="Mesajınızı buraya yazın..." />
              </label>
            </div>
            <a className="contact-email" href="mailto:piyasamot@gmail.com">
              piyasamot@gmail.com
            </a>
            <button className="primary-button contact-card__button" type="button">
              Gönder
            </button>
          </article>

          <article className="contact-card">
            <h2>Geri Bildirim</h2>
            <p className="field-note">Görüşlerin bizim için önemli.</p>
            <div className="opinion-list">
              <article className="opinion-item">
                <strong>Gerçek kullanıcı sistemi</strong>
                Kayıt, giriş ve profil ekranları hazır ama henüz veritabanı ve oturum yönetimi bağlı değil.
              </article>
              <article className="opinion-item">
                <strong>İlan detay, favori ve karşılaştırma</strong>
                Temel akış eklendi; bir sonraki adımda ilan detay sayfası ve kalıcı veri ile güçlenmeli.
              </article>
              <article className="opinion-item">
                <strong>Spam kontrollü mesajlaşma</strong>
                Mesaj isteği mantığı doğru; bunu gerçek bildirim ve kabul/reddet akışıyla tamamlamak gerekir.
              </article>
            </div>
          </article>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ContactPage
