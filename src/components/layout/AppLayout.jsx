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
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import usePortfolio from '../../hooks/usePortfolio'

export default function AppLayout() {
  const { signOut, profile } = useAuth()
  const { team } = usePortfolio()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

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
          <span className="font-extrabold text-lg text-white tracking-tight">app_carteira</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-900/60 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
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
        fixed md:sticky top-0 left-0 z-50 h-screen flex flex-col justify-between
        glass-card border-r border-white/5 p-4 transition-all duration-300 ease-in-out
        ${collapsed ? 'md:w-20' : 'md:w-72'}
        ${mobileOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          
          {/* Logo / Brand + Collapse Button */}
          <div className="flex items-center justify-between px-1 pt-2">
            {!collapsed ? (
              <span className="font-black text-xl text-white tracking-tight block truncate">
                app_carteira
              </span>
            ) : (
              <span className="font-black text-base text-indigo-400 block mx-auto">
                AC
              </span>
            )}

            {/* Desktop Collapse Toggle Button */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              className="hidden md:flex p-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* User / Team Quick Widget (Only shown when expanded) */}
          {!collapsed && (
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
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) => `
                    flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3.5 px-4'} py-3 rounded-xl font-bold text-sm transition-all
                    ${isActive 
                      ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-500/80 text-white shadow-lg shadow-indigo-600/20 border border-indigo-400/30' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.03]'
                    }
                  `}
                >
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          {!collapsed && (
            <div className="px-2 flex items-center gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-slate-300">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate flex-1">
                <div className="text-xs font-bold text-white truncate">{profile?.name || 'Participante'}</div>
                <div className="text-[10px] text-slate-500 truncate">{profile?.role === 'admin' ? 'Administrador' : 'Usuário'}</div>
              </div>
            </div>
          )}
          
          <button
            onClick={signOut}
            title={collapsed ? "Sair da Plataforma" : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center p-2.5' : 'justify-center gap-2 px-4 py-2.5'} rounded-xl bg-rose-950/20 hover:bg-rose-900/30 border border-rose-900/30 text-rose-400 font-bold text-xs transition-all cursor-pointer`}
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span>Sair</span>}
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
