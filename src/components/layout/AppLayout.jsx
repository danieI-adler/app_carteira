import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { 
  LayoutDashboard, 
  TrendingUp, 
  PieChart, 
  Trophy, 
  Shield, 
  LogOut, 
  Menu, 
  X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import usePortfolio from '../../hooks/usePortfolio'

export default function AppLayout() {
  const { signOut, profile } = useAuth()
  const { team } = usePortfolio()
  const [mobileOpen, setMobileOpen] = useState(false)

  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0)
  }

  const navItems = [
    { to: '/', label: 'Carteira', icon: LayoutDashboard, end: true },
    { to: '/mercado', label: 'Mercado', icon: TrendingUp },
    { to: '/graficos', label: 'Gráficos & Análise', icon: PieChart },
    { to: '/ranking', label: 'Classificação', icon: Trophy },
  ]

  if (profile?.role === 'admin') {
    navItems.push({ to: '/admin', label: 'Administração', icon: Shield })
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#030712] text-slate-100 relative">
      
      {/* Mobile Top Bar */}
      <header className="md:hidden glass-card sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-sm">
            B3
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight">app_carteira</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-72 flex flex-col justify-between
        glass-card border-r border-white/5 p-6 transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-8">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-500/20">
              B3
            </div>
            <div>
              <span className="font-black text-xl text-white tracking-tight block">app_carteira</span>
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest block">Simulador Pro</span>
            </div>
          </div>

          {/* User / Team Quick Widget */}
          <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Equipe</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-900/40">
                {profile?.role === 'admin' ? 'Admin' : 'Competidor'}
              </span>
            </div>
            <div className="font-extrabold text-white text-base truncate">
              {team?.name || profile?.name || 'Minha Equipe'}
            </div>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400">Patrimônio</span>
              <span className="font-bold text-emerald-400">{formatBRL(team?.net_worth || 10000000)}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all
                    ${isActive 
                      ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-500/80 text-white shadow-lg shadow-indigo-600/20 border border-indigo-400/30' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03]'
                    }
                  `}
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-white/5 space-y-3">
          <div className="px-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-slate-300">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate flex-1">
              <div className="text-xs font-bold text-white truncate">{profile?.name || 'Participante'}</div>
              <div className="text-[10px] text-slate-500 truncate">{profile?.role === 'admin' ? 'Administrador' : 'Usuário'}</div>
            </div>
          </div>
          
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/30 text-rose-400 font-bold text-xs transition-all cursor-pointer"
          >
            <LogOut size={15} />
            <span>Sair da Plataforma</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 p-4 sm:p-8 md:p-10">
        <Outlet />
      </div>

    </div>
  )
}
