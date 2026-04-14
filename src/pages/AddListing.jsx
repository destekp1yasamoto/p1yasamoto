import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { useAppState } from '../context/useAppState'
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

function AddListing({ title, description }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { draftListings, publishListing, saveDraftListing } = useAppState()

  const draftId = new URLSearchParams(location.search).get('draft')
  const activeDraft = useMemo(
    () => draftListings.find((item) => item.id === draftId) || null,
    [draftId, draftListings],
  )

  const [selectedPhotos, setSelectedPhotos] = useState(activeDraft?.selectedPhotos || [])
  const [uploadError, setUploadError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [formValues, setFormValues] = useState({
    brand: activeDraft?.brand || '',
    model: activeDraft?.model || '',
    year: activeDraft?.year || '',
    km: activeDraft?.km || '',
    price: activeDraft?.price || '',
    city: activeDraft?.city || '',
    plate: activeDraft?.plate || '',
    description: activeDraft?.description || '',
  })

  const handlePhotoChange = (event) => {
    const files = Array.from(event.target.files ?? [])

    if (!files.length) {
      setSelectedPhotos([])
      setUploadError('')
      return
    }

    if (files.length > 10) {
      setSelectedPhotos([])
      setUploadError('En fazla 10 fotograf yukleyebilirsin.')
      event.target.value = ''
      return
    }

    const oversizedFile = files.find((file) => file.size > 4 * 1024 * 1024)

    if (oversizedFile) {
      setSelectedPhotos([])
      setUploadError(`"${oversizedFile.name}" 4 MB sinirini asiyor.`)
      event.target.value = ''
      return
    }

    setSelectedPhotos(
      files.map((file) => ({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      })),
    )
    setUploadError('')
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

  const buildPayload = () => ({
    id: activeDraft?.id,
    title: `${formValues.brand} ${formValues.model}`.trim(),
    brand: formValues.brand,
    model: formValues.model,
    year: formValues.year,
    km: formValues.km,
    price: formValues.price,
    city: formValues.city,
    plate: formValues.plate,
    description: formValues.description,
    plateMasked: formValues.plate ? maskPlateValue(formValues.plate) : 'Plaka yok',
    selectedPhotos,
  })

  const handleSaveDraft = () => {
    saveDraftListing(buildPayload())
    setStatusMessage('Taslak kaydedildi. Profilindeki İlanlarım alanından düzenleyebilirsin.')
  }

  const handlePublish = () => {
    publishListing(buildPayload())
    navigate('/profil')
  }

  const maskedPlate = formValues.plate ? maskPlateValue(formValues.plate) : ''

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
            <h2>Temel İlan Bilgileri</h2>
            <p className="field-note">
              Fotoğraf yükleme kuralları, plaka gizleme davranışı ve taslak kaydetme
              akışı bu ekrana işlendi.
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
                    En fazla 10 fotoğraf eklenebilir. Her dosya 4 MB altında olmalı.
                  </p>
                  {uploadError ? <p className="form-error">{uploadError}</p> : null}
                  {selectedPhotos.length ? (
                    <div className="upload-list">
                      {selectedPhotos.map((photo) => (
                        <span key={photo.name} className="upload-item">
                          {photo.name} · {photo.size}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="field-note">Henüz fotoğraf seçilmedi.</p>
                  )}
                </div>
              </label>

              <label className="field-stack">
                <span>Marka</span>
                <input
                  className="input-shell"
                  type="text"
                  placeholder="Orn. Yamaha"
                  value={formValues.brand}
                  onChange={handleFieldChange('brand')}
                />
              </label>
              <label className="field-stack">
                <span>Model</span>
                <input
                  className="input-shell"
                  type="text"
                  placeholder="Orn. MT-09"
                  value={formValues.model}
                  onChange={handleFieldChange('model')}
                />
              </label>
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
                <span>Şehir</span>
                <input
                  className="input-shell"
                  type="text"
                  placeholder="İstanbul"
                  value={formValues.city}
                  onChange={handleFieldChange('city')}
                />
              </label>
              <label className="field-stack field-stack--full">
                <span>Plaka (isteğe bağlı)</span>
                <input
                  className="input-shell"
                  type="text"
                  placeholder="Orn. 34 ABC 123"
                  value={formValues.plate}
                  onChange={handleFieldChange('plate')}
                />
                <p className="field-note">
                  Son 2 rakam alıcı tarafında gizli görünür. Tam plaka yalnızca satıcı
                  panelinde görünür.
                </p>
                {formValues.plate ? (
                  <p className="plate-preview">
                    Alici gorunumu: <strong>{maskedPlate}</strong>
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
            </div>

            {statusMessage ? <p className="form-success">{statusMessage}</p> : null}

            <div className="filter-actions">
              <button className="primary-button" type="button" onClick={handlePublish}>
                İlanı Yayına Hazırla
              </button>
              <button className="ghost-button" type="button" onClick={handleSaveDraft}>
                Taslak Kaydet
              </button>
            </div>
          </article>

          <aside className="glass-card">
            <h2>İlan kalitesi için öneriler</h2>
            <div className="card-list">
              <article className="mini-card">
                <strong>Fotoğraf seti</strong>
                Tüm açıları, kilometre ekranını ve varsa ekstra parçaları ayrı karelerle
                gösterin. İlk fotoğraf ilanın vitrin kapağı olur.
              </article>
              <article className="mini-card">
                <strong>Doğru başlık</strong>
                Marka + model + paket + yıl kombinasyonu arama görünürlüğünü artırır.
              </article>
              <article className="mini-card">
                <strong>Güven hissi</strong>
                Bakım geçmişi, ekspertiz durumu ve hasar kaydı şeffaf şekilde yazılmalı.
              </article>
              <article className="mini-card">
                <strong>Taslak akışı</strong>
                Taslak kaydettiğin ilanları profilindeki İlanlarım alanından düzenleyebilir
                veya tek tuşla yayına alabilirsin.
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
