export function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16L21 21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function FilterIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7H20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 12H17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 17H14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function HeartIcon({ filled = false }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M12 20.5L4.6 13.3A4.7 4.7 0 1 1 11 6.9L12 8l1-1.1a4.7 4.7 0 1 1 6.4 6.4z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CompareIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7 5V18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 5V18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3.5 18H10.5L7 5L3.5 18Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13.5 18H20.5L17 5L13.5 18Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

export function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7H20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 12H20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 17H20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function MessageIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5 6.5H19A2.5 2.5 0 0 1 21.5 9V15A2.5 2.5 0 0 1 19 17.5H11L6 21V17.5H5A2.5 2.5 0 0 1 2.5 15V9A2.5 2.5 0 0 1 5 6.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

export function ProfileIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 19C6.8 15.8 9 14.5 12 14.5S17.2 15.8 19 19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function LogoutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M10 5H7.5A2.5 2.5 0 0 0 5 7.5V16.5A2.5 2.5 0 0 0 7.5 19H10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8L18 12L14 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12H18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 5V19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 12H19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 20C14.8 16.7 17.5 13.7 17.5 10.2A5.5 5.5 0 1 0 6.5 10.2C6.5 13.7 9.2 16.7 12 20Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="1.8" fill="currentColor" />
    </svg>
  )
}

export function BikeLogoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="6" cy="17" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="17" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 17L13 10H17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 9H13.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.5 11.5L10 9L13 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StarIcon({ filled = false }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M12 3.8L14.6 9.1L20.4 9.9L16.2 14L17.2 19.8L12 17L6.8 19.8L7.8 14L3.6 9.9L9.4 9.1L12 3.8Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M5.5 7.5H18.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 7.5V5.8A1.8 1.8 0 0 1 10.8 4H13.2A1.8 1.8 0 0 1 15 5.8V7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.2 7.5L8 19A1.8 1.8 0 0 0 9.8 20.6H14.2A1.8 1.8 0 0 0 16 19L16.8 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11V16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 11V16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M21.81 12.23C21.81 11.41 21.74 10.63 21.6 9.88H12V13.8H17.49C17.25 15.07 16.54 16.14 15.48 16.86V19.41H18.76C20.68 17.64 21.81 15.03 21.81 12.23Z" fill="#4285F4" />
      <path d="M12 22C14.76 22 17.07 21.08 18.76 19.41L15.48 16.86C14.57 17.47 13.4 17.84 12 17.84C9.34 17.84 7.08 16.04 6.28 13.62H2.89V16.25C4.56 19.57 8 22 12 22Z" fill="#34A853" />
      <path d="M6.28 13.62C6.08 13.01 5.96 12.36 5.96 11.69C5.96 11.02 6.08 10.37 6.28 9.76V7.13H2.89C2.2 8.5 1.81 10.05 1.81 11.69C1.81 13.33 2.2 14.88 2.89 16.25L6.28 13.62Z" fill="#FBBC05" />
      <path d="M12 5.54C13.53 5.54 14.91 6.07 15.99 7.11L18.83 4.27C17.06 2.63 14.76 1.38 12 1.38C8 1.38 4.56 3.81 2.89 7.13L6.28 9.76C7.08 7.34 9.34 5.54 12 5.54Z" fill="#EA4335" />
    </svg>
  )
}
