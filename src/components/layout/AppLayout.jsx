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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#09090b] text-zinc-100">
      
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-[#111114] border-b border-zinc-800 px-5 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-sm tracking-tight text-zinc-100">app_carteira</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50 h-screen flex flex-col justify-between
        bg-[#111114] border-r border-zinc-800/80 p-3.5 transition-all duration-200 ease-in-out
        ${collapsed ? 'md:w-16' : 'md:w-64'}
        ${mobileOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-6">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-1">
            {!collapsed ? (
              <span className="font-semibold text-sm tracking-tight text-zinc-100 truncate">
                app_carteira
              </span>
            ) : null}

            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expandir" : "Recolher"}
              className={`p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-colors cursor-pointer ${collapsed ? 'mx-auto' : 'hidden md:flex'}`}
            >
              {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>

          {/* Account Overview Widget (when expanded) */}
          {!collapsed && (
            <div className="bg-[#18181b] border border-zinc-800 rounded-md p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500 font-medium">Equipe</span>
                <span className="text-zinc-400 font-medium">
                  {profile?.role === 'admin' ? 'Administrador' : 'Participante'}
                </span>
              </div>
              <div className="font-semibold text-sm text-zinc-100 truncate">
                {team?.name || profile?.name || 'Equipe'}
              </div>
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-zinc-500 text-[11px]">Patrimônio</span>
                <span className="font-mono-nums font-semibold text-emerald-400">
                  {formatBRL(team?.net_worth || 10000000)}
                </span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
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
                    flex items-center ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2'} rounded-md text-xs font-medium transition-colors
                    ${isActive 
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
                    }
                  `}
                >
                  <Icon size={16} strokeWidth={1.5} className="shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 space-y-2">
          {!collapsed && (
            <div className="px-2 flex items-center justify-between text-xs">
              <div className="truncate">
                <div className="font-medium text-zinc-300 text-xs truncate">{profile?.name || 'Usuário'}</div>
                <div className="text-[11px] text-zinc-500 truncate">{profile?.role === 'admin' ? 'Admin' : 'Operador'}</div>
              </div>
            </div>
          )}
          
          <button
            onClick={signOut}
            title={collapsed ? "Encerrar Sessão" : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center p-2' : 'justify-center gap-2 px-3 py-1.5'} rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors cursor-pointer`}
          >
            <LogOut size={14} strokeWidth={1.5} className="shrink-0" />
            {!collapsed && <span>Encerrar Sessão</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 p-5 sm:p-8 lg:p-10">
        <Outlet />
      </div>

    </div>
  )
}
