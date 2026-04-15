import { useEffect, useMemo, useState } from 'react'
import { FilterIcon, SearchIcon } from './Icons'

function normalizeSuggestionText(value) {
  return `${value || ''}`.trim().toLocaleLowerCase('tr-TR')
}

function SearchPanel({
  ccOptions,
  cityOptions,
  filters,
  filtersOpen,
  onApplyFilters,
  onFilterChange,
  onResetFilters,
  onSearchChange,
  onToggleFilters,
  searchQuery,
  searchSuggestions,
}) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const syncViewport = () => {
      setIsMobile(window.innerWidth <= 760)
    }

    syncViewport()
    window.addEventListener('resize', syncViewport)

    return () => {
      window.removeEventListener('resize', syncViewport)
    }
  }, [])

  const mobileSuggestions = useMemo(() => {
    const normalizedQuery = normalizeSuggestionText(searchQuery)

    if (!normalizedQuery) {
      return []
    }

    const startsWithMatches = searchSuggestions.filter((item) =>
      normalizeSuggestionText(item).startsWith(normalizedQuery),
    )
    const includesMatches = searchSuggestions.filter(
      (item) =>
        !startsWithMatches.includes(item)
        && normalizeSuggestionText(item).includes(normalizedQuery),
    )

    return [...startsWithMatches, ...includesMatches].slice(0, 6)
  }, [searchQuery, searchSuggestions])

  return (
    <div className="search-shell">
      <div className="search-row">
        <label className="search-input">
          <span className="search-input__icon">
            <SearchIcon />
          </span>
          <input
            className="input-shell input-shell--search"
            type="search"
            placeholder="Marka, model veya cc..."
            aria-label="İlan araması"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            list={isMobile ? undefined : 'listing-search-suggestions'}
          />
          {!isMobile ? (
            <datalist id="listing-search-suggestions">
              {searchSuggestions.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          ) : null}
          {isMobile && mobileSuggestions.length ? (
            <div className="search-input__mobile-panel">
              {mobileSuggestions.map((item) => (
                <button
                  key={item}
                  className="search-input__mobile-option"
                  type="button"
                  onClick={() => onSearchChange(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </label>
        <button className="primary-button search-row__button" type="button" onClick={onApplyFilters}>
          Ara
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label="Filtreleri aç"
          onClick={onToggleFilters}
        >
          <FilterIcon />
        </button>
      </div>

      {filtersOpen ? (
        <div className="filter-panel">
          <div className="filter-grid filter-grid--five">
            <label className="field-stack">
              <span>Şehir</span>
              <input
                className="input-shell"
                type="text"
                placeholder="Tüm şehirler"
                value={filters.city}
                onChange={(event) => onFilterChange('city', event.target.value)}
                list="turkey-city-list"
              />
              <datalist id="turkey-city-list">
                {cityOptions.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </label>

            <label className="field-stack">
              <span>CC</span>
              <input
                className="input-shell"
                type="text"
                placeholder="Tüm cc değerleri"
                value={filters.cc}
                onChange={(event) => onFilterChange('cc', event.target.value)}
                list="listing-cc-list"
              />
              <datalist id="listing-cc-list">
                {ccOptions.map((cc) => (
                  <option key={cc} value={cc} />
                ))}
              </datalist>
            </label>

            <label className="field-stack">
              <span>Min. fiyat</span>
              <input
                className="input-shell"
                type="text"
                placeholder="₺0"
                value={filters.priceMin}
                onChange={(event) => onFilterChange('priceMin', event.target.value)}
              />
            </label>

            <label className="field-stack">
              <span>Max. fiyat</span>
              <input
                className="input-shell"
                type="text"
                placeholder="₺2.500.000"
                value={filters.priceMax}
                onChange={(event) => onFilterChange('priceMax', event.target.value)}
              />
            </label>

            <label className="field-stack">
              <span>Max. km</span>
              <input
                className="input-shell"
                type="text"
                placeholder="100.000"
                value={filters.kmMax}
                onChange={(event) => onFilterChange('kmMax', event.target.value)}
              />
            </label>
          </div>

          <div className="filter-actions">
            <button className="primary-button" type="button" onClick={onApplyFilters}>
              Uygula
            </button>
            <button className="ghost-button" type="button" onClick={onResetFilters}>
              Temizle
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SearchPanel
