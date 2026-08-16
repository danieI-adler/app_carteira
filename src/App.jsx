import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes'
import DbConfigModal from './components/ui/DbConfigModal'

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <DbConfigModal />
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}

export default App
