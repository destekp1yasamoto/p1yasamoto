import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAppState } from '../context/useAppState'
import { popularBrands, popularModels, turkeyCities } from '../data/turkeyData'
import '../App.css'

function maskPlateValue(plate) {
  return plate
    .split('')
    .reduceRight(
      (result, character) => {
        if (/\d/.test(character) && result.hiddenDigits < 2) {
          return {
            hiddenDigits: result.hiddenDigits + 1,
            value: `*${result.value}`,
          }
        }

        return {
          hiddenDigits: result.hiddenDigits,
          value: `${character}${result.value}`,
        }
      },
      { hiddenDigits: 0, value: '' },
    ).value
}

function parseNumber(value) {
  const normalized = `${value || ''}`.replace(/[^\d]/g, '')
  return normalized ? Number(normalized) : 0
}

function formatLira(value) {
  return `₺${Math.round(value).toLocaleString('tr-TR')}`
}

function filterSuggestions(options, query) {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return options.slice(0, 8)
  }

  const startsWithMatches = options.filter((option) => option.toLowerCase().startsWith(normalizedQuery))
  const includesMatches = options.filter(
    (option) => !startsWithMatches.includes(option) && option.toLowerCase().includes(normalizedQuery),
  )

  return [...startsWithMatches, ...includesMatches].slice(0, 8)
}

function buildAiEstimate(formValues, aiNotes) {
  const kmValue = parseNumber(formValues.km)
  const yearValue = parseNumber(formValues.year)
  const askingPrice = parseNumber(formValues.price)
  const currentYear = new Date().getFullYear()
  const age = yearValue ? Math.max(0, currentYear - yearValue) : 0

  let estimated = askingPrice || 350000

  if (yearValue) {
    estimated += (yearValue - 2018) * 25000
  }

  if (kmValue) {
    estimated -= Math.min(kmValue * 0.8, 180000)
  }

  if (aiNotes.toLowerCase().includes('hasar')) {
    estimated -= 35000
  }

  if (aiNotes.toLowerCase().includes('sifir') || aiNotes.toLowerCase().includes('sıfır')) {
    estimated += 50000
  }

  estimated = Math.max(100000, estimated)

  const recommendation = askingPrice
    ? askingPrice <= estimated
      ? `${formatLira(askingPrice)} uygundur.`
      : `${formatLira(askingPrice)} biraz yüksek görünüyor, ${formatLira(estimated)} bandı daha dengeli.`
    : `${formatLira(estimated)} bandı uygun görünüyor.`

  return `Yapay zeka on degerlendirmesi:
Marka: ${formValues.brand || '-'}
Model: ${formValues.model || '-'}
CC: ${formValues.cc || '-'}
Yil: ${formValues.year || '-'}
KM: ${formValues.km || '-'}
Sehir: ${formValues.city || '-'}
Notlar: ${aiNotes || 'Ek bilgi girilmedi.'}

Tahmini piyasa yorumu:
Bu ilan icin yasi ${age || 0} yil olan, kilometre ve kullanici notlari dikkate alinarak ${formatLira(estimated)} seviyesi makul gorunuyor. ${recommendation}`
}

function AddListing({ title, description }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { allListings, draftListings, publishListing, saveDraftListing } = useAppState()

  const draftId = new URLSearchParams(location.search).get('draft')
  const activeDraft = useMemo(
    () => draftListings.find((item) => item.id === draftId) || null,
    [draftId, draftListings],
  )

  const [selectedPhotos, setSelectedPhotos] = useState(activeDraft?.selectedPhotos || [])
  const [coverPhotoIndex, setCoverPhotoIndex] = useState(activeDraft?.coverPhotoIndex ?? 0)
  const [activePhotoMenuIndex, setActivePhotoMenuIndex] = useState(null)
  const [uploadError, setUploadError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [aiNotes, setAiNotes] = useState(activeDraft?.aiNotes || '')
  const [aiResult, setAiResult] = useState(activeDraft?.aiResult || '')
  const photoMenuRef = useRef(null)
  const brandFieldRef = useRef(null)
  const modelFieldRef = useRef(null)
  const selectedPhotosRef = useRef(selectedPhotos)
  const [activeSuggestionField, setActiveSuggestionField] = useState(null)
  const [formValues, setFormValues] = useState({
    brand: activeDraft?.brand || '',
    model: activeDraft?.model || '',
    cc: activeDraft?.cc || '',
    year: activeDraft?.year || '',
    km: activeDraft?.km || '',
    price: activeDraft?.price || '',
    city: activeDraft?.city || '',
    plate: activeDraft?.plate || '',
    description: activeDraft?.description || '',
  })

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!photoMenuRef.current?.contains(event.target)) {
        setActivePhotoMenuIndex(null)
      }

      if (
        !brandFieldRef.current?.contains(event.target)
        && !modelFieldRef.current?.contains(event.target)
      ) {
        setActiveSuggestionField(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  useEffect(() => {
    selectedPhotosRef.current = selectedPhotos
  }, [selectedPhotos])

  useEffect(() => () => {
    selectedPhotosRef.current.forEach((photo) => {
      if (photo.isObjectUrl && photo.previewUrl) {
        URL.revokeObjectURL(photo.previewUrl)
      }
    })
  }, [])

  const handlePhotoChange = (event) => {
    const files = Array.from(event.target.files ?? [])

    if (!files.length) {
      return
    }

    const oversizedFile = files.find((file) => file.size > 4 * 1024 * 1024)

    if (oversizedFile) {
      setUploadError(`"${oversizedFile.name}" 4 MB sinirini asiyor.`)
      event.target.value = ''
      return
    }

    const incomingPhotos = files.map((file) => ({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      previewUrl: URL.createObjectURL(file),
      isObjectUrl: true,
    }))

    setSelectedPhotos((current) => {
      const merged = [...current]

      incomingPhotos.forEach((photo) => {
        const exists = merged.some((item) => item.name === photo.name && item.size === photo.size)

        if (!exists) {
          merged.push(photo)
        }
      })

      if (merged.length > 10) {
        merged.slice(10).forEach((photo) => {
          if (photo.isObjectUrl && photo.previewUrl) {
            URL.revokeObjectURL(photo.previewUrl)
          }
        })
        setUploadError('Toplamda en fazla 10 fotograf ekleyebilirsin.')
        return merged.slice(0, 10)
      }

      setUploadError('')
      return merged
    })

    event.target.value = ''
  }

  const handleRemovePhoto = (index) => {
    setSelectedPhotos((current) =>
      current.filter((photo, itemIndex) => {
        if (itemIndex === index && photo.isObjectUrl && photo.previewUrl) {
          URL.revokeObjectURL(photo.previewUrl)
        }

        return itemIndex !== index
      }),
    )
    setCoverPhotoIndex((current) => (index === current ? 0 : Math.max(0, current - (index < current ? 1 : 0))))
    setActivePhotoMenuIndex(null)
  }

  const handleFieldChange = (field) => (event) => {
    const value = field === 'plate'
      ? event.target.value.toUpperCase()
      : event.target.value

    setFormValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSuggestionSelect = (field, value) => {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }))
    setActiveSuggestionField(null)
  }

  const buildPayload = () => ({
    id: activeDraft?.id,
    title: `${formValues.brand} ${formValues.model}`.trim(),
    brand: formValues.brand,
    model: formValues.model,
    cc: formValues.cc,
    year: formValues.year,
    km: formValues.km,
    price: formValues.price,
    city: formValues.city,
    plate: formValues.plate,
    description: formValues.description,
    plateMasked: formValues.plate ? maskPlateValue(formValues.plate) : 'Plaka yok',
    selectedPhotos: selectedPhotos.map((photo) => ({
      name: photo.name,
      size: photo.size,
    })),
    coverPhotoIndex,
    aiNotes,
    aiResult,
  })

  const handleSaveDraft = () => {
    saveDraftListing(buildPayload())
    setStatusMessage('Taslak kaydedildi. Profilindeki Ilanlarim alanindan duzenleyebilirsin.')
  }

  const handlePublish = () => {
    publishListing(buildPayload())
    navigate('/profil')
  }

  const handleGenerateAi = () => {
    setAiResult(buildAiEstimate(formValues, aiNotes))
  }

  const maskedPlate = formValues.plate ? maskPlateValue(formValues.plate) : ''
  const brandSuggestions = [...new Set([...popularBrands, ...allListings.map((item) => item.brand).filter(Boolean)])]
  const modelSuggestions = [...new Set([...popularModels, ...allListings.map((item) => item.model).filter(Boolean)])]
  const visibleBrandSuggestions = filterSuggestions(brandSuggestions, formValues.brand)
  const visibleModelSuggestions = filterSuggestions(modelSuggestions, formValues.model)

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-content">
        <section className="page-hero">
          <span className="eyebrow">{activeDraft ? 'Taslagi duzenle' : 'Ilan olustur'}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </section>

        <section className="page-grid">
          <article className="form-card">
            <h2>Temel Ilan Bilgileri</h2>
            <p className="field-note">
              Fotograf yukleme kurallari, kapak fotografi secimi ve on degerlendirme akisi bu ekrana islendi.
            </p>

            <div className="form-grid">
              <label className="field-stack field-stack--full">
                <span>Fotograflar</span>
                <div className="upload-dropzone">
                  <input
                    className="input-shell upload-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                  />
                  <p className="field-note">
                    Toplamda en fazla 10 fotograf eklenebilir. Her dosya 4 MB altinda olmali.
                  </p>
                  {uploadError ? <p className="form-error">{uploadError}</p> : null}
                  {selectedPhotos.length ? (
                    <div ref={photoMenuRef} className="upload-grid">
                      {selectedPhotos.map((photo, index) => (
                        <article
                          key={`${photo.name}-${index}`}
                          className={`upload-item upload-item--tile${coverPhotoIndex === index ? ' is-cover' : ''}`}
                        >
                          <div className="upload-item__visual">
                            {photo.previewUrl ? (
                              <img src={photo.previewUrl} alt={photo.name} />
                            ) : (
                              <span>{String(index + 1).padStart(2, '0')}</span>
                            )}
                            {coverPhotoIndex === index ? (
                              <span className="upload-item__badge">Kapakta</span>
                            ) : (
                              <>
                                <button
                                  className="upload-item__menu-button"
                                  type="button"
                                  aria-label={`${photo.name} icin islemler`}
                                  onClick={() =>
                                    setActivePhotoMenuIndex((current) => (current === index ? null : index))
                                  }
                                >
                                  <span />
                                  <span />
                                  <span />
                                </button>
                                {activePhotoMenuIndex === index ? (
                                  <div className="upload-item__menu">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCoverPhotoIndex(index)
                                        setActivePhotoMenuIndex(null)
                                      }}
                                    >
                                      Kapak sec
                                    </button>
                                    <button type="button" onClick={() => handleRemovePhoto(index)}>
                                      Kaldir
                                    </button>
                                  </div>
                                ) : null}
                              </>
                            )}
                            <div className="upload-item__shade" />
                          </div>
                          <div className="upload-item__meta">
                            <strong title={photo.name}>{photo.name}</strong>
                            <span>{photo.size}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="field-note">Henuz fotograf secilmedi.</p>
                  )}
                </div>
              </label>

              <label ref={brandFieldRef} className="field-stack">
                <span>Marka</span>
                <div className="suggest-field">
                  <input
                    className="input-shell"
                    type="text"
                    placeholder="Orn. Yamaha"
                    value={formValues.brand}
                    onChange={handleFieldChange('brand')}
                    onFocus={() => setActiveSuggestionField('brand')}
                    autoComplete="off"
                  />
                  {activeSuggestionField === 'brand' && visibleBrandSuggestions.length ? (
                    <div className="suggest-field__panel">
                      {visibleBrandSuggestions.map((brand) => (
                        <button
                          key={brand}
                          className={`suggest-field__option${formValues.brand === brand ? ' is-active' : ''}`}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSuggestionSelect('brand', brand)}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </label>
              <label ref={modelFieldRef} className="field-stack">
                <span>Model</span>
                <div className="suggest-field">
                  <input
                    className="input-shell"
                    type="text"
                    placeholder="Orn. MT-09"
                    value={formValues.model}
                    onChange={handleFieldChange('model')}
                    onFocus={() => setActiveSuggestionField('model')}
                    autoComplete="off"
                  />
                  {activeSuggestionField === 'model' && visibleModelSuggestions.length ? (
                    <div className="suggest-field__panel">
                      {visibleModelSuggestions.map((model) => (
                        <button
                          key={model}
                          className={`suggest-field__option${formValues.model === model ? ' is-active' : ''}`}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSuggestionSelect('model', model)}
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </label>
              <label className="field-stack">
                <span>Yil</span>
                <input
                  className="input-shell"
                  type="text"
                  placeholder="2024"
                  value={formValues.year}
                  onChange={handleFieldChange('year')}
                />
              </label>
              <label className="field-stack">
                <span>CC</span>
                <input
                  className="input-shell"
                  type="text"
                  placeholder="Orn. 600"
                  value={formValues.cc}
                  onChange={handleFieldChange('cc')}
                />
              </label>
              <label className="field-stack">
                <span>Kilometre</span>
                <input
                  className="input-shell"
                  type="text"
                  placeholder="4.500 km"
                  value={formValues.km}
                  onChange={handleFieldChange('km')}
                />
              </label>
              <label className="field-stack">
                <span>Fiyat</span>
                <input
                  className="input-shell"
                  type="text"
                  placeholder="₺850.000"
                  value={formValues.price}
                  onChange={handleFieldChange('price')}
                />
              </label>
              <label className="field-stack">
                <span>Sehir</span>
                <input
                  className="input-shell"
                  type="text"
                  placeholder="Sehir sec veya yaz"
                  value={formValues.city}
                  onChange={handleFieldChange('city')}
                  list="city-suggestions"
                />
                <datalist id="city-suggestions">
                  {turkeyCities.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </label>
              <label className="field-stack field-stack--full">
                <span>Plaka (istege bagli)</span>
                <input
                  className="input-shell"
                  type="text"
                  placeholder="Orn. 34 ABC 123"
                  value={formValues.plate}
                  onChange={handleFieldChange('plate')}
                />
                <p className="field-note">
                  Son 2 rakam alici tarafinda gizli gorunur. Tam plaka yalnizca satici panelinde gorunur.
                </p>
                {formValues.plate ? (
                  <p className="plate-preview">
                    Alici gorunumu: <strong>{maskedPlate}</strong>
                  </p>
                ) : null}
              </label>
              <label className="field-stack field-stack--full">
                <span>Aciklama</span>
                <textarea
                  className="textarea-shell"
                  placeholder="Ekspertiz, aksesuarlar ve bakim bilgilerini ekleyin"
                  value={formValues.description}
                  onChange={handleFieldChange('description')}
                />
              </label>
              <label className="field-stack field-stack--full">
                <span>Yapay Zeka Icin Notlar</span>
                <textarea
                  className="textarea-shell textarea-shell--compact"
                  placeholder="Orn. Motor 2 yildir bende, hasar kaydi yok, sifira yakin durumda, bakimlari yetkili serviste yapildi..."
                  value={aiNotes}
                  onChange={(event) => setAiNotes(event.target.value)}
                />
              </label>
            </div>

            {statusMessage ? <p className="form-success">{statusMessage}</p> : null}

            <div className="filter-actions">
              <button className="primary-button" type="button" onClick={handlePublish}>
                Ilani Yayina Hazirla
              </button>
              <button className="ghost-button" type="button" onClick={handleSaveDraft}>
                Taslak Kaydet
              </button>
              <button className="secondary-button" type="button" onClick={handleGenerateAi}>
                YZ Yorumla
              </button>
            </div>

            {aiResult ? (
              <article className="ai-estimate-card">
                <h3>Yapay Zeka On Degerlendirme</h3>
                <pre>{aiResult}</pre>
              </article>
            ) : null}
          </article>

          <aside className="glass-card">
            <h2>Ilan kalitesi icin oneriler</h2>
            <div className="card-list">
              <article className="mini-card">
                <strong>10 fotograf tam destek</strong>
                Fotograf ekleme alani artik tek seferde ya da parca parca toplam 10 dosyaya kadar calisiyor.
              </article>
              <article className="mini-card">
                <strong>Kapak foto secimi</strong>
                Istedigin kareyi "Kapak Yap" ile vitrin gorseli olarak belirleyebilirsin.
              </article>
              <article className="mini-card">
                <strong>Yapay zeka yorum alani</strong>
                Km, hasar, kullanim suresi, sifir ayari ve genel kondisyonu yazarak fiyat bandi yorumu alabilirsin.
              </article>
              <article className="mini-card">
                <strong>Taslak akisi</strong>
                Taslak kaydettigin ilanlari profilindeki Ilanlarim alanindan duzenleyebilir veya tek tusla yayina alabilirsin.
              </article>
            </div>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default AddListing
