import { useNavigate } from 'react-router-dom'
import { useAppState } from '../context/useAppState'
import { CompareIcon, HeartIcon, PinIcon } from './Icons'

function BikeCard({ bike }) {
  const navigate = useNavigate()
  const { isAuthenticated, favorites, comparisons, toggleFavorite, toggleComparison } =
    useAppState()

  const isFavorite = favorites.includes(bike.id)
  const isCompared = comparisons.includes(bike.id)

  const goToDetail = () => navigate(`/ilan/${bike.id}`)

  const requireAuth = () => {
    if (!isAuthenticated) {
      navigate('/kayit-ol')
      return false
    }

    return true
  }

  const handleFavorite = (event) => {
    event.stopPropagation()

    if (!requireAuth()) {
      return
    }

    toggleFavorite(bike.id)
  }

  const handleCompare = (event) => {
    event.stopPropagation()

    if (!requireAuth()) {
      return
    }

    toggleComparison(bike.id)
  }

  return (
    <article className="listing-card" onClick={goToDetail} role="button" tabIndex={0}>
      <div className="listing-card__media" style={{ background: bike.visual }}>
        <span className="listing-card__badge">{bike.badge}</span>
        <button
          className={`icon-chip${isFavorite ? ' is-active' : ''}`}
          type="button"
          aria-label={isFavorite ? 'Favoriden çıkar' : 'Favorilere ekle'}
          onClick={handleFavorite}
        >
          <HeartIcon filled={isFavorite} />
        </button>

        <div className="listing-card__overlay">
          <button
            className={`listing-card__action${isCompared ? ' is-active' : ''}`}
            type="button"
            onClick={handleCompare}
          >
            <CompareIcon />
            <span>{isCompared ? 'Karşılaştırmada' : 'Karşılaştır'}</span>
          </button>
          <button className="listing-card__action" type="button" onClick={handleFavorite}>
            <HeartIcon filled={isFavorite} />
            <span>{isFavorite ? 'Favoride' : 'Favorile'}</span>
          </button>
        </div>
      </div>

      <div className="listing-card__body">
        <div className="listing-card__title-row">
          <div>
            <h3>{bike.title}</h3>
            <span className="listing-card__location">
              <PinIcon />
              {bike.city}
            </span>
          </div>
          <span className="listing-card__pill">{bike.tag}</span>
        </div>

        <strong className="listing-card__price">{bike.price}</strong>

        <div className="listing-card__meta">
          <span>{bike.km}</span>
          <span>{bike.model}</span>
          <span>{bike.owner}</span>
        </div>
      </div>
    </article>
  )
}

export default BikeCard
