import { Navigate, useLocation } from 'react-router-dom'
import { useAppState } from '../context/useAppState'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated } = useAppState()

  if (!isAuthenticated) {
    return <Navigate to="/kayit-ol" replace state={{ from: location.pathname }} />
  }

  return children
}

export default ProtectedRoute
