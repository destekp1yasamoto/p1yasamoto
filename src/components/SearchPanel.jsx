import { FilterIcon, SearchIcon } from './Icons'

function SearchPanel({
  filtersOpen,
  onToggleFilters,
  onResetFilters,
  filterFields,
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
          />
        </label>
        <button className="primary-button search-row__button" type="button">
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
            {filterFields.map((field) => (
              <label key={field.name} className="field-stack">
                <span>{field.label}</span>
                {field.type === 'select' ? (
                  <select className="select-shell" defaultValue={field.placeholder}>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input-shell"
                    type="text"
                    name={field.name}
                    placeholder={field.placeholder}
                  />
                )}
              </label>
            ))}
          </div>

          <div className="filter-actions">
            <button className="primary-button" type="button">
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
