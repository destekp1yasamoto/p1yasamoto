import { useEffect, useMemo, useState } from 'react'
import { AppStateContext } from './AppStateContext'
import { featuredBikes } from '../data/featuredBikes'

const STORAGE_KEY = 'p1yasamoto-app-state'

const defaultState = {
  isAuthenticated: false,
  user: null,
  favorites: [],
  comparisons: [],
  messageRequests: [],
  activeChats: [],
  notifications: [],
  draftListings: [],
  userListings: [],
}

function buildDemoUser(identifier) {
  return {
    name: 'Omer',
    identifier,
    email: 'demohesapmoto@gmail.com',
    phone: '05xx xxx xx xx',
    city: 'Istanbul',
    joinedAt: "Nisan 2026'dan beri",
    isDemo: true,
    verified: {
      email: false,
      phone: false,
    },
  }
}

function loadState() {
  if (typeof window === 'undefined') {
    return defaultState
  }

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY)
    return rawState ? { ...defaultState, ...JSON.parse(rawState) } : defaultState
  } catch {
    return defaultState
  }
}

function formatTurkishDate() {
  const today = new Date()
  return `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`
}

function buildListingRecord(payload, id) {
  const visual = payload.visual || 'linear-gradient(135deg, #441111 0%, #1a1a1a 100%)'
  const year = payload.year || '2026'

  return {
    id,
    title: payload.title || `${payload.brand || 'Motor'} ${payload.model || ''}`.trim(),
    badge: payload.badge || 'Ilk Eklenen',
    price: payload.price || 'Fiyat girilmedi',
    tag: payload.tag || `${year} Model`,
    model: payload.model || 'Model',
    year,
    km: payload.km || '0 km',
    city: payload.city || 'Istanbul',
    owner: payload.owner || 'Satici',
    brand: payload.brand || 'Marka',
    phone: payload.phone || 'Telefon eklenmedi',
    plate: payload.plate || '',
    plateMasked: payload.plateMasked || 'Plaka yok',
    date: payload.date || formatTurkishDate(),
    description: payload.description || 'Aciklama eklenmedi.',
    visual,
    gallery: payload.gallery || [visual],
    photoCount: payload.selectedPhotos?.length || 0,
    selectedPhotos: payload.selectedPhotos || [],
    updatedAt: payload.updatedAt || 'Az once',
  }
}

function sanitizeState(state) {
  const builtInIds = featuredBikes.map((item) => item.id)
  const userListingIds = (state.userListings || []).map((item) => item.id)
  const validListingIds = new Set([...builtInIds, ...userListingIds])

  return {
    ...state,
    favorites: (state.favorites || []).filter((id) => validListingIds.has(id)),
    comparisons: (state.comparisons || []).filter((id) => validListingIds.has(id)),
    messageRequests: (state.messageRequests || []).filter((item) =>
      validListingIds.has(item.listingId),
    ),
  }
}

export function AppStateProvider({ children }) {
  const [state, setState] = useState(() => sanitizeState(loadState()))

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo(
    () => ({
      ...state,
      allListings: [...state.userListings, ...featuredBikes],
      login(identifier) {
        setState((current) => ({
          ...current,
          isAuthenticated: true,
          user: current.user
            ? { ...current.user, identifier }
            : buildDemoUser(identifier),
        }))
      },
      register(payload) {
        setState((current) => ({
          ...current,
          isAuthenticated: true,
          user: {
            name: payload.name || 'Yeni Uye',
            identifier: payload.email || payload.phone || payload.name,
            email: payload.email || 'ornek@mail.com',
            phone: payload.phone || '05xx xxx xx xx',
            city: payload.city || 'Istanbul',
            joinedAt: "Nisan 2026'dan beri",
            isDemo: false,
            verified: {
              email: false,
              phone: false,
            },
          },
        }))
      },
      logout() {
        setState((current) => ({
          ...current,
          isAuthenticated: false,
          user: null,
          comparisons: [],
          messageRequests: [],
          activeChats: [],
          notifications: [],
        }))
      },
      toggleFavorite(listingId) {
        setState((current) => {
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

        setState((current) => {
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
      sendMessageRequest(listing) {
        let didCreate = false

        setState((current) => {
          if (!current.isAuthenticated || !current.user) {
            return current
          }

          const existingRequest = current.messageRequests.find(
            (item) => item.listingId === listing.id && item.status === 'pending',
          )

          if (existingRequest) {
            return current
          }

          didCreate = true

          return {
            ...current,
            messageRequests: [
              {
                id: `request-${Date.now()}`,
                listingId: listing.id,
                title: listing.title,
                otherUser: listing.owner,
                preview: 'Mesaj istegin gonderildi, satici onayi bekleniyor.',
                status: 'pending',
                date: 'Az once',
              },
              ...current.messageRequests,
            ],
            notifications: [
              {
                id: `notification-${Date.now()}`,
                title: 'Mesaj istegi gonderildi',
                body: `${listing.title} ilani icin istegin saticiya ulasti.`,
                href: '/profil?tab=mesajlar',
                unread: true,
                createdAt: Date.now(),
              },
              ...current.notifications,
            ],
          }
        })

        return didCreate
      },
      markNotificationsRead() {
        setState((current) => {
          if (!current.notifications.some((item) => item.unread)) {
            return current
          }

          return {
            ...current,
            notifications: current.notifications.map((item) => ({
              ...item,
              unread: false,
            })),
          }
        })
      },
      saveDraftListing(payload) {
        const draftId = payload.id || `draft-${Date.now()}`

        setState((current) => {
          const record = buildListingRecord(
            {
              ...payload,
              owner: current.user?.name || 'Satici',
              phone: current.user?.phone || 'Telefon eklenmedi',
            },
            draftId,
          )
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
      publishDraftListing(draftId) {
        setState((current) => {
          const draft = current.draftListings.find((item) => item.id === draftId)

          if (!draft) {
            return current
          }

          return {
            ...current,
            draftListings: current.draftListings.filter((item) => item.id !== draftId),
            userListings: [
              {
                ...draft,
                id: `listing-${Date.now()}`,
                updatedAt: 'Az once yayina alindi',
                date: formatTurkishDate(),
              },
              ...current.userListings,
            ],
          }
        })
      },
      publishListing(payload) {
        const listingId = `listing-${Date.now()}`

        setState((current) => {
          const record = buildListingRecord(
            {
              ...payload,
              owner: current.user?.name || 'Satici',
              phone: current.user?.phone || 'Telefon eklenmedi',
            },
            listingId,
          )

          return {
            ...current,
            draftListings: payload.id
              ? current.draftListings.filter((item) => item.id !== payload.id)
              : current.draftListings,
            userListings: [
              {
                ...record,
                updatedAt: 'Az once yayina alindi',
              },
              ...current.userListings,
            ],
          }
        })

        return listingId
      },
    }),
    [state],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
