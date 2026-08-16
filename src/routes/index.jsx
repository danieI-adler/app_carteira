import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Admin from '../pages/Admin'
import Market from '../pages/Market'
import Ranking from '../pages/Ranking'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/mercado" element={<Market />} />
      <Route path="/ranking" element={<Ranking />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
