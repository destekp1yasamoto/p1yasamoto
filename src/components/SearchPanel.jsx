import { useEffect, useMemo, useRef, useState } from 'react'
import { FilterIcon, SearchIcon } from './Icons'

function normalizeSuggestionText(value) {
  return `${value || ''}`.trim().toLocaleLowerCase('tr-TR')
}

function filterStartsWith(options, query, limit = 6, showAllOnEmpty = false) {
  const normalizedQuery = normalizeSuggestionText(query)

  if (!normalizedQuery) {
    return showAllOnEmpty ? options.slice(0, limit) : []
  }

  return options
    .filter((item) => normalizeSuggestionText(item).startsWith(normalizedQuery))
    .slice(0, limit)
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
  const searchFieldRef = useRef(null)
  const cityFieldRef = useRef(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!searchFieldRef.current?.contains(event.target)) {
        setShowSuggestions(false)
      }

      if (!cityFieldRef.current?.contains(event.target)) {
        setShowCitySuggestions(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  const visibleSuggestions = useMemo(
    () => filterStartsWith(searchSuggestions, searchQuery, 6),
    [searchQuery, searchSuggestions],
  )

  const visibleCitySuggestions = useMemo(
    () => filterStartsWith(cityOptions, filters.city, cityOptions.length, true),
    [cityOptions, filters.city],
  )

  return (
    <div className="search-shell">
      <div className="search-row">
        <label ref={searchFieldRef} className="search-input">
          <span className="search-input__icon">
            <SearchIcon />
          </span>
          <input
            className="input-shell input-shell--search"
            type="search"
            placeholder="Marka, model veya cc..."
            aria-label="İlan araması"
            value={searchQuery}
            onChange={(event) => {
              onSearchChange(event.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {showSuggestions && visibleSuggestions.length ? (
            <div className="search-input__suggestions">
              {visibleSuggestions.map((item) => (
                <button
                  key={item}
                  className="search-input__suggestion"
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSearchChange(item)
                    setShowSuggestions(false)
                  }}
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
            <label ref={cityFieldRef} className="field-stack">
              <span>Şehir</span>
              <div className="suggest-field">
                <input
                  className="input-shell"
                  type="text"
                  placeholder="Tüm şehirler"
                  value={filters.city}
                  onChange={(event) => {
                    onFilterChange('city', event.target.value)
                    setShowCitySuggestions(true)
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  autoComplete="off"
                />
                {showCitySuggestions && visibleCitySuggestions.length ? (
                  <div className="suggest-field__panel">
                    {visibleCitySuggestions.map((city) => (
                      <button
                        key={city}
                        className={`suggest-field__option${filters.city === city ? ' is-active' : ''}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          onFilterChange('city', city)
                          setShowCitySuggestions(false)
                        }}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
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
