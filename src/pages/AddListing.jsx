import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { StarIcon, TrashIcon } from '../components/Icons'
import { useAppState } from '../context/useAppState'
import { brandModels, popularBrands, popularModels, turkeyCities } from '../data/turkeyData'
import '../App.css'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

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
  const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR')

  if (!normalizedQuery) {
    return options
  }

  return options.filter((option) => option.toLocaleLowerCase('tr-TR').startsWith(normalizedQuery))
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

  return `Yapay zeka ön değerlendirmesi:
Marka: ${formValues.brand || '-'}
Model: ${formValues.model || '-'}
CC: ${formValues.cc || '-'}
Yıl: ${formValues.year || '-'}
KM: ${formValues.km || '-'}
Şehir: ${formValues.city || '-'}
Notlar: ${aiNotes || 'Ek bilgi girilmedi.'}

Tahmini piyasa yorumu:
Bu ilan için yaşı ${age || 0} yıl olan, kilometre ve kullanıcı notları dikkate alınarak ${formatLira(estimated)} seviyesi makul görünüyor. ${recommendation}`
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
  const [uploadError, setUploadError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [aiNotes, setAiNotes] = useState(activeDraft?.aiNotes || '')
  const [aiResult, setAiResult] = useState(activeDraft?.aiResult || '')
  const brandFieldRef = useRef(null)
  const modelFieldRef = useRef(null)
  const cityFieldRef = useRef(null)
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
      if (
        !brandFieldRef.current?.contains(event.target)
        && !modelFieldRef.current?.contains(event.target)
        && !cityFieldRef.current?.contains(event.target)
      ) {
        setActiveSuggestionField(null)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  const handlePhotoChange = (event) => {
    const files = Array.from(event.target.files ?? [])

    if (!files.length) {
      return
    }

    const invalidTypeFile = files.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type))

    if (invalidTypeFile) {
      setUploadError(`"${invalidTypeFile.name}" sadece JPG, JPEG, PNG veya WEBP olabilir.`)
      event.target.value = ''
      return
    }

    const emptyFile = files.find((file) => file.size <= 0)

    if (emptyFile) {
      setUploadError(`"${emptyFile.name}" bos ya da bozuk gorunuyor.`)
      event.target.value = ''
      return
    }

    const oversizedFile = files.find((file) => file.size > 4 * 1024 * 1024)

    if (oversizedFile) {
      setUploadError(`"${oversizedFile.name}" 4 MB sınırını aşıyor.`)
      event.target.value = ''
      return
    }

    const incomingPhotos = files.map((file) => ({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      previewUrl: URL.createObjectURL(file),
      isObjectUrl: true,
      file,
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
        setUploadError('Toplamda en fazla 10 fotoğraf ekleyebilirsin.')
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
  }

  const handleFieldChange = (field) => (event) => {
    const value = field === 'plate'
      ? event.target.value.toUpperCase()
      : event.target.value

    setFormValues((current) => {
      if (field === 'brand') {
        return {
          ...current,
          brand: value,
          model: '',
        }
      }

      return {
        ...current,
        [field]: value,
      }
    })
  }

  const handleSuggestionSelect = (field, value) => {
    setFormValues((current) => {
      if (field === 'brand') {
        return {
          ...current,
          brand: value,
          model: '',
        }
      }

      return {
        ...current,
        [field]: value,
      }
    })
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
      previewUrl: photo.previewUrl || '',
    })),
    coverPhotoIndex,
    visual: selectedPhotos[coverPhotoIndex]?.previewUrl || '',
    aiNotes,
    aiResult,
  })

  const _handleSaveDraft = () => {
    saveDraftListing(buildPayload())
    setStatusMessage('Taslak kaydedildi. Profilindeki İlanlarım alanından düzenleyebilirsin.')
  }

  const _handlePublish = () => {
    publishListing(buildPayload())
    navigate('/profil')
  }

  const handleSaveDraftAction = () => {
    setIsSavingDraft(true)
    setStatusMessage('')

    try {
      saveDraftListing(buildPayload())
      setStatusMessage('Taslak kaydedildi. Profilindeki Ilanlarim alanindan duzenleyebilirsin.')
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handlePublishAction = async () => {
    setUploadError('')
    setStatusMessage('')
    setIsPublishing(true)

    try {
      await publishListing(buildPayload(), selectedPhotos)
      navigate('/profil')
    } catch (error) {
      setUploadError(error.message || 'Ilan yayinlanirken bir sorun olustu.')
    } finally {
      setIsPublishing(false)
    }
  }

  const handleGenerateAi = () => {
    setAiResult(buildAiEstimate(formValues, aiNotes))
  }

  const maskedPlate = formValues.plate ? maskPlateValue(formValues.plate) : ''
  const brandSuggestions = [...new Set([...popularBrands, ...allListings.map((item) => item.brand).filter(Boolean)])]
  const selectedBrand = brandSuggestions.find(
    (brand) => brand.toLocaleLowerCase('tr-TR') === formValues.brand.trim().toLocaleLowerCase('tr-TR'),
  )
  const selectedBrandModels = selectedBrand
    ? [
        ...(brandModels[selectedBrand] || []),
        ...allListings
          .filter((item) => item.brand === selectedBrand)
          .map((item) => item.model)
          .filter(Boolean),
      ]
    : []
  const modelSuggestions = [...new Set(selectedBrandModels.length ? selectedBrandModels : popularModels)]
  const visibleBrandSuggestions = filterSuggestions(brandSuggestions, formValues.brand)
  const visibleModelSuggestions = selectedBrand ? filterSuggestions(modelSuggestions, formValues.model) : []
  const visibleCitySuggestions = filterSuggestions(turkeyCities, formValues.city)

  return (
    <div className="page-shell">
      <Navbar />

      <main className="page-content">
        <section className="page-hero">
          <span className="eyebrow">{activeDraft ? 'Taslağı düzenle' : 'İlan oluştur'}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </section>

        <section className="page-grid">
          <article className="form-card">
            <h2>Temel İlan Bilgileri</h2>
            <p className="field-note">
              Fotoğraf yükleme kuralları, kapak fotoğrafı seçimi ve ön değerlendirme akışı bu ekrana işlendi.
            </p>

            <div className="form-grid">
              <label className="field-stack field-stack--full">
                <span>Fotoğraflar</span>
                <div className="upload-dropzone">
                  <input
                    className="input-shell upload-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                  />
                  <p className="field-note">
                    Toplamda en fazla 10 fotoğraf eklenebilir. Her dosya 4 MB altında olmalı.
                  </p>
                  {uploadError ? <p className="form-error">{uploadError}</p> : null}
                  {selectedPhotos.length ? (
                    <div className="upload-grid">
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
                            <div className="upload-item__actions">
                              <button
                                className={`upload-item__action-button${coverPhotoIndex === index ? ' is-active' : ''}`}
                                type="button"
                                aria-label={coverPhotoIndex === index ? 'Kapak fotoğrafı seçili' : 'Kapak fotoğrafı yap'}
                                onClick={() => setCoverPhotoIndex(index)}
                              >
                                <StarIcon filled={coverPhotoIndex === index} />
                              </button>
                              <button
                                className="upload-item__action-button upload-item__action-button--danger"
                                type="button"
                                aria-label={`${photo.name} fotoğrafını sil`}
                                onClick={() => handleRemovePhoto(index)}
                              >
                                <TrashIcon />
                              </button>
                            </div>
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
                    <p className="field-note">Henüz fotoğraf seçilmedi.</p>
                  )}
                </div>
              </label>

              <div ref={brandFieldRef} className="field-stack">
                <span className="field-stack__label">Marka</span>
                <div className="suggest-field">
                  <input
                    className="input-shell"
                    type="text"
                    placeholder="Örn. Yamaha"
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
              </div>

              <div ref={modelFieldRef} className="field-stack">
                <span className="field-stack__label">Model</span>
                <div className="suggest-field">
                  <input
                    className="input-shell"
                    type="text"
                    placeholder={selectedBrand ? 'Örn. MT-09' : 'Önce marka seç'}
                    value={formValues.model}
                    onChange={handleFieldChange('model')}
                    onFocus={() => {
                      if (selectedBrand) {
                        setActiveSuggestionField('model')
                      }
                    }}
                    autoComplete="off"
                    disabled={!selectedBrand}
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
              </div>

              <label className="field-stack">
                <span>Yıl</span>
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
                  placeholder="Örn. 600"
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

              <div ref={cityFieldRef} className="field-stack">
                <span className="field-stack__label">Şehir</span>
                <div className="suggest-field">
                  <input
                    className="input-shell"
                    type="text"
                    placeholder="Şehir seç veya yaz"
                    value={formValues.city}
                    onChange={handleFieldChange('city')}
                    onFocus={() => setActiveSuggestionField('city')}
                    autoComplete="off"
                  />
                  {activeSuggestionField === 'city' && visibleCitySuggestions.length ? (
                    <div className="suggest-field__panel">
                      {visibleCitySuggestions.map((city) => (
                        <button
                          key={city}
                          className={`suggest-field__option${formValues.city === city ? ' is-active' : ''}`}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSuggestionSelect('city', city)}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <label className="field-stack field-stack--full">
                <span>Plaka (isteğe bağlı)</span>
                <input
                  className="input-shell"
                  type="text"
                  placeholder="Örn. 34 ABC 123"
                  value={formValues.plate}
                  onChange={handleFieldChange('plate')}
                />
                <p className="field-note">
                  Son 2 rakam alıcı tarafında gizli görünür. Tam plaka yalnızca satıcı panelinde görünür.
                </p>
                {formValues.plate ? (
                  <p className="plate-preview">
                    Alıcı görünümü: <strong>{maskedPlate}</strong>
                  </p>
                ) : null}
              </label>

              <label className="field-stack field-stack--full">
                <span>Açıklama</span>
                <textarea
                  className="textarea-shell"
                  placeholder="Ekspertiz, aksesuarlar ve bakım bilgilerini ekleyin"
                  value={formValues.description}
                  onChange={handleFieldChange('description')}
                />
              </label>

              <label className="field-stack field-stack--full">
                <span>Yapay Zeka İçin Notlar</span>
                <textarea
                  className="textarea-shell textarea-shell--compact"
                  placeholder="Örn. Motor 2 yıldır bende, hasar kaydı yok, sıfıra yakın durumda, bakımları yetkili serviste yapıldı..."
                  value={aiNotes}
                  onChange={(event) => setAiNotes(event.target.value)}
                />
              </label>
            </div>

            {statusMessage ? <p className="form-success">{statusMessage}</p> : null}

            <div className="filter-actions">
              <button className="primary-button" type="button" onClick={handlePublishAction} disabled={isPublishing || isSavingDraft}>
                İlanı Yayına Hazırla
              </button>
              <button className="ghost-button" type="button" onClick={handleSaveDraftAction} disabled={isSavingDraft || isPublishing}>
                {isSavingDraft ? 'Kaydediliyor...' : 'Taslak Kaydet'}
              </button>
              <button className="secondary-button" type="button" onClick={handleGenerateAi} disabled={isPublishing}>
                {isPublishing ? 'Yukleniyor...' : 'YZ Yorumla'}
              </button>
            </div>

            {aiResult ? (
              <article className="ai-estimate-card">
                <h3>Yapay Zeka Ön Değerlendirme</h3>
                <pre>{aiResult}</pre>
              </article>
            ) : null}
          </article>

          <aside className="glass-card">
            <h2>İlan kalitesi için öneriler</h2>
            <div className="card-list">
              <article className="mini-card">
                <strong>10 fotoğraf tam destek</strong>
                Fotoğraf ekleme alanı artık tek seferde ya da parça parça toplam 10 dosyaya kadar çalışıyor.
              </article>
              <article className="mini-card">
                <strong>Kapak foto seçimi</strong>
                İstediğin kareyi "Kapak Yap" ile vitrin görseli olarak belirleyebilirsin.
              </article>
              <article className="mini-card">
                <strong>Yapay zeka yorum alanı</strong>
                Km, hasar, kullanım süresi, sıfır ayarı ve genel kondisyonu yazarak fiyat bandı yorumu alabilirsin.
              </article>
              <article className="mini-card">
                <strong>Taslak akışı</strong>
                Taslak kaydettiğin ilanları profilindeki İlanlarım alanından düzenleyebilir veya tek tuşla yayına alabilirsin.
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
