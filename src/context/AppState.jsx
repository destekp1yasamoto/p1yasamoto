import { useCallback, useEffect, useMemo, useState } from 'react'
import { featuredBikes } from '../data/featuredBikes'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { AppStateContext } from './AppStateContext'

const STORAGE_KEY = 'p1yasamoto-ui-state'
const configuredSiteUrl = `${import.meta.env.VITE_SITE_URL || ''}`.trim().replace(/\/+$/, '')
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const LISTING_BUCKET = 'listing-photos'

const defaultUiState = {
  favorites: [],
  comparisons: [],
  draftListings: [],
  readNotificationIds: [],
}

function asText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function formatTurkishDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`
}

function formatJoinedAt(dateString) {
  const date = dateString ? new Date(dateString) : new Date()
  return new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatShortDate(dateString) {
  const date = dateString ? new Date(dateString) : new Date()
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatLastSeen(dateString) {
  if (!dateString) {
    return 'Henuz gorulmedi'
  }

  const lastSeen = new Date(dateString)
  const diffMs = Date.now() - lastSeen.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 5) {
    return 'Az once aktifti'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} dakika once aktifti`
  }

  if (diffHours < 24) {
    return 'Bugun aktifti'
  }

  if (diffDays === 1) {
    return 'Dun aktifti'
  }

  return `${diffDays} gun once aktifti`
}

function normalizeDisplayText(value) {
  return `${value || ''}`.trim().replace(/\s+/g, ' ')
}

function normalizePhone(value) {
  const digits = `${value || ''}`.replace(/[^\d+]/g, '')
  return digits || null
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(`${email || ''}`.trim())
}

function getAppBaseUrl() {
  if (configuredSiteUrl) {
    return configuredSiteUrl
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}

function hasPendingAuthCallback() {
  if (typeof window === 'undefined') {
    return false
  }

  const search = window.location.search || ''
  const hash = window.location.hash || ''
  const callbackTokens = ['access_token=', 'refresh_token=', 'code=', 'type=recovery', 'type=signup']

  return callbackTokens.some((token) => search.includes(token) || hash.includes(token))
}

function clearAuthArtifactsFromUrl() {
  if (typeof window === 'undefined') {
    return
  }

  const authSearchTokens = ['code', 'type', 'error', 'error_code', 'error_description']
  const currentSearch = new URLSearchParams(window.location.search)
  let searchChanged = false

  authSearchTokens.forEach((token) => {
    if (currentSearch.has(token)) {
      currentSearch.delete(token)
      searchChanged = true
    }
  })

  const currentHash = window.location.hash || ''
  const shouldClearHash = ['access_token=', 'refresh_token=', 'expires_at=', 'expires_in=', 'token_type=']
    .some((token) => currentHash.includes(token))

  if (!searchChanged && !shouldClearHash) {
    return
  }

  const nextSearch = currentSearch.toString()
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`
  window.history.replaceState({}, '', nextUrl)
}

function withTimeout(promise, fallbackMessage, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(fallbackMessage))
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

function extractPhotoVisuals(photos) {
  if (!Array.isArray(photos) || !photos.length) {
    return []
  }

  return photos
    .map((photo) => photo?.url || photo?.previewUrl || '')
    .filter((item) => typeof item === 'string' && item.trim())
}

function buildSafeGallery(payload, visual) {
  const photoVisuals = extractPhotoVisuals(payload.photos || payload.selectedPhotos)

  if (photoVisuals.length) {
    return photoVisuals
  }

  if (Array.isArray(payload.gallery) && payload.gallery.length) {
    const galleryItems = payload.gallery.filter((item) => typeof item === 'string' && item.trim())

    if (galleryItems.length) {
      return galleryItems
    }
  }

  return [visual]
}

function normalizeDraftListing(item) {
  const fallbackVisual = 'linear-gradient(135deg, #441111 0%, #1a1a1a 100%)'
  const gallery = buildSafeGallery(item, asText(item.visual, fallbackVisual))
  const coverPhotoIndex = Number.isInteger(item.coverPhotoIndex) ? item.coverPhotoIndex : 0
  const visual = gallery[coverPhotoIndex] || asText(item.visual, fallbackVisual)

  return {
    ...item,
    id: item.id || `draft-${Date.now()}`,
    title: asText(item.title, `${asText(item.brand, 'Motor')} ${asText(item.model)}`.trim()),
    badge: asText(item.badge, 'Taslak'),
    price: asText(item.price, 'Fiyat girilmedi'),
    tag: asText(item.tag, `${asText(item.year, '2026')} Model`),
    model: asText(item.model, 'Model'),
    cc: asText(item.cc),
    year: asText(item.year, '2026'),
    km: asText(item.km, '0 km'),
    city: asText(item.city, 'Istanbul'),
    description: asText(item.description, 'Aciklama eklenmedi.'),
    visual,
    gallery,
    selectedPhotos: Array.isArray(item.selectedPhotos) ? item.selectedPhotos : [],
    coverPhotoIndex,
    updatedAt: asText(item.updatedAt, 'Az once'),
  }
}

function normalizeSupabaseError(error, fallbackMessage) {
  const rawMessage = `${error?.message || error || ''}`.trim()
  const message = rawMessage.toLowerCase()

  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Sunucuya baglanilamadi. Internetini ve Supabase ayarlarini kontrol edip tekrar dene.'
  }

  if (message.includes('timeout') || message.includes('zaman')) {
    return 'Sunucu yanit vermedi. Birkac saniye sonra tekrar dene.'
  }

  if (message.includes('relation') && message.includes('does not exist')) {
    return 'Supabase veritabani tablolari eksik. SQL kurulumunu tekrar calistirman gerekiyor.'
  }

  if (message.includes('bucket') && (message.includes('not found') || message.includes('does not exist'))) {
    return 'Foto yukleme alani hazir degil. Supabase storage bucket ayarini kontrol et.'
  }

  if (message.includes('row-level security') || message.includes('permission denied')) {
    return 'Bu islem icin yetkin yok.'
  }

  if (message.includes('invalid login credentials')) {
    return 'Kullanici adi, mail, telefon ya da sifre hatali.'
  }

  if (message.includes('duplicate key') || message.includes('message_requests_listing_id_sender_id_recipient_id_key')) {
    return 'Bu ilan icin zaten bekleyen bir mesaj istegin var.'
  }

  if (message.includes('same email address') || message.includes('already registered')) {
    return 'Bu mail adresiyle zaten bir hesap bulunuyor.'
  }

  return rawMessage || fallbackMessage
}

function buildFallbackProfile(authUser) {
  const metadata = authUser?.user_metadata || {}
  const username = metadata.username || metadata.full_name || metadata.name || authUser?.email?.split('@')[0] || 'Kullanici'

  return {
    id: authUser?.id,
    email: authUser?.email || '',
    username,
    full_name: metadata.full_name || metadata.name || username,
    phone: metadata.phone || '',
    city: metadata.city || 'Istanbul',
    avatar_url: metadata.avatar_url || metadata.picture || '',
    phone_verified: false,
    role: 'user',
    seller_bio: '',
    last_seen_at: new Date().toISOString(),
    is_verified_seller: false,
    seller_verified_by_admin: false,
    created_at: authUser?.created_at || new Date().toISOString(),
  }
}

function buildUserViewModel(authUser, profile) {
  if (!authUser) {
    return null
  }

  const safeProfile = profile || buildFallbackProfile(authUser)

  return {
    id: authUser.id,
    name: safeProfile.full_name || safeProfile.username || 'Kullanici',
    username: safeProfile.username || safeProfile.full_name || 'kullanici',
    identifier: authUser.email || safeProfile.phone || safeProfile.username,
    email: authUser.email || safeProfile.email || '',
    phone: safeProfile.phone || '',
    city: safeProfile.city || 'Istanbul',
    joinedAt: `${formatJoinedAt(safeProfile.created_at)}'den beri`,
    isDemo: false,
    avatarUrl: safeProfile.avatar_url || '',
    role: safeProfile.role || 'user',
    bio: safeProfile.seller_bio || '',
    lastSeen: formatLastSeen(safeProfile.last_seen_at),
    isVerifiedSeller: Boolean(safeProfile.is_verified_seller),
    verified: {
      email: Boolean(authUser.email_confirmed_at),
      phone: Boolean(safeProfile.phone_verified),
    },
  }
}

function normalizeListingRecord(row) {
  const fallbackVisual = 'linear-gradient(135deg, #441111 0%, #1a1a1a 100%)'
  const gallery = buildSafeGallery(row, asText(row.visual, fallbackVisual))
  const coverPhotoIndex = Number.isInteger(row.cover_photo_index)
    ? row.cover_photo_index
    : Number.isInteger(row.coverPhotoIndex)
      ? row.coverPhotoIndex
      : 0
  const visual = gallery[coverPhotoIndex] || asText(row.visual, fallbackVisual)

  return {
    id: row.id,
    title: asText(row.title, `${asText(row.brand, 'Motor')} ${asText(row.model)}`.trim()),
    badge: asText(row.badge, 'Ilk Eklenen'),
    price: asText(row.price, 'Fiyat girilmedi'),
    tag: asText(row.tag, `${asText(row.year, '2026')} Model`),
    model: asText(row.model, 'Model'),
    cc: asText(row.cc),
    year: asText(row.year, '2026'),
    km: asText(row.km, '0 km'),
    city: asText(row.city, 'Istanbul'),
    owner: asText(row.owner_name || row.owner, 'Satici'),
    ownerUsername: asText(row.owner_username),
    ownerId: row.owner_id || row.ownerId || null,
    brand: asText(row.brand, 'Marka'),
    phone: asText(row.owner_phone || row.phone, 'Telefon eklenmedi'),
    avatarUrl: asText(row.owner_avatar_url || row.avatarUrl),
    isVerifiedSeller: Boolean(row.owner_is_verified_seller || row.isVerifiedSeller),
    plateMasked: asText(row.plate_masked || row.plateMasked, 'Plaka yok'),
    date: asText(row.date, formatTurkishDate(row.created_at)),
    description: asText(row.description, 'Aciklama eklenmedi.'),
    visual,
    gallery,
    photoCount: Array.isArray(row.photos) ? row.photos.length : gallery.length,
    selectedPhotos: Array.isArray(row.photos) ? row.photos : Array.isArray(row.selectedPhotos) ? row.selectedPhotos : [],
    coverPhotoIndex,
    updatedAt: asText(row.updatedAt, formatShortDate(row.updated_at || row.created_at)),
    createdAt: row.created_at || null,
  }
}

function buildMessageRecord(row, currentUserId) {
  const isIncoming = row.recipient_id === currentUserId
  const otherUser = isIncoming ? row.sender_name : row.recipient_name

  return {
    id: row.id,
    listingId: row.listing_id,
    title: row.listing_title || 'Ilan',
    otherUser,
    preview: row.note || (row.status === 'approved' ? 'Sohbet aktif.' : 'Mesaj istegi beklemede.'),
    status: row.status,
    date: formatShortDate(row.created_at),
    createdAt: row.created_at,
    isIncoming,
  }
}

function loadUiState() {
  if (typeof window === 'undefined') {
    return defaultUiState
  }

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY)
    if (!rawState) {
      return defaultUiState
    }

    return {
      ...defaultUiState,
      ...JSON.parse(rawState),
      draftListings: Array.isArray(JSON.parse(rawState).draftListings)
        ? JSON.parse(rawState).draftListings.map(normalizeDraftListing)
        : [],
    }
  } catch {
    return defaultUiState
  }
}

function persistUiState(uiState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(uiState))
}

function isRemotePhotoUrl(value) {
  return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/'))
}

function validateImageFile(file) {
  if (!file) {
    throw new Error('Gecerli bir foto secmelisin.')
  }

  if (file.size <= 0) {
    throw new Error(`"${file.name}" bos ya da bozuk gorunuyor.`)
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`"${file.name}" sadece JPG, JPEG, PNG veya WEBP olabilir.`)
  }

  if (file.size > 4 * 1024 * 1024) {
    throw new Error(`"${file.name}" 4 MB sinirini asiyor.`)
  }
}

function sanitizeFilename(name) {
  return `${name || 'foto'}`
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function uploadListingPhotos(photoEntries, userId) {
  if (!supabase) {
    throw new Error('Supabase baglantisi eksik.')
  }

  if (!Array.isArray(photoEntries) || !photoEntries.length) {
    return { photos: [], uploadedPaths: [] }
  }

  const uploadedPaths = []
  const photos = []

  for (const [index, entry] of photoEntries.entries()) {
    const file = entry?.file

    if (file) {
      validateImageFile(file)

      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${userId}/${Date.now()}-${index}-${sanitizeFilename(file.name || `photo.${extension}`)}`

      const { error: uploadError } = await withTimeout(
        supabase.storage.from(LISTING_BUCKET).upload(filePath, file, {
          upsert: false,
          contentType: file.type,
        }),
        'Fotograflar yuklenirken zaman asimina ugradi.',
        20000,
      )

      if (uploadError) {
        throw uploadError
      }

      uploadedPaths.push(filePath)

      const { data } = supabase.storage.from(LISTING_BUCKET).getPublicUrl(filePath)

      photos.push({
        name: file.name,
        size: file.size,
        path: filePath,
        url: data.publicUrl,
      })

      continue
    }

    const previewUrl = entry?.url || entry?.previewUrl || ''

    if (isRemotePhotoUrl(previewUrl)) {
      photos.push({
        name: entry?.name || `photo-${index + 1}`,
        size: entry?.size || 0,
        path: entry?.path || null,
        url: previewUrl,
      })
      continue
    }

    if (typeof previewUrl === 'string' && previewUrl.startsWith('blob:')) {
      throw new Error('Taslakta kalan yerel fotograflari tekrar secip sonra ilana devam et.')
    }
  }

  return { photos, uploadedPaths }
}

async function cleanupUploadedListingPhotos(paths) {
  if (!supabase || !Array.isArray(paths) || !paths.length) {
    return
  }

  try {
    await supabase.storage.from(LISTING_BUCKET).remove(paths)
  } catch {
    // no-op
  }
}

export function AppStateProvider({ children }) {
  const [uiState, setUiState] = useState(() => loadUiState())
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [authFlow, setAuthFlow] = useState(null)
  const [remoteListings, setRemoteListings] = useState([])
  const [messageRows, setMessageRows] = useState([])
  const [blockedUsers, setBlockedUsers] = useState([])

  useEffect(() => {
    persistUiState(uiState)
  }, [uiState])

  const fetchProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data
  }, [])

  const ensureProfile = useCallback(async (authUser) => {
    if (!supabase || !authUser) {
      return null
    }

    const existingProfile = await fetchProfile(authUser.id)
    const metadata = authUser.user_metadata || {}
    const preferredName = normalizeDisplayText(metadata.full_name || metadata.name || metadata.username)
    const preferredUsername =
      normalizeDisplayText(metadata.username || metadata.full_name || metadata.name)
      || normalizeDisplayText(authUser.email?.split('@')[0] || '')
      || 'kullanici'
    const preferredAvatar = metadata.avatar_url || metadata.picture || null

    if (existingProfile) {
      const nextProfilePayload = {
        ...existingProfile,
        id: authUser.id,
        email: authUser.email || existingProfile.email || '',
        username: existingProfile.username || preferredUsername,
        full_name: preferredName || existingProfile.full_name || existingProfile.username || preferredUsername,
        avatar_url: existingProfile.avatar_url || preferredAvatar,
      }

      const { error: syncError } = await supabase.from('profiles').upsert(nextProfilePayload)
      if (!syncError) {
        return fetchProfile(authUser.id)
      }

      return existingProfile
    }

    const fallback = buildFallbackProfile(authUser)
    const insertPayload = {
      id: authUser.id,
      email: authUser.email || '',
      username: preferredUsername || fallback.username,
      full_name: preferredName || fallback.full_name,
      phone: fallback.phone || null,
      city: fallback.city,
      avatar_url: preferredAvatar || fallback.avatar_url || null,
      phone_verified: false,
    }

    const { error } = await supabase.from('profiles').upsert(insertPayload)

    if (error) {
      return fallback
    }

    return fetchProfile(authUser.id)
  }, [fetchProfile])

  const safeEnsureProfile = useCallback(async (authUser) => {
    if (!authUser) {
      return null
    }

    try {
      return await withTimeout(
        ensureProfile(authUser),
        'Profil bilgileri zamaninda alinamadi.',
      )
    } catch {
      return buildFallbackProfile(authUser)
    }
  }, [ensureProfile])

  const refreshVerifiedSeller = useCallback(async (userId) => {
    if (!supabase || !userId) {
      return null
    }

    const { data, error } = await supabase.rpc('refresh_verified_seller', {
      target_user_id: userId,
    })

    if (error) {
      throw error
    }

    return data
  }, [])

  const touchLastSeen = useCallback(async (userId) => {
    if (!supabase || !userId) {
      return
    }

    await supabase.rpc('touch_last_seen', {
      target_user_id: userId,
    })
  }, [])

  const refreshListings = useCallback(async () => {
    if (!supabase) {
      return []
    }

    const { data, error } = await withTimeout(
      supabase
        .from('listings')
        .select(`
          id,
          owner_id,
          owner_name,
          owner_username,
          owner_phone,
          owner_avatar_url,
          title,
          brand,
          model,
          cc,
          year,
          km,
          price,
          city,
          plate_masked,
          description,
          photos,
          cover_photo_index,
          created_at,
          updated_at
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false }),
      'Ilanlar alinirken zaman asimina ugradi.',
      15000,
    )

    if (error) {
      throw error
    }

    const normalized = (data || []).map(normalizeListingRecord)
    setRemoteListings(normalized)
    return normalized
  }, [])

  const refreshMessageRows = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setMessageRows([])
      return []
    }

    const { data, error } = await withTimeout(
      supabase
        .from('message_requests')
        .select(`
          id,
          listing_id,
          sender_id,
          recipient_id,
          sender_name,
          recipient_name,
          listing_title,
          note,
          status,
          created_at
        `)
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false }),
      'Mesajlar alinirken zaman asimina ugradi.',
      15000,
    )

    if (error) {
      throw error
    }

    setMessageRows(data || [])
    return data || []
  }, [])

  const refreshBlockedUsers = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setBlockedUsers([])
      return []
    }

    const { data, error } = await withTimeout(
      supabase
        .from('user_blocks')
        .select('id, blocked_id, blocked_name, created_at')
        .eq('blocker_id', userId)
        .order('created_at', { ascending: false }),
      'Engellenen kullanicilar alinirken zaman asimi olustu.',
      15000,
    )

    if (error) {
      throw error
    }

    setBlockedUsers(data || [])
    return data || []
  }, [])

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let alive = true

    const bootstrap = async () => {
      let activeSession = null

      try {
        const pendingAuthCallback = hasPendingAuthCallback()
        const {
          data: { session: bootSession },
        } = await withTimeout(
          supabase.auth.getSession(),
          'Oturum bilgisi alinirken zaman asimi olustu.',
        )

        activeSession = bootSession

        if (!alive) {
          return
        }

        if (!activeSession?.user && pendingAuthCallback) {
          setTimeout(() => {
            if (alive) {
              setAuthReady(true)
            }
          }, 1800)
          return
        }
      } catch {
        if (alive) {
          setSession(null)
          setProfile(null)
          setAuthReady(true)
        }
        return
      }

      if (!alive) {
        return
      }

      setSession(activeSession)

      try {
        await refreshListings()
      } catch {
        setRemoteListings([])
      }

      setAuthReady(true)

      if (activeSession?.user) {
        const nextProfile = await safeEnsureProfile(activeSession.user)
        if (alive) {
          setProfile(nextProfile)
        }

        touchLastSeen(activeSession.user.id).catch(() => {})
        refreshVerifiedSeller(activeSession.user.id).catch(() => {})

        try {
          await refreshMessageRows(activeSession.user.id)
        } catch {
          setMessageRows([])
        }

        try {
          await refreshBlockedUsers(activeSession.user.id)
        } catch {
          setBlockedUsers([])
        }
      } else {
        setProfile(null)
        setMessageRows([])
        setBlockedUsers([])
      }
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!alive) {
        return
      }

      setAuthFlow(event === 'PASSWORD_RECOVERY' ? 'recovery' : null)
      setSession(nextSession)
      setAuthReady(true)

      try {
        await refreshListings()
      } catch {
        setRemoteListings([])
      }

      if (nextSession?.user) {
        const nextProfile = await safeEnsureProfile(nextSession.user)
        if (alive) {
          setProfile(nextProfile)
        }

        touchLastSeen(nextSession.user.id).catch(() => {})
        refreshVerifiedSeller(nextSession.user.id).catch(() => {})

        try {
          await refreshMessageRows(nextSession.user.id)
        } catch {
          setMessageRows([])
        }

        try {
          await refreshBlockedUsers(nextSession.user.id)
        } catch {
          setBlockedUsers([])
        }
      } else {
        setProfile(null)
        setMessageRows([])
        setBlockedUsers([])
      }
    })

    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [refreshBlockedUsers, refreshListings, refreshMessageRows, refreshVerifiedSeller, safeEnsureProfile, touchLastSeen])

  useEffect(() => {
    if (!session?.user?.id) {
      return undefined
    }

    const markActive = () => {
      touchLastSeen(session.user.id).catch(() => {})
    }

    markActive()

    const intervalId = setInterval(markActive, 120000)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        markActive()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [session?.user?.id, touchLastSeen])

  const resolveLoginEmail = useCallback(async (identifier) => {
    const trimmed = `${identifier || ''}`.trim()

    if (isValidEmail(trimmed)) {
      return trimmed.toLowerCase()
    }

    if (!supabase) {
      throw new Error('Supabase ayarlanmadan giris yapilamaz.')
    }

    const { data, error } = await withTimeout(
      supabase.rpc('resolve_login_email', {
        identifier_input: trimmed,
      }),
      'Kullanici bilgisi kontrol edilirken zaman asimi olustu.',
    )

    if (error) {
      throw new Error(normalizeSupabaseError(error, 'Kullanici bilgisi cozumlenemedi.'))
    }

    if (data) {
      return data
    }

    throw new Error('Bu kullanici adi, mail ya da telefon ile eslesen bir hesap bulunamadi.')
  }, [])

  const user = useMemo(() => buildUserViewModel(session?.user, profile), [profile, session?.user])

  const allListings = useMemo(() => {
    const source = isSupabaseConfigured ? remoteListings : uiState.draftListings
    return [...source.map(normalizeListingRecord), ...featuredBikes.map(normalizeListingRecord)]
  }, [remoteListings, uiState.draftListings])

  const userListings = useMemo(() => {
    if (!session?.user) {
      return []
    }

    return allListings.filter((item) => item.ownerId === session.user.id)
  }, [allListings, session?.user])

  const messageItems = useMemo(
    () => messageRows.map((row) => buildMessageRecord(row, session?.user?.id)),
    [messageRows, session?.user?.id],
  )

  const messageRequests = useMemo(
    () => messageItems.filter((item) => item.status === 'pending'),
    [messageItems],
  )

  const activeChats = useMemo(
    () => messageItems.filter((item) => item.status === 'approved'),
    [messageItems],
  )

  const notifications = useMemo(() => {
    const currentUserId = session?.user?.id

    if (!currentUserId) {
      return []
    }

    return messageItems
      .filter((item) => item.isIncoming && item.status === 'pending')
      .map((item) => ({
        id: item.id,
        title: 'Yeni mesaj istegi',
        body: `${item.otherUser} sana "${item.title}" ilanı icin mesaj istegi gonderdi.`,
        href: '/mesajlar',
        unread: !uiState.readNotificationIds.includes(item.id),
        createdAt: item.createdAt,
      }))
  }, [messageItems, session?.user?.id, uiState.readNotificationIds])

  const blockedUserIds = useMemo(
    () => blockedUsers.map((item) => item.blocked_id),
    [blockedUsers],
  )

  const authConfigured = isSupabaseConfigured

  const value = useMemo(() => ({
    ...uiState,
    activeChats,
    allListings,
    authConfigured,
    authFlow,
    authReady,
    blockedUsers,
    isAuthenticated: Boolean(session?.user),
    isAdmin: user?.role === 'admin',
    messageRequests,
    notifications,
    session,
    user,
    userListings,
    async login(payload) {
      if (!supabase) {
        throw new Error('Supabase baglantisi eksik. Once .env ayarlarini tamamla.')
      }

      const identifier = typeof payload === 'string' ? payload : payload.identifier
      const password = typeof payload === 'string' ? '' : payload.password

      if (!identifier || !password) {
        throw new Error('Giris icin kullanici adi, mail ya da telefon ve sifre gerekli.')
      }

      try {
        const email = await resolveLoginEmail(identifier)
        const { error } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          'Giris istegi zaman asimina ugradi.',
        )

        if (error) {
          throw error
        }
      } catch (error) {
        throw new Error(normalizeSupabaseError(error, 'Giris sirasinda bir sorun olustu.'))
      }
    },
    async register(payload) {
      if (!supabase) {
        throw new Error('Supabase baglantisi eksik. Once .env ayarlarini tamamla.')
      }

      const appBaseUrl = getAppBaseUrl()
      const name = normalizeDisplayText(payload.name)
      const email = `${payload.email || ''}`.trim().toLowerCase()
      const phone = normalizePhone(payload.phone)
      const password = `${payload.password || ''}`
      const confirmPassword = `${payload.confirmPassword || ''}`

      if (name.length < 3) {
        throw new Error('Kullanici adi en az 3 karakter olmali.')
      }

      if (!isValidEmail(email)) {
        throw new Error('Gecerli bir e-posta adresi gir.')
      }

      if (password.length < 6) {
        throw new Error('Sifre en az 6 karakter olmali.')
      }

      if (password !== confirmPassword) {
        throw new Error('Sifreler birbiriyle eslesmiyor.')
      }

      try {
        const { error } = await withTimeout(
          supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${appBaseUrl}/giris?verified=1`,
              data: {
                username: name,
                full_name: name,
                phone,
              },
            },
          }),
          'Kayit istegi zaman asimina ugradi.',
        )

        if (error) {
          throw error
        }
      } catch (error) {
        throw new Error(normalizeSupabaseError(error, 'Kayit sirasinda bir sorun olustu.'))
      }

      return {
        requiresEmailVerification: true,
        email,
      }
    },
    async signInWithGoogle() {
      if (!supabase) {
        throw new Error('Supabase baglantisi eksik. Once .env ayarlarini tamamla.')
      }

      const appBaseUrl = getAppBaseUrl()

      try {
        const { error } = await withTimeout(
          supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${appBaseUrl}/profil`,
            },
          }),
          'Google girisi baslatilirken zaman asimi olustu.',
        )

        if (error) {
          throw error
        }
      } catch (error) {
        throw new Error(normalizeSupabaseError(error, 'Google ile giris baslatilamadi.'))
      }
    },
    async resendVerificationEmail(email) {
      if (!supabase) {
        throw new Error('Supabase baglantisi eksik. Once .env ayarlarini tamamla.')
      }

      const appBaseUrl = getAppBaseUrl()
      const targetEmail = email || session?.user?.email

      if (!targetEmail) {
        throw new Error('Dogrulama maili icin once hesabin e-postasi gerekli.')
      }

      try {
        const { error } = await withTimeout(
          supabase.auth.resend({
            type: 'signup',
            email: targetEmail,
            options: {
              emailRedirectTo: `${appBaseUrl}/giris?verified=1`,
            },
          }),
          'Dogrulama maili gonderilirken zaman asimi olustu.',
        )

        if (error) {
          throw error
        }
      } catch (error) {
        throw new Error(normalizeSupabaseError(error, 'Dogrulama maili tekrar gonderilemedi.'))
      }
    },
    async sendPasswordReset(identifier) {
      if (!supabase) {
        throw new Error('Supabase baglantisi eksik. Once .env ayarlarini tamamla.')
      }

      const appBaseUrl = getAppBaseUrl()

      try {
        const email = await resolveLoginEmail(identifier)
        const { error } = await withTimeout(
          supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${appBaseUrl}/sifre-sifirla`,
          }),
          'Sifre sifirlama istegi zaman asimina ugradi.',
        )

        if (error) {
          throw error
        }

        return email
      } catch (error) {
        throw new Error(normalizeSupabaseError(error, 'Sifre sifirlama maili gonderilemedi.'))
      }
    },
    async updatePassword(nextPassword) {
      if (!supabase) {
        throw new Error('Supabase baglantisi eksik. Once .env ayarlarini tamamla.')
      }

      try {
        const { error } = await withTimeout(
          supabase.auth.updateUser({ password: nextPassword }),
          'Sifre guncellenirken zaman asimi olustu.',
        )

        if (error) {
          throw error
        }
      } catch (error) {
        throw new Error(normalizeSupabaseError(error, 'Sifre guncellenemedi.'))
      }
    },
    async updateProfile(payload) {
      if (!supabase || !session?.user) {
        throw new Error('Profil guncellemek icin oturum acman gerekiyor.')
      }

      const username = normalizeDisplayText(payload.username)
      const city = normalizeDisplayText(payload.city)
      const phone = normalizePhone(payload.phone)
      const sellerBio = normalizeDisplayText(payload.sellerBio)
      let avatarUrl = profile?.avatar_url || ''

      if (payload.avatarFile) {
        validateImageFile(payload.avatarFile)
        const extension = payload.avatarFile.name.split('.').pop() || 'jpg'
        const filePath = `${session.user.id}/avatar-${Date.now()}.${extension}`
        const { error: uploadError } = await withTimeout(
          supabase.storage.from('avatars').upload(filePath, payload.avatarFile, {
            upsert: true,
            contentType: payload.avatarFile.type,
          }),
          'Profil fotografi yuklenirken zaman asimi olustu.',
          20000,
        )

        if (uploadError) {
          throw uploadError
        }

        const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath)
        avatarUrl = publicData.publicUrl
      }

      if (username.length < 3) {
        throw new Error('Kullanici adi en az 3 karakter olmali.')
      }

      const updatePayload = {
        id: session.user.id,
        email: session.user.email || profile?.email || '',
        username,
        full_name: username,
        city: city || 'Istanbul',
        phone,
        seller_bio: sellerBio || null,
        avatar_url: avatarUrl || null,
        phone_verified: phone && phone === profile?.phone ? profile?.phone_verified ?? false : false,
      }

      const { error } = await withTimeout(
        supabase.from('profiles').upsert(updatePayload),
        'Profil kaydi zaman asimina ugradi.',
      )

      if (error) {
        throw error
      }

      const optimisticProfile = {
        ...profile,
        ...updatePayload,
        created_at: profile?.created_at || session.user.created_at || new Date().toISOString(),
      }

      setProfile(optimisticProfile)

      supabase.auth.updateUser({
        data: {
          username,
          full_name: username,
          phone,
          city: city || 'Istanbul',
          seller_bio: sellerBio || null,
          avatar_url: avatarUrl || null,
        },
      }).catch(() => {})

      fetchProfile(session.user.id)
        .then((nextProfile) => {
          if (nextProfile) {
            setProfile(nextProfile)
          }
        })
        .catch(() => {})

      refreshVerifiedSeller(session.user.id)
        .then((nextProfile) => {
          if (nextProfile) {
            setProfile(nextProfile)
          }
        })
        .catch(() => {})

      return optimisticProfile
    },
    async refreshProfile() {
      if (!session?.user) {
        return null
      }

      try {
        const nextProfile = await withTimeout(
          fetchProfile(session.user.id),
          'Profil bilgileri yenilenirken zaman asimi olustu.',
        )
        setProfile(nextProfile)
        return nextProfile
      } catch {
        return profile || null
      }
    },
    async submitSupportMessage(payload) {
      if (!supabase || !session?.user || !user) {
        throw new Error('Mesaj gondermek icin once hesabina giris yapman gerekiyor.')
      }

      const message = `${payload.message || ''}`.trim()
      const nameSnapshot = normalizeDisplayText(payload.name || user.name)
      const emailSnapshot = `${payload.email || user.email || ''}`.trim()
      const subject = `${payload.subject || ''}`.trim()
      const rating = `${payload.rating || ''}`.trim()

      if (!message) {
        throw new Error('Mesaj alani bos birakilamaz.')
      }

      if (emailSnapshot && !isValidEmail(emailSnapshot)) {
        throw new Error('Gecerli bir e-posta adresi girmen gerekiyor.')
      }

      try {
        const { error } = await withTimeout(
          supabase.from('support_messages').insert({
            user_id: session.user.id,
            kind: payload.kind,
            name_snapshot: nameSnapshot || null,
            email_snapshot: emailSnapshot || null,
            subject: subject || null,
            message,
            rating: rating || null,
          }),
          'Mesaj gonderilirken zaman asimi olustu.',
        )

        if (error) {
          throw error
        }
      } catch (error) {
        throw new Error(normalizeSupabaseError(error, 'Mesaj gonderilemedi.'))
      }
    },
    async logout() {
      const finalizeLogout = () => {
        clearAuthArtifactsFromUrl()

        if (typeof window !== 'undefined') {
          const authStorageKeys = []

          for (let index = 0; index < window.localStorage.length; index += 1) {
            const key = window.localStorage.key(index)
            if (key && key.startsWith('sb-') && key.includes('-auth-token')) {
              authStorageKeys.push(key)
            }
          }

          authStorageKeys.forEach((key) => {
            window.localStorage.removeItem(key)
          })

          for (let index = 0; index < window.sessionStorage.length; index += 1) {
            const key = window.sessionStorage.key(index)
            if (key && key.startsWith('sb-') && key.includes('-auth-token')) {
              window.sessionStorage.removeItem(key)
            }
          }
        }

        setSession(null)
        setProfile(null)
        setAuthFlow(null)
        setAuthReady(true)
        setMessageRows([])
      }

      if (!supabase) {
        finalizeLogout()
        return
      }

      const { error } = await supabase.auth.signOut()

      if (error) {
        const { error: localError } = await supabase.auth.signOut({ scope: 'local' })

        if (localError) {
          throw new Error(normalizeSupabaseError(localError, error.message))
        }
      }

      finalizeLogout()
    },
    toggleFavorite(listingId) {
      setUiState((current) => {
        const exists = current.favorites.includes(listingId)

        return {
          ...current,
          favorites: exists
            ? current.favorites.filter((item) => item !== listingId)
            : [...current.favorites, listingId],
        }
      })
    },
    toggleComparison(listingId) {
      let didSucceed = true

      setUiState((current) => {
        const exists = current.comparisons.includes(listingId)

        if (exists) {
          return {
            ...current,
            comparisons: current.comparisons.filter((item) => item !== listingId),
          }
        }

        if (current.comparisons.length >= 2) {
          didSucceed = false
          return current
        }

        return {
          ...current,
          comparisons: [...current.comparisons, listingId],
        }
      })

      return didSucceed
    },
    async sendMessageRequest(listing) {
      if (!supabase || !session?.user || !user) {
        throw new Error('Mesaj gondermek icin once giris yapmalisin.')
      }

      if (!listing?.id || !listing?.ownerId) {
        throw new Error('Ilan bilgisi eksik oldugu icin mesaj istegi olusturulamadi.')
      }

      if (listing.ownerId === session.user.id) {
        throw new Error('Kendi ilanina mesaj istegi gonderemezsin.')
      }

      const { error } = await withTimeout(
        supabase.from('message_requests').insert({
          listing_id: listing.id,
          sender_id: session.user.id,
          recipient_id: listing.ownerId,
          sender_name: user.name,
          recipient_name: listing.owner || 'Satici',
          listing_title: listing.title,
          note: '',
          status: 'pending',
        }),
        'Mesaj istegi gonderilirken zaman asimi olustu.',
      )

      if (error) {
        throw new Error(normalizeSupabaseError(error, 'Mesaj istegi gonderilemedi.'))
      }

      await refreshMessageRows(session.user.id)
      return true
    },
    async blockUser(targetUser) {
      if (!supabase || !session?.user || !user) {
        throw new Error('Kullanici engellemek icin once giris yapmalisin.')
      }

      if (!targetUser?.id) {
        throw new Error('Engellenecek kullanici bilgisi eksik.')
      }

      if (targetUser.id === session.user.id) {
        throw new Error('Kendini engelleyemezsin.')
      }

      const { error } = await withTimeout(
        supabase.from('user_blocks').insert({
          blocker_id: session.user.id,
          blocked_id: targetUser.id,
          blocked_name: targetUser.name || targetUser.username || 'Kullanici',
        }),
        'Kullanici engellenirken zaman asimi olustu.',
      )

      if (error) {
        throw new Error(normalizeSupabaseError(error, 'Kullanici engellenemedi.'))
      }

      await refreshBlockedUsers(session.user.id)
    },
    async unblockUser(blockId) {
      if (!supabase || !session?.user) {
        throw new Error('Kullanici engelini kaldirmak icin once giris yapmalisin.')
      }

      const { error } = await withTimeout(
        supabase.from('user_blocks').delete().eq('id', blockId).eq('blocker_id', session.user.id),
        'Kullanici engeli kaldirilirken zaman asimi olustu.',
      )

      if (error) {
        throw new Error(normalizeSupabaseError(error, 'Kullanici engeli kaldirilamadi.'))
      }

      await refreshBlockedUsers(session.user.id)
    },
    async reportListing(payload) {
      if (!supabase || !session?.user) {
        throw new Error('Ilan bildirmek icin once giris yapmalisin.')
      }

      if (!payload?.listingId || !payload?.ownerId || !payload?.reason) {
        throw new Error('Ilan bildirme bilgileri eksik.')
      }

      if (payload.ownerId === session.user.id) {
        throw new Error('Kendi ilanini bildiremezsin.')
      }

      const { error } = await withTimeout(
        supabase.from('listing_reports').insert({
          listing_id: payload.listingId,
          reporter_id: session.user.id,
          listing_owner_id: payload.ownerId,
          reason: payload.reason,
          details: `${payload.details || ''}`.trim() || null,
        }),
        'Ilan bildirilirken zaman asimi olustu.',
      )

      if (error) {
        throw new Error(normalizeSupabaseError(error, 'Ilan bildirilemedi.'))
      }
    },
    isUserBlocked(targetUserId) {
      return blockedUserIds.includes(targetUserId)
    },
    markNotificationsRead() {
      setUiState((current) => ({
        ...current,
        readNotificationIds: [
          ...new Set([
            ...current.readNotificationIds,
            ...notifications.map((item) => item.id),
          ]),
        ],
      }))
    },
    saveDraftListing(payload) {
      const draftId = payload.id || `draft-${Date.now()}`

      setUiState((current) => {
        const record = normalizeDraftListing({
          ...payload,
          id: draftId,
          badge: 'Taslak',
          updatedAt: 'Az once',
        })
        const existingIndex = current.draftListings.findIndex((item) => item.id === draftId)

        if (existingIndex >= 0) {
          const nextDrafts = [...current.draftListings]
          nextDrafts[existingIndex] = record

          return {
            ...current,
            draftListings: nextDrafts,
          }
        }

        return {
          ...current,
          draftListings: [record, ...current.draftListings],
        }
      })

      return draftId
    },
    async publishDraftListing(draftId) {
      const draft = uiState.draftListings.find((item) => item.id === draftId)

      if (!draft) {
        throw new Error('Taslak bulunamadi.')
      }

      return value.publishListing(draft, draft.selectedPhotos)
    },
    async publishListing(payload, photoEntries = []) {
      if (!supabase || !session?.user || !user) {
        throw new Error('Ilan vermek icin once giris yapman gerekiyor.')
      }

      const brand = normalizeDisplayText(payload.brand)
      const model = normalizeDisplayText(payload.model)
      const city = normalizeDisplayText(payload.city)
      const description = normalizeDisplayText(payload.description)

      if (!brand || !model || !city) {
        throw new Error('Marka, model ve sehir alanlari zorunlu.')
      }

      let uploadedPaths = []

      try {
        const { photos, uploadedPaths: newUploadedPaths } = await uploadListingPhotos(
          photoEntries,
          session.user.id,
        )

        uploadedPaths = newUploadedPaths

        const coverPhotoIndex = photos.length
          ? Math.min(Math.max(Number(payload.coverPhotoIndex) || 0, 0), photos.length - 1)
          : 0

        const insertPayload = {
          owner_id: session.user.id,
          owner_name: user.name,
          owner_username: user.username,
          owner_phone: user.phone || null,
          owner_avatar_url: user.avatarUrl || null,
          owner_is_verified_seller: Boolean(user.isVerifiedSeller),
          title: normalizeDisplayText(payload.title) || `${brand} ${model}`.trim(),
          brand,
          model,
          cc: normalizeDisplayText(payload.cc),
          year: normalizeDisplayText(payload.year),
          km: normalizeDisplayText(payload.km),
          price: normalizeDisplayText(payload.price),
          city,
          plate_masked: asText(payload.plateMasked, 'Plaka yok'),
          description: description || 'Aciklama eklenmedi.',
          photos,
          cover_photo_index: coverPhotoIndex,
          status: 'published',
        }

        const { data, error } = await withTimeout(
          supabase
            .from('listings')
            .insert(insertPayload)
            .select('id')
            .single(),
          'Ilan kaydi yapilirken zaman asimi olustu.',
          20000,
        )

        if (error) {
          throw error
        }

        await refreshListings()
        const refreshedProfile = await refreshVerifiedSeller(session.user.id).catch(() => null)

        if (refreshedProfile) {
          setProfile(refreshedProfile)
          await refreshListings()
        }

        if (payload.id) {
          setUiState((current) => ({
            ...current,
            draftListings: current.draftListings.filter((item) => item.id !== payload.id),
          }))
        }

        return data.id
      } catch (error) {
        if (uploadedPaths.length) {
          await cleanupUploadedListingPhotos(uploadedPaths)
        }

        throw new Error(normalizeSupabaseError(error, 'Ilan yayinlanamadi.'))
      }
    },
  }), [
    activeChats,
    allListings,
    authConfigured,
    authFlow,
    authReady,
    blockedUserIds,
    blockedUsers,
    fetchProfile,
    messageRequests,
    notifications,
    profile,
    refreshBlockedUsers,
    refreshListings,
    refreshMessageRows,
    refreshVerifiedSeller,
    resolveLoginEmail,
    session,
    uiState,
    user,
    userListings,
  ])

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
