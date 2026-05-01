import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import BikeCard from '../components/BikeCard'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { CompareIcon, PinIcon } from '../components/Icons'
import { useAppState } from '../context/useAppState'
import { getVisualStyle } from '../lib/visuals'
import '../App.css'

const reportReasons = [
  'Sahte ilan',
  'Yanlis bilgi',
  'Dolandiricilik supesi',
  'Uygunsuz icerik',
  'Yanlis fiyat',
  'Diger',
]

function ListingDetailPage() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [messageFeedback, setMessageFeedback] = useState({ error: '', success: '' })
  const [reportFeedback, setReportFeedback] = useState({ error: '', success: '' })
  const [reportReason, setReportReason] = useState(reportReasons[0])
  const [reportDetails, setReportDetails] = useState('')
  const [isSendingRequest, setIsSendingRequest] = useState(false)
  const [isBlockingSeller, setIsBlockingSeller] = useState(false)
  const [isReporting, setIsReporting] = useState(false)
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    allListings,
    blockUser,
    comparisons,
    isAuthenticated,
    isUserBlocked,
    messageRequests,
    reportListing,
    sendMessageRequest,
    toggleComparison,
    user,
  } = useAppState()

  const bike = allListings.find((item) => item.id === id)

  const galleryItems = useMemo(() => {
    if (!bike) {
      return []
    }

    return Array.isArray(bike.gallery) && bike.gallery.length
      ? bike.gallery
      : [bike.visual || 'linear-gradient(135deg, #441111 0%, #1a1a1a 100%)']
  }, [bike])

  const relatedItems = useMemo(
    () => allListings.filter((item) => item.id !== id).slice(0, 2),
    [allListings, id],
  )

  if (!bike) {
    return <Navigate to="/" replace />
  }

  const safeIndex = Math.min(activeIndex, Math.max(galleryItems.length - 1, 0))
  const isCompared = comparisons.includes(bike.id)
  const hasPendingRequest = messageRequests.some((item) => item.listingId === bike.id)
  const isOwner = Boolean(user?.id && bike.ownerId && user.id === bike.ownerId)
  const sellerBlocked = Boolean(bike.ownerId && isUserBlocked(bike.ownerId))

  const handleCompare = () => {
    if (!isAuthenticated) {
      navigate('/kayit-ol')
      return
    }

    toggleComparison(bike.id)
  }

  const handleMessageRequest = async () => {
    setMessageFeedback({ error: '', success: '' })

    if (!isAuthenticated) {
      navigate('/giris')
      return
    }

    if (isOwner) {
      return
    }

    if (sellerBlocked) {
      setMessageFeedback({ error: 'Bu satici engelli listende oldugu icin mesaj gonderemezsin.', success: '' })
      return
    }

    setIsSendingRequest(true)

    try {
      await sendMessageRequest(bike)
      setMessageFeedback({ error: '', success: 'Mesaj istegin saticiya gonderildi.' })
    } catch (error) {
      setMessageFeedback({ error: error.message || 'Mesaj istegi gonderilemedi.', success: '' })
    } finally {
      setIsSendingRequest(false)
    }
  }

  const handleBlockSeller = async () => {
    if (!isAuthenticated) {
      navigate('/giris')
      return
    }

    if (isOwner || !bike.ownerId) {
      return
    }

    setMessageFeedback({ error: '', success: '' })
    setIsBlockingSeller(true)

    try {
      await blockUser({
        id: bike.ownerId,
        name: bike.owner,
        username: bike.ownerUsername,
      })
      setMessageFeedback({ error: '', success: 'Satici engellendi. Artik mesaj veya iletisim istegi gonderemez.' })
    } catch (error) {
      setMessageFeedback({ error: error.message || 'Satici engellenemedi.', success: '' })
    } finally {
      setIsBlockingSeller(false)
    }
  }

  const handleReportSubmit = async (event) => {
    event.preventDefault()
    setReportFeedback({ error: '', success: '' })

    if (!isAuthenticated) {
      navigate('/giris')
      return
    }

    if (isOwner || !bike.ownerId) {
      return
    }

    setIsReporting(true)

    try {
      await reportListing({
        listingId: bike.id,
        ownerId: bike.ownerId,
        reason: reportReason,
        details: reportDetails,
      })
      setReportDetails('')
      setReportFeedback({ error: '', success: 'Ilan inceleme icin admin paneline gonderildi.' })
    } catch (error) {
      setReportFeedback({ error: error.message || 'Ilan bildirilemedi.', success: '' })
    } finally {
      setIsReporting(false)
    }
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
                <div className="detail-gallery__image" style={getVisualStyle(galleryItems[safeIndex])}>
                  <span className="detail-gallery__count">
                    {safeIndex + 1}/{galleryItems.length}
                  </span>
                </div>

                <div className="detail-gallery__dots">
                  {galleryItems.map((_, index) => (
                    <button
                      key={index}
                      className={`detail-gallery__dot${safeIndex === index ? ' active' : ''}`}
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
                  <span>{isCompared ? 'Karsilastirmada' : "Karsilastir'a Ekle"}</span>
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
                    <span>Yil</span>
                    <strong>{bike.year}</strong>
                  </div>
                  <div>
                    <span>Kilometre</span>
                    <strong>{bike.km}</strong>
                  </div>
                </div>

                <div className="detail-card__row">
                  <span>
                    Plaka: {bike.plateMasked} <em>(son 2 rakam gizli)</em>
                  </span>
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
                <h2>Ilan Aciklamasi</h2>
                <p>{bike.description}</p>
              </article>

              {relatedItems.length ? (
                <section className="section section--tight">
                  <div className="section-bar">
                    <span className="section-bar__dot" />
                    <h2>BENZER ILANLAR</h2>
                  </div>

                  <div className="cards-grid cards-grid--compact">
                    {relatedItems.map((item) => (
                      <BikeCard key={item.id} bike={item} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="listing-detail__sidebar">
              <article className="seller-card">
                <h2>Satıcı Bilgileri</h2>
                <div className="seller-card__person">
                  <span className="seller-card__avatar">{(bike.owner || 'S').charAt(0)}</span>
                  <div>
                    <strong>{bike.owner}</strong>
                    <span>{bike.isVerifiedSeller ? 'Dogrulanmis Satici' : 'Uye'}</span>
                  </div>
                </div>
                <div className="seller-card__phone">{bike.phone}</div>
              </article>

              <article className="seller-card">
                <h2>Saticiya Mesaj</h2>
                {isOwner ? (
                  <p>Bu ilan sana ait. Kendine mesaj istegi gonderemezsin.</p>
                ) : isAuthenticated ? (
                  <>
                    <p>Mesaj istegi gondererek sohbet baslatabilirsin.</p>
                    {messageFeedback.error ? <p className="form-error">{messageFeedback.error}</p> : null}
                    {messageFeedback.success ? <p className="form-success">{messageFeedback.success}</p> : null}
                    <button
                      className="primary-button seller-card__button"
                      type="button"
                      onClick={handleMessageRequest}
                      disabled={hasPendingRequest || isSendingRequest || sellerBlocked}
                    >
                      {hasPendingRequest ? 'Istek Gonderildi' : isSendingRequest ? 'Gonderiliyor...' : 'Mesaj Istegi Gonder'}
                    </button>
                    <button
                      className="ghost-button seller-card__button"
                      type="button"
                      onClick={handleBlockSeller}
                      disabled={isBlockingSeller || sellerBlocked}
                    >
                      {sellerBlocked ? 'Satici Engelli' : isBlockingSeller ? 'Engelleniyor...' : 'Saticiyi Engelle'}
                    </button>
                  </>
                ) : (
                  <>
                    <p>Mesaj gondermek icin giris yapin.</p>
                    <Link className="primary-button seller-card__button" to="/giris">
                      Giris Yap
                    </Link>
                  </>
                )}
              </article>

              {!isOwner ? (
                <article className="seller-card">
                  <h2>Ilani Bildir</h2>
                  <form className="seller-card__report" onSubmit={handleReportSubmit}>
                    <label className="field-stack">
                      <span>Sebep</span>
                      <select
                        className="input-shell"
                        value={reportReason}
                        onChange={(event) => setReportReason(event.target.value)}
                      >
                        {reportReasons.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field-stack">
                      <span>Aciklama</span>
                      <textarea
                        className="textarea-shell textarea-shell--compact"
                        value={reportDetails}
                        onChange={(event) => setReportDetails(event.target.value)}
                        placeholder="Kisa bir aciklama ekleyebilirsin."
                      />
                    </label>

                    {reportFeedback.error ? <p className="form-error">{reportFeedback.error}</p> : null}
                    {reportFeedback.success ? <p className="form-success">{reportFeedback.success}</p> : null}

                    <button className="ghost-button seller-card__button" type="submit" disabled={isReporting}>
                      {isReporting ? 'Gonderiliyor...' : 'Ilani Bildir'}
                    </button>
                  </form>
                </article>
              ) : null}

              <Link className="listing-detail__back" to="/">
                ← Ilanlara don
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
