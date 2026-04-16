import { Navigate, useLocation } from 'react-router-dom'
import { useAppState } from '../context/useAppState'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { authReady, isAuthenticated } = useAppState()

  if (!authReady) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/giris" replace state={{ from: location.pathname }} />
  }

  return children
}

export default ProtectedRoute
