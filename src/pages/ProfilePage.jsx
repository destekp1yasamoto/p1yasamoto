import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { featuredBikes } from '../data/featuredBikes'
import { useAppState } from '../context/useAppState'
import '../App.css'

function ProfilePage() {
  const location = useLocation()
  const [selectedTab, setSelectedTab] = useState('ilanlar')
  const {
    activeChats,
    allListings,
    draftListings,
    favorites,
    markNotificationsRead,
    messageRequests,
    notifications,
    publishDraftListing,
    user,
    userListings,
  } = useAppState()

  const demoListings = useMemo(
    () => (user?.isDemo ? featuredBikes.filter((bike) => bike.owner === 'Ömer').slice(0, 2) : []),
    [user?.isDemo],
  )

  const ownedListings = [...userListings, ...demoListings]
  const favoriteItems = favorites
    .map((id) => allListings.find((item) => item.id === id))
    .filter(Boolean)

  const unreadNotifications = notifications.filter((item) => item.unread).length
  const messageItems = [...messageRequests, ...activeChats]
  const requestedTab = new URLSearchParams(location.search).get('tab')
  const activeTab = requestedTab === 'mesajlar' ? 'mesajlar' : selectedTab

  const tabs = [
    { id: 'ilanlar', label: 'İlanlarım', count: ownedListings.length + draftListings.length },
    { id: 'favoriler', label: 'Favorilerim', count: favoriteItems.length },
    { id: 'mesajlar', label: 'Tüm Mesajlarım', count: messageItems.length || unreadNotifications },
    { id: 'profil', label: 'Profil', count: 0 },
  ]

  useEffect(() => {
    if (activeTab === 'mesajlar') {
      markNotificationsRead()
    }
  }, [activeTab, markNotificationsRead])

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-content page-content--compact">
        <section className="profile-hub">
          <article className="profile-summary">
            <div className="profile-summary__identity">
              <span className="profile-summary__avatar">
                {(user?.name || 'O').charAt(0)}
              </span>
              <div>
                <strong>{user?.name || 'Omer'}</strong>
                <p>{user?.email || 'demohesapmoto@gmail.com'}</p>
                <span>{user?.joinedAt || "Nisan 2026'dan beri"}</span>
              </div>
            </div>

            <Link className="primary-button profile-summary__action" to="/ilan-ekle">
              + İlan Ver
            </Link>
          </article>

          <div className="profile-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`profile-tabs__item${activeTab === tab.id ? ' active' : ''}`}
                type="button"
                onClick={() => setSelectedTab(tab.id)}
              >
                <span>{tab.label}</span>
                {tab.count ? <b>{tab.count}</b> : null}
              </button>
            ))}
          </div>

          {activeTab === 'ilanlar' ? (
            <section className="profile-panel">
              <div className="profile-subsection">
                <div className="profile-subsection__header">
                  <h2>Yayındaki İlanlar</h2>
                  <span>{ownedListings.length} ilan</span>
                </div>

                <div className="profile-list">
                  {ownedListings.map((bike) => (
                    <article key={bike.id} className="profile-listing">
                      <div
                        className="profile-listing__thumb"
                        style={{ background: bike.visual }}
                      />
                      <div className="profile-listing__content">
                        <strong>{bike.title}</strong>
                        <p>{bike.price}</p>
                        <span>{bike.km} · {bike.city}</span>
                      </div>
                      <button className="ghost-button" type="button">
                        Düzenle
                      </button>
                    </article>
                  ))}
                </div>

                {!ownedListings.length ? (
                  <div className="profile-empty">
                    <strong>Henüz ilan eklemedin.</strong>
                    <p>İlk ilanını yayınladığında burada listelenecek.</p>
                  </div>
                ) : null}
              </div>

              <div className="profile-subsection profile-subsection--spaced">
                <div className="profile-subsection__header">
                  <h2>Taslaklar</h2>
                  <span>{draftListings.length} taslak</span>
                </div>

                {draftListings.length ? (
                  <div className="profile-list">
                    {draftListings.map((draft) => (
                      <article key={draft.id} className="profile-listing profile-listing--draft">
                        <div
                          className="profile-listing__thumb"
                          style={{ background: draft.visual }}
                        />
                        <div className="profile-listing__content">
                          <strong>{draft.title || 'Taslak ilan'}</strong>
                          <p>{draft.price}</p>
                          <span>{draft.city} · {draft.updatedAt}</span>
                        </div>
                        <div className="profile-listing__actions">
                          <Link className="ghost-button" to={`/ilan-ekle?draft=${draft.id}`}>
                            Düzenle
                          </Link>
                          <button
                            className="primary-button primary-button--compact"
                            type="button"
                            onClick={() => publishDraftListing(draft.id)}
                          >
                            Yayına Al
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="profile-empty">
                    <strong>Taslak ilan yok.</strong>
                    <p>Taslak kaydettiğin ilanlar burada görünecek.</p>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {activeTab === 'favoriler' ? (
            <section className="profile-panel">
              <div className="profile-list">
                {favoriteItems.map((bike) => (
                  <article key={bike.id} className="profile-listing">
                    <div
                      className="profile-listing__thumb"
                      style={{ background: bike.visual }}
                    />
                    <div className="profile-listing__content">
                      <strong>{bike.title}</strong>
                      <p>{bike.price}</p>
                      <span>{bike.km} · {bike.city}</span>
                    </div>
                    <div className="profile-listing__actions">
                      <button className="ghost-button" type="button">
                        Karşılaştır
                      </button>
                      <button className="ghost-button ghost-button--danger" type="button">
                        Çıkar
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {!favoriteItems.length ? (
                <div className="profile-empty">
                  <strong>Favori listen boş.</strong>
                  <p>Beğendiğin ilanlar burada görünecek.</p>
                </div>
              ) : null}

              <div className="profile-panel__footer">
                <Link className="primary-button" to="/karsilastir">
                  Karşılaştırma Sayfasına Git
                </Link>
              </div>
            </section>
          ) : null}

          {activeTab === 'mesajlar' ? (
            <section className="profile-panel">
              <div className="profile-panel__header">
                <div>
                  <h2>Tüm Mesajlarım</h2>
                  <p>İsteklerini ve açılan sohbetleri tek yerden takip et.</p>
                </div>
                <Link className="ghost-button" to="/mesajlar">
                  Mesaj Alanını Aç
                </Link>
              </div>

              {messageRequests.length ? (
                <div className="request-list">
                  {messageRequests.map((item) => (
                    <article key={item.id} className="request-item">
                      <span className="status-pill">Beklemede</span>
                      <strong>{item.title}</strong>
                      <p>{item.otherUser}</p>
                      <span>{item.preview}</span>
                    </article>
                  ))}
                </div>
              ) : null}

              {activeChats.length ? (
                <div className="conversation-list">
                  {activeChats.map((item) => (
                    <article key={item.id} className="conversation-item">
                      <strong>{item.name}</strong>
                      <p>{item.message}</p>
                    </article>
                  ))}
                </div>
              ) : null}

              {!messageRequests.length && !activeChats.length ? (
                <div className="profile-empty">
                  <strong>Henüz mesaj hareketi yok.</strong>
                  <p>Bir ilana mesaj isteği gönderdiğinde burada görünür.</p>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeTab === 'profil' ? (
            <section className="profile-stack">
              <article className="profile-panel">
                <h2>Profil Bilgileri</h2>
                <div className="form-grid">
                  <label className="field-stack">
                    <span>Telefon</span>
                    <input
                      className="input-shell"
                      type="text"
                      defaultValue={user?.phone || '05xx xxx xx xx'}
                    />
                  </label>
                  <label className="field-stack">
                    <span>Şehir / Konum</span>
                    <input
                      className="input-shell"
                      type="text"
                      defaultValue={user?.city || 'İstanbul'}
                    />
                  </label>
                </div>
                <div className="filter-actions">
                  <button className="primary-button" type="button">
                    Kaydet
                  </button>
                </div>
              </article>

              <article className="profile-panel">
                <h2>Doğrulama</h2>
                <div className="verification-list">
                  <div className="verification-item">
                    <div>
                      <strong>Telefon</strong>
                      <span>{user?.phone || '05xx xxx xx xx'} · Doğrulanmamış</span>
                    </div>
                  </div>
                  <div className="verification-item verification-item--action">
                    <div>
                      <strong>{user?.email || 'demohesapmoto@gmail.com'}</strong>
                      <span>Doğrulanmamış</span>
                    </div>
                    <button className="primary-button verification-item__button" type="button">
                      Doğrula
                    </button>
                  </div>
                </div>
              </article>
            </section>
          ) : null}
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ProfilePage
