import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../utils/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Target } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authApi.login(form)
      setAuth({ name: data.name, email: data.email, experienceLevel: data.experienceLevel, hasResume: data.hasResume }, data.token)
      toast.success(`Welcome back, ${data.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Target className="text-indigo-400" size={32} />
            <h1 className="text-3xl font-bold text-white">MockMate</h1>
          </div>
          <p className="text-slate-400">AI-Powered Mock Interviews</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPw ? 'text' : 'password'}
                  placeholder="••••••••" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})} required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
