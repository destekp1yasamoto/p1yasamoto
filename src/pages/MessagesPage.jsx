import { useEffect, useState } from 'react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAppState } from '../context/useAppState'
import '../App.css'

function MessagesPage() {
  const [activeFilter, setActiveFilter] = useState('pending')
  const {
    activeChats,
    markNotificationsRead,
    messageRequests,
  } = useAppState()

  const visibleItems = activeFilter === 'pending' ? messageRequests : activeChats

  useEffect(() => {
    markNotificationsRead()
  }, [markNotificationsRead])

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-content page-content--compact">
        <section className="messages-hub">
          <h1>Tüm Mesajlarım</h1>

          <div className="messages-hub__layout">
            <article className="messages-hub__sidebar">
              <div className="messages-hub__filters">
                <button
                  className={`messages-filter${activeFilter === 'pending' ? ' active' : ''}`}
                  type="button"
                  onClick={() => setActiveFilter('pending')}
                >
                  Bekleyen İstekler
                  <span>({messageRequests.length})</span>
                </button>
                <button
                  className={`messages-filter${activeFilter === 'active' ? ' active' : ''}`}
                  type="button"
                  onClick={() => setActiveFilter('active')}
                >
                  Aktif Sohbetler
                  <span>({activeChats.length})</span>
                </button>
              </div>

              <div className="messages-hub__list">
                {!visibleItems.length ? (
                  <div className="messages-empty">
                    <span className="messages-empty__icon">!</span>
                    <p>
                      {activeFilter === 'pending'
                        ? 'Bekleyen istek yok.'
                        : 'Aktif sohbet yok.'}
                    </p>
                  </div>
                ) : (
                  visibleItems.map((item) => (
                    <button key={item.id} className="chat-list-item" type="button">
                      <span className="chat-list-item__avatar">
                        {(item.otherUser || item.name || 'M').charAt(0)}
                      </span>
                      <div className="chat-list-item__content">
                        <strong>{item.otherUser || item.name}</strong>
                        <p>{item.preview || item.message}</p>
                      </div>
                      <span className="chat-list-item__date">{item.date}</span>
                    </button>
                  ))
                )}
              </div>
            </article>

            <article className="messages-hub__viewer">
              <div className="messages-placeholder">
                <span className="messages-placeholder__icon">◎</span>
                <p>Bir öğe seçildiğinde detayları burada görünecek.</p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default MessagesPage
