import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import BikeCard from '../components/BikeCard'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { CompareIcon, PinIcon } from '../components/Icons'
import { featuredBikes, getBikeById } from '../data/featuredBikes'
import { useAppState } from '../context/useAppState'
import '../App.css'

function ListingDetailPage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    comparisons,
    isAuthenticated,
    messageRequests,
    sendMessageRequest,
    toggleComparison,
  } = useAppState()

  const bike = getBikeById(id)

  if (!bike) {
    return <Navigate to="/" replace />
  }

  const isCompared = comparisons.includes(bike.id)
  const hasPendingRequest = messageRequests.some((item) => item.listingId === bike.id)

  const handleCompare = () => {
    if (!isAuthenticated) {
      navigate('/kayit-ol')
      return
    }

    toggleComparison(bike.id)
  }

  const handleMessageRequest = () => {
    if (!isAuthenticated) {
      navigate('/giris')
      return
    }

    sendMessageRequest(bike)
  }

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-content page-content--compact">
        <section className="listing-detail">
          <div className="listing-detail__breadcrumbs">
            <Link to="/">Ana Sayfa</Link>
            <span>/</span>
            <span>{bike.brand}</span>
            <span>/</span>
            <strong>{bike.title}</strong>
          </div>

          <div className="listing-detail__layout">
            <div className="listing-detail__main">
              <article className="detail-gallery">
                <div
                  className="detail-gallery__image"
                  style={{ background: bike.gallery[activeIndex] }}
                >
                  <span className="detail-gallery__count">
                    {activeIndex + 1}/{bike.gallery.length}
                  </span>
                </div>

                <div className="detail-gallery__dots">
                  {bike.gallery.map((_, index) => (
                    <button
                      key={index}
                      className={`detail-gallery__dot${activeIndex === index ? ' active' : ''}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                    />
                  ))}
                </div>
              </article>

              <article className="detail-card">
                <span className="detail-card__tag">{bike.brand}</span>
                <h1>{bike.title}</h1>
                <strong className="detail-card__price">{bike.price}</strong>

                <button
                  className={`ghost-button detail-card__compare${isCompared ? ' is-active' : ''}`}
                  type="button"
                  onClick={handleCompare}
                >
                  <CompareIcon />
                  <span>{isCompared ? 'Karşılaştırmada' : "Karşılaştır'a Ekle"}</span>
                </button>

                <div className="detail-card__specs">
                  <div>
                    <span>Marka</span>
                    <strong>{bike.brand}</strong>
                  </div>
                  <div>
                    <span>Model</span>
                    <strong>{bike.model}</strong>
                  </div>
                  <div>
                    <span>Yıl</span>
                    <strong>{bike.year}</strong>
                  </div>
                  <div>
                    <span>Kilometre</span>
                    <strong>{bike.km}</strong>
                  </div>
                </div>

                <div className="detail-card__row">
                  <span>Plaka: {bike.plateMasked} <em>(son 2 rakam gizli)</em></span>
                </div>

                <div className="detail-card__row detail-card__row--between">
                  <span>
                    <PinIcon />
                    {bike.city}
                  </span>
                  <span>{bike.date}</span>
                </div>
              </article>

              <article className="detail-card">
                <h2>İlan Açıklaması</h2>
                <p>{bike.description}</p>
              </article>

              <section className="section section--tight">
                <div className="section-bar">
                  <span className="section-bar__dot" />
                  <h2>ÇOK BAKILANLAR</h2>
                </div>

                <div className="cards-grid cards-grid--compact">
                  {featuredBikes
                    .filter((item) => item.id !== bike.id)
                    .slice(0, 2)
                    .map((item) => (
                      <BikeCard key={item.id} bike={item} />
                    ))}
                </div>
              </section>
            </div>

            <aside className="listing-detail__sidebar">
              <article className="seller-card">
                <h2>Satıcı Bilgileri</h2>
                <div className="seller-card__person">
                  <span className="seller-card__avatar">O</span>
                  <div>
                    <strong>{bike.owner}</strong>
                    <span>Üye</span>
                  </div>
                </div>
                <div className="seller-card__phone">{bike.phone}</div>
              </article>

              <article className="seller-card">
                <h2>Satıcıya Mesaj</h2>
                {isAuthenticated ? (
                  <>
                    <p>Mesaj isteği göndererek sohbet başlatabilirsin.</p>
                    <button
                      className="primary-button seller-card__button"
                      type="button"
                      onClick={handleMessageRequest}
                    >
                      {hasPendingRequest ? 'İstek Gönderildi' : 'Mesaj İsteği Gönder'}
                    </button>
                  </>
                ) : (
                  <>
                    <p>Mesaj göndermek için giriş yapın.</p>
                    <Link className="primary-button seller-card__button" to="/giris">
                      Giriş Yap
                    </Link>
                  </>
                )}
              </article>

              <Link className="listing-detail__back" to="/">
                ← İlanlara dön
              </Link>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ListingDetailPage
