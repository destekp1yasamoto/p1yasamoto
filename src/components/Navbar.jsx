import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import logoImage from '../assets/piyasamoto-logo.png'
import { useAppState } from '../context/useAppState'
import {
  CompareIcon,
  LogoutIcon,
  MenuIcon,
  MessageIcon,
  PlusIcon,
  ProfileIcon,
} from './Icons'

function Navbar({ minimal = false }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const previousUnreadRef = useRef(0)
  const {
    authReady,
    comparisons,
    isAuthenticated,
    logout,
    notifications,
    user,
  } = useAppState()

  const guestItems = [
    { label: 'İletişim', to: '/iletisim' },
    { label: 'Giriş Yap', to: '/giris' },
  ]

  const memberItems = [
    { label: 'İletişim', to: '/iletisim' },
    { label: 'Karşılaştır', to: '/karsilastir', icon: CompareIcon },
  ]

  const showMemberNavigation = authReady && isAuthenticated
  const navItems = showMemberNavigation ? memberItems : guestItems
  const unreadNotifications = notifications.filter((item) => item.unread)
  const hasUnreadNotifications = unreadNotifications.length > 0
  const latestNotification = unreadNotifications[0]
  const unreadCount = unreadNotifications.length
  const compareCount = comparisons.length
  const compareBadge = compareCount >= 2 ? 'check' : compareCount === 1 ? '1' : null

  const closeMobileMenu = () => setMobileOpen(false)

  const handleLogout = async () => {
    closeMobileMenu()

    try {
      await logout()
      navigate('/', { replace: true })
    } catch (error) {
      window.alert(error.message || 'Çıkış yapılırken bir sorun oluştu.')
    }
  }

  useEffect(() => {
    if (previousUnreadRef.current === 0) {
      previousUnreadRef.current = unreadCount
      return
    }

    if (!latestNotification || unreadCount <= previousUnreadRef.current) {
      previousUnreadRef.current = unreadCount
      return
    }

    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const audioContext = new window.AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(920, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.24)
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.24)
      window.setTimeout(() => {
        audioContext.close()
      }, 260)
    }

    previousUnreadRef.current = unreadCount
  }, [latestNotification, unreadCount])

  return (
    <>
      <header className={`site-header${minimal ? ' site-header--minimal' : ''}`}>
        <div className="site-header__inner">
          <Link className="site-logo" to="/" onClick={closeMobileMenu}>
            <img src={logoImage} alt="P1YASAMOTO" className="site-logo__image" />
          </Link>

          {!minimal ? (
            <>
              <nav className="site-nav site-nav--desktop" aria-label="Ana menü">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `site-nav__link${isActive ? ' active' : ''}`
                    }
                  >
                    {item.icon ? (
                      <span className="site-nav__icon" aria-hidden="true">
                        <item.icon />
                      </span>
                    ) : null}
                    {item.label}
                    {item.to === '/karsilastir' && compareBadge ? (
                      <span
                        className={`site-nav__compare-badge${compareBadge === 'check' ? ' is-complete' : ''}`}
                        aria-hidden="true"
                      >
                        {compareBadge === 'check' ? '✓' : compareBadge}
                      </span>
                    ) : null}
                  </NavLink>
                ))}

                {showMemberNavigation ? (
                  <>
                    <NavLink className="site-nav__cta site-nav__cta--secondary" to="/ilan-ekle">
                      <span className="site-nav__icon" aria-hidden="true">
                        <PlusIcon />
                      </span>
                      İlan Ver
                    </NavLink>
                    <NavLink className="site-nav__user" to="/profil">
                      <span className="site-nav__icon" aria-hidden="true">
                        <ProfileIcon />
                      </span>
                      {user?.name || 'Profil'}
                      {hasUnreadNotifications ? <span className="site-nav__badge" aria-hidden="true" /> : null}
                    </NavLink>
                    <button className="site-nav__link site-nav__logout" type="button" onClick={handleLogout}>
                      <span className="site-nav__icon" aria-hidden="true">
                        <LogoutIcon />
                      </span>
                      Çıkış
                    </button>
                  </>
                ) : (
                  <NavLink className="site-nav__cta" to="/kayit-ol">
                    Kayıt Ol
                  </NavLink>
                )}
              </nav>

              <button
                className={`menu-toggle${mobileOpen ? ' is-open' : ''}`}
                type="button"
                aria-label="Menüyü aç"
                onClick={() => setMobileOpen((current) => !current)}
              >
                <MenuIcon />
              </button>
            </>
          ) : null}
        </div>
      </header>

      {!minimal && mobileOpen ? (
        <div className="mobile-menu">
          <nav className="mobile-menu__panel" aria-label="Mobil menü">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `mobile-menu__link${isActive ? ' active' : ''}`
                }
                onClick={closeMobileMenu}
              >
                {item.icon ? (
                  <span className="site-nav__icon" aria-hidden="true">
                    <item.icon />
                  </span>
                ) : null}
                {item.label}
                {item.to === '/karsilastir' && compareBadge ? (
                  <span
                    className={`site-nav__compare-badge${compareBadge === 'check' ? ' is-complete' : ''}`}
                    aria-hidden="true"
                  >
                    {compareBadge === 'check' ? '✓' : compareBadge}
                  </span>
                ) : null}
              </NavLink>
            ))}

            {!showMemberNavigation ? (
              <NavLink className="mobile-menu__cta" to="/kayit-ol" onClick={closeMobileMenu}>
                Kayıt Ol
              </NavLink>
            ) : (
              <button className="mobile-menu__link mobile-menu__logout" type="button" onClick={handleLogout}>
                <span className="site-nav__icon" aria-hidden="true">
                  <LogoutIcon />
                </span>
                Çıkış Yap
              </button>
            )}
          </nav>
        </div>
      ) : null}

      {!minimal && showMemberNavigation ? (
        <div className="mobile-bottom-nav">
          <NavLink
            to="/mesajlar"
            className={`mobile-bottom-nav__item${location.pathname === '/mesajlar' ? ' active' : ''}`}
          >
            <MessageIcon />
            <span>Mesajlar</span>
          </NavLink>
          <NavLink to="/ilan-ekle" className="mobile-bottom-nav__add" aria-label="İlan ver">
            <PlusIcon />
          </NavLink>
          <NavLink
            to="/profil"
            className={`mobile-bottom-nav__item${location.pathname === '/profil' ? ' active' : ''}`}
          >
            <ProfileIcon />
            <span>Profil</span>
            {hasUnreadNotifications ? <span className="mobile-bottom-nav__badge" aria-hidden="true" /> : null}
          </NavLink>
        </div>
      ) : null}

      {latestNotification && location.pathname !== '/profil' && location.pathname !== '/mesajlar' ? (
        <Link className="site-toast" to={latestNotification.href}>
          <strong>{latestNotification.title}</strong>
          <span>{latestNotification.body}</span>
        </Link>
      ) : null}
    </>
  )
}

export default Navbar
