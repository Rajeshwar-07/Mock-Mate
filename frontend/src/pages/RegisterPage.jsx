import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../utils/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Target } from 'lucide-react'

const LEVELS = [
  { value: 'FRESHER', label: 'Fresher', desc: '0-1 year' },
  { value: 'JUNIOR', label: 'Junior', desc: '1-2 years' },
  { value: 'MID', label: 'Mid-Level', desc: '2-4 years' },
  { value: 'SENIOR', label: 'Senior', desc: '4+ years' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', experienceLevel: 'FRESHER', targetRole: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authApi.register(form)
      setAuth({ name: data.name, email: data.email, experienceLevel: data.experienceLevel, hasResume: false }, data.token)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.email || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Target className="text-indigo-400" size={32} />
            <h1 className="text-3xl font-bold text-white">MockMate</h1>
          </div>
          <p className="text-slate-400">Create your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="John Doe" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Min. 6 characters" value={form.password}
                onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
            </div>
            <div>
              <label className="label">Experience Level</label>
              <div className="grid grid-cols-2 gap-2">
                {LEVELS.map(l => (
                  <button key={l.value} type="button"
                    onClick={() => setForm({...form, experienceLevel: l.value})}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      form.experienceLevel === l.value
                        ? 'border-indigo-500 bg-indigo-900/40 text-white'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}>
                    <div className="font-medium text-sm">{l.label}</div>
                    <div className="text-xs opacity-70">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Target Role <span className="text-slate-500">(optional)</span></label>
              <input className="input" placeholder="e.g. Backend Developer" value={form.targetRole}
                onChange={e => setForm({...form, targetRole: e.target.value})} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
