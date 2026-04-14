import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import SearchPanel from '../components/SearchPanel'
import BikeCard from '../components/BikeCard'
import { turkeyCities } from '../data/turkeyData'
import { useAppState } from '../context/useAppState'
import '../App.css'

const initialFilters = {
  city: '',
  priceMin: '',
  priceMax: '',
  kmMax: '',
}

function parseNumber(value) {
  const normalized = `${value || ''}`.replace(/[^\d]/g, '')
  return normalized ? Number(normalized) : null
}

function Home() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchDraft, setSearchDraft] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [filtersDraft, setFiltersDraft] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const { allListings, isAuthenticated } = useAppState()

  const firstHundredListings = allListings.slice(0, 100)
  const remainingSlots = Math.max(0, 100 - firstHundredListings.length)

  const searchSuggestions = useMemo(() => {
    const suggestionPool = firstHundredListings.flatMap((listing) => [
      listing.brand,
      listing.model,
      listing.title,
      listing.city,
    ])

    return [...new Set(suggestionPool.filter(Boolean))].slice(0, 24)
  }, [firstHundredListings])

  const filteredListings = useMemo(() => {
    const loweredSearch = appliedSearch.trim().toLowerCase()

    return firstHundredListings.filter((listing) => {
      const priceValue = parseNumber(listing.price)
      const kmValue = parseNumber(listing.km)
      const minPrice = parseNumber(appliedFilters.priceMin)
      const maxPrice = parseNumber(appliedFilters.priceMax)
      const maxKm = parseNumber(appliedFilters.kmMax)

      const matchesSearch = loweredSearch
        ? [listing.title, listing.brand, listing.model, listing.city]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(loweredSearch))
        : true

      const matchesCity = appliedFilters.city.trim()
        ? listing.city.toLowerCase().includes(appliedFilters.city.trim().toLowerCase())
        : true

      const matchesMinPrice = minPrice !== null && priceValue !== null ? priceValue >= minPrice : true
      const matchesMaxPrice = maxPrice !== null && priceValue !== null ? priceValue <= maxPrice : true
      const matchesMaxKm = maxKm !== null && kmValue !== null ? kmValue <= maxKm : true

      return matchesSearch && matchesCity && matchesMinPrice && matchesMaxPrice && matchesMaxKm
    })
  }, [appliedFilters, appliedSearch, firstHundredListings])

  const handleApplyFilters = () => {
    setAppliedSearch(searchDraft)
    setAppliedFilters(filtersDraft)
  }

  const handleResetFilters = () => {
    setSearchDraft('')
    setAppliedSearch('')
    setFiltersDraft(initialFilters)
    setAppliedFilters(initialFilters)
  }

  const handleFilterChange = (field, value) => {
    setFiltersDraft((current) => ({
      ...current,
      [field]: value,
    }))
  }

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
              cityOptions={turkeyCities}
              filters={filtersDraft}
              filtersOpen={filtersOpen}
              onApplyFilters={handleApplyFilters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              onSearchChange={setSearchDraft}
              onToggleFilters={() => setFiltersOpen((current) => !current)}
              searchQuery={searchDraft}
              searchSuggestions={searchSuggestions}
            />
          </div>
        </section>

        <section className="section section--listings">
          <div className="section-bar">
            <span className="section-bar__dot" />
            <h2>İLK EKLENEN 100 İLAN</h2>
          </div>

          <p className="results-copy">
            {filteredListings.length} ilan bulundu. İlk 100 liste için kalan slot: {remainingSlots}
          </p>

          {filteredListings.length ? (
            <div className="cards-grid cards-grid--three">
              {filteredListings.map((bike) => (
                <BikeCard key={bike.id} bike={bike} />
              ))}
            </div>
          ) : firstHundredListings.length ? (
            <article className="empty-state">
              <h2>Bu filtreyle eşleşen ilan bulunamadı</h2>
              <p>Arama ve filtre değerlerini temizleyip tekrar deneyebilirsin.</p>
              <button className="primary-button" type="button" onClick={handleResetFilters}>
                Filtreleri Temizle
              </button>
            </article>
          ) : (
            <article className="empty-state">
              <h2>Henüz yayında motosiklet ilanı yok</h2>
              <p>İlk gerçek ilan eklendiğinde burada otomatik görünecek.</p>
              <Link className="primary-button" to="/ilan-ekle">
                İlk İlanı Ver
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
