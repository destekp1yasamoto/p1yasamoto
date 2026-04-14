import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BikeCard from '../components/BikeCard'
import Footer from '../components/Footer'
import { featuredBikes } from '../data/featuredBikes'
import { useAppState } from '../context/useAppState'
import '../App.css'

function FavoritesPage() {
  const { favorites } = useAppState()
  const favoriteItems = favorites
    .map((id) => featuredBikes.find((item) => item.id === id))
    .filter(Boolean)

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-content">
        <section className="page-hero page-hero--tight">
          <span className="eyebrow">Favoriler</span>
          <h1>Favori İlanların</h1>
          <p>Beğendiğin ilanlar burada birikir. Dilersen sonra karşılaştırmaya da ekleyebilirsin.</p>
        </section>

        <section className="section section--tight">
          {favoriteItems.length ? (
            <div className="cards-grid cards-grid--three">
              {favoriteItems.map((bike) => (
                <BikeCard key={bike.id} bike={bike} />
              ))}
            </div>
          ) : (
            <article className="empty-state">
              <h2>Henüz favori ilan eklemedin</h2>
              <p>Kalp ikonuna bastığın ilanlar burada görünecek.</p>
              <Link className="primary-button" to="/">
                İlanlara dön
              </Link>
            </article>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default FavoritesPage
