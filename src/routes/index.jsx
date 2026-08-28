import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import Dashboard from '../pages/Dashboard'
import Admin from '../pages/Admin'
import Market from '../pages/Market'
import Ranking from '../pages/Ranking'
import Analytics from '../pages/Analytics'
import Login from '../pages/Login'

// Wrapper component to guard authenticated routes
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}

// Wrapper component to guard admin-only routes
function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Authenticated Layout with Sidebar Navigation */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/mercado" element={<Market />} />
        <Route path="/graficos" element={<Analytics />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
