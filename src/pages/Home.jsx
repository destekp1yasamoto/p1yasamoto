import { useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import SearchPanel from '../components/SearchPanel'
import BikeCard from '../components/BikeCard'
import { featuredBikes } from '../data/featuredBikes'
import { filterFields } from '../data/marketStats'
import { useAppState } from '../context/useAppState'
import '../App.css'

function Home() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { isAuthenticated } = useAppState()
  const spotlightItems = featuredBikes.slice(0, 2)
  const hasListings = featuredBikes.length > 0

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-content">
        <section className="hero hero--marketplace">
          <div className="hero-backdrop" />
          <div className="hero__center">
            <h1>
              Türkiye&apos;nin Motor <span>Piyasası</span>
            </h1>
            <p>Binlerce motosiklet ilanı — satın al, sat, karşılaştır.</p>
            <SearchPanel
              filtersOpen={filtersOpen}
              onToggleFilters={() => setFiltersOpen((current) => !current)}
              onResetFilters={() => setFiltersOpen(false)}
              filterFields={filterFields}
            />
          </div>
        </section>

        <section className="section section--listings">
          <div className="section-bar">
            <span className="section-bar__dot" />
            <h2>ÇOK BAKILANLAR</h2>
          </div>

          {spotlightItems.length ? (
            <div className="cards-grid cards-grid--compact">
              {spotlightItems.map((bike) => (
                <BikeCard key={bike.id} bike={bike} />
              ))}
            </div>
          ) : (
            <article className="empty-state">
              <h2>Şu anda vitrinde örnek ilan yok</h2>
              <p>Gerçek kullanıcı ilanları geldikçe burada çok bakılan motorlar listelenecek.</p>
              <Link className="primary-button" to="/ilan-ekle">
                İlk İlanı Ver
              </Link>
            </article>
          )}

          <p className="results-copy">{featuredBikes.length} ilan bulundu</p>

          {hasListings ? (
            <div className="cards-grid cards-grid--three">
              {featuredBikes.map((bike) => (
                <BikeCard key={bike.id} bike={bike} />
              ))}
            </div>
          ) : (
            <article className="empty-state">
              <h2>Henüz yayında motosiklet ilanı yok</h2>
              <p>Site artık örnek veri yerine tamamen gerçek ilan akışına hazır durumda.</p>
              <Link className="primary-button" to="/ilan-ekle">
                İlan Ekle
              </Link>
            </article>
          )}

          {!isAuthenticated ? (
            <div className="guest-note">
              <p>Karşılaştırma, favoriler ve mesajlaşma için önce hesap oluştur.</p>
              <Link className="primary-button" to="/kayit-ol">
                Kayıt Ol
              </Link>
            </div>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home
