import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { Target, LayoutDashboard, History, LogOut, Plus, Shield } from 'lucide-react'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.email?.includes('admin') || user?.id === 1

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/history', label: 'History', icon: History },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: Shield }] : []),
  ]

  return (
    <nav className="bg-slate-900/80 backdrop-blur border-b border-slate-700/50 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Target className="text-indigo-400" size={22} />
          <span className="font-bold text-white">MockMate</span>
        </button>

        {/* Links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ path, label, icon: Icon }) => (
            <button key={path} onClick={() => navigate(path)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                location.pathname === path
                  ? path === '/admin'
                    ? 'bg-red-900/40 text-red-300'
                    : 'bg-indigo-900/40 text-indigo-300'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/setup')}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all">
            <Plus size={14} /> New Interview
          </button>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-700">
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-slate-400 text-sm hidden sm:block max-w-24 truncate">{user?.name?.split(' ')[0]}</span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
