import Navbar from '../components/Navbar'
import '../App.css'

function PlaceholderPage({ eyebrow, title, description }) {
  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-content">
        <section className="page-hero">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </section>

        <section className="page-grid">
          <article className="glass-card">
            <h2>Bu route artık hazır</h2>
            <p className="section-copy">
              Menü linkleri artık boşta değil. Tasarım dili korunarak yeni
              içeriklerin eklenebileceği temel sayfa şablonu oluşturuldu.
            </p>
          </article>

          <article className="glass-card">
            <h2>Sonraki geliştirmeler</h2>
            <div className="card-list">
              <article className="mini-card">
                <strong>Gerçek içerik</strong>
                Formlar, iletişim bilgileri veya kullanıcı akışı eklenebilir.
              </article>
              <article className="mini-card">
                <strong>API bağlantısı</strong>
                Bu sayfalar servis katmanına bağlanacak şekilde genişletilebilir.
              </article>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

export default PlaceholderPage
