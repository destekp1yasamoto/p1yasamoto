import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { featuredBikes } from '../data/featuredBikes'
import { useAppState } from '../context/useAppState'
import { getVisualStyle } from '../lib/visuals'
import '../App.css'

function ProfilePage() {
  const location = useLocation()
  const [selectedTab, setSelectedTab] = useState('ilanlar')
  const [profileForm, setProfileForm] = useState({
    username: '',
    phone: '',
    city: '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [feedback, setFeedback] = useState({ error: '', success: '' })
  const [isSaving, setIsSaving] = useState(false)
  const {
    activeChats,
    allListings,
    draftListings,
    favorites,
    markNotificationsRead,
    messageRequests,
    notifications,
    publishDraftListing,
    resendVerificationEmail,
    updateProfile,
    user,
    userListings,
  } = useAppState()

  useEffect(() => {
    setProfileForm({
      username: user?.username || user?.name || '',
      phone: user?.phone || '',
      city: user?.city || 'İstanbul',
    })
  }, [user?.city, user?.name, user?.phone, user?.username])

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

  const handleProfileField = (field) => (event) => {
    setProfileForm((current) => ({
      ...current,
      [field]: event.target.value,
    }))
  }

  const handleProfileSave = async () => {
    setFeedback({ error: '', success: '' })
    setIsSaving(true)

    try {
      await updateProfile({
        username: profileForm.username,
        phone: profileForm.phone,
        city: profileForm.city,
        avatarFile,
      })
      setAvatarFile(null)
      setFeedback({
        error: '',
        success: 'Profil bilgileri kaydedildi. Telefon değiştiyse doğrulama durumu sıfırlandı.',
      })
    } catch (error) {
      setFeedback({
        error: error.message || 'Profil kaydedilirken bir sorun oluştu.',
        success: '',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerificationMail = async () => {
    setFeedback({ error: '', success: '' })

    try {
      await resendVerificationEmail(user?.email)
      setFeedback({
        error: '',
        success: 'Mail doğrulama bağlantısı tekrar gönderildi.',
      })
    } catch (error) {
      setFeedback({
        error: error.message || 'Doğrulama maili gönderilemedi.',
        success: '',
      })
    }
  }

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-content page-content--compact">
        <section className="profile-hub">
          <article className="profile-summary">
            <div className="profile-summary__identity">
              <span className="profile-summary__avatar profile-summary__avatar--image">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} />
                ) : (
                  (user?.name || 'K').charAt(0)
                )}
              </span>
              <div>
                <strong>{user?.name || 'Kullanıcı'}</strong>
                <p>{user?.email || 'mail@yok.com'}</p>
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
                      <div className="profile-listing__thumb" style={getVisualStyle(bike.visual)} />
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
                        <div className="profile-listing__thumb" style={getVisualStyle(draft.visual)} />
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
                    <div className="profile-listing__thumb" style={getVisualStyle(bike.visual)} />
                    <div className="profile-listing__content">
                      <strong>{bike.title}</strong>
                      <p>{bike.price}</p>
                      <span>{bike.km} · {bike.city}</span>
                    </div>
                    <div className="profile-listing__actions">
                      <button className="ghost-button" type="button">
                        Karşılaştır
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

                {feedback.error ? <p className="form-error">{feedback.error}</p> : null}
                {feedback.success ? <p className="form-success">{feedback.success}</p> : null}

                <div className="profile-avatar-picker">
                  <div className="profile-avatar-picker__preview">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} />
                    ) : (
                      (user?.name || 'K').charAt(0)
                    )}
                  </div>
                  <label className="ghost-button profile-avatar-picker__button">
                    Profil Fotoğrafı Seç
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <div className="form-grid">
                  <label className="field-stack">
                    <span>Kullanıcı Adı</span>
                    <input
                      className="input-shell"
                      type="text"
                      value={profileForm.username}
                      onChange={handleProfileField('username')}
                    />
                  </label>
                  <label className="field-stack">
                    <span>Telefon</span>
                    <input
                      className="input-shell"
                      type="text"
                      value={profileForm.phone}
                      onChange={handleProfileField('phone')}
                    />
                  </label>
                  <label className="field-stack field-stack--full">
                    <span>Şehir / Konum</span>
                    <input
                      className="input-shell"
                      type="text"
                      value={profileForm.city}
                      onChange={handleProfileField('city')}
                    />
                  </label>
                </div>

                <div className="filter-actions">
                  <button className="primary-button" type="button" onClick={handleProfileSave} disabled={isSaving}>
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </article>

              <article className="profile-panel">
                <h2>Doğrulama</h2>
                <div className="verification-list">
                  <div className="verification-item">
                    <div>
                      <strong>Telefon</strong>
                      <span>
                        {user?.phone || 'Telefon eklenmedi'} · {user?.verified.phone ? 'Doğrulandı' : 'Doğrulanmadı'}
                      </span>
                    </div>
                  </div>
                  <div className="verification-item verification-item--action">
                    <div>
                      <strong>{user?.email || 'mail@yok.com'}</strong>
                      <span>{user?.verified.email ? 'Doğrulandı' : 'Doğrulanmadı'}</span>
                    </div>
                    {!user?.verified.email ? (
                      <button className="primary-button verification-item__button" type="button" onClick={handleVerificationMail}>
                        Doğrulama Maili Gönder
                      </button>
                    ) : null}
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
