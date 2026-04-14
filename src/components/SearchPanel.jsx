import { FilterIcon, SearchIcon } from './Icons'

function SearchPanel({
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
            placeholder="Marka, model veya anahtar kelime..."
            aria-label="İlan araması"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            list="listing-search-suggestions"
          />
          <datalist id="listing-search-suggestions">
            {searchSuggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
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
          <div className="filter-grid">
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
