import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../utils/api'
import Navbar from '../components/common/Navbar'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import {
  Users, Activity, Trash2, RefreshCw, Shield, BookOpen,
  CheckCircle, XCircle, TrendingUp, Calendar, ChevronRight
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value ?? '—'}</div>
        <div className="text-slate-400 text-sm">{label}</div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [interviews, setInterviews] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  // Only allow admin users (email ends with @mockmate.admin or first user)
  const isAdmin = user?.email?.includes('admin') || user?.id === 1

  useEffect(() => {
    if (!isAdmin) { navigate('/dashboard'); return }
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, interviewsRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getAllUsers(),
        adminApi.getAllInterviews(),
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
      setInterviews(interviewsRes.data)
    } catch (err) {
      toast.error('Failed to load admin data. Make sure you have admin access.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This will also delete all their interviews.`)) return
    setDeleting(`user-${id}`)
    try {
      await adminApi.deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      toast.success('User deleted')
    } catch { toast.error('Failed to delete user') }
    finally { setDeleting(null) }
  }

  const handleDeleteInterview = async (id) => {
    if (!confirm('Delete this interview?')) return
    setDeleting(`interview-${id}`)
    try {
      await adminApi.deleteInterview(id)
      setInterviews(prev => prev.filter(i => i.id !== id))
      toast.success('Interview deleted')
    } catch { toast.error('Failed to delete interview') }
    finally { setDeleting(null) }
  }

  if (!isAdmin) return null

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'interviews', label: 'Interviews', icon: BookOpen },
  ]

  const avgScore = interviews.length
    ? (interviews.filter(i => i.status === 'COMPLETED').reduce((s, i) => s + (i.score?.overallScore || 0), 0) /
       (interviews.filter(i => i.status === 'COMPLETED').length || 1)).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-900/30 rounded-xl">
                <Shield className="text-red-400" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <p className="text-slate-400 text-sm">MockMate system management</p>
              </div>
            </div>
          </div>
          <button onClick={loadData} disabled={loading}
            className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl mb-6 w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">
            <RefreshCw className="mx-auto animate-spin mb-3 text-indigo-400" size={32} />
            Loading admin data...
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Total Users" value={users.length} color="bg-indigo-600" />
                  <StatCard icon={BookOpen} label="Total Interviews" value={interviews.length} color="bg-purple-600" />
                  <StatCard icon={CheckCircle} label="Completed" value={interviews.filter(i => i.status === 'COMPLETED').length} color="bg-green-700" />
                  <StatCard icon={TrendingUp} label="Avg Score" value={avgScore ? `${avgScore}/10` : '—'} color="bg-orange-700" />
                </div>

                {/* Recent Activity */}
                <div className="card">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-indigo-400" /> Recent Interviews
                  </h2>
                  <div className="space-y-2">
                    {interviews.slice(0, 10).map(iv => (
                      <div key={iv.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className={`badge ${
                            iv.status === 'COMPLETED' ? 'bg-green-900/40 text-green-400' :
                            iv.status === 'IN_PROGRESS' ? 'bg-yellow-900/40 text-yellow-400' :
                            'bg-slate-700 text-slate-400'
                          }`}>{iv.status}</span>
                          <div>
                            <p className="text-slate-200 text-sm">{iv.userEmail || iv.userId}</p>
                            <p className="text-slate-500 text-xs">Round {iv.roundNumber} · {iv.interviewType}</p>
                          </div>
                        </div>
                        {iv.score?.overallScore != null && (
                          <span className={`text-sm font-bold ${iv.score.overallScore >= 7 ? 'text-green-400' : iv.score.overallScore >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {iv.score.overallScore.toFixed(1)}/10
                          </span>
                        )}
                      </div>
                    ))}
                    {interviews.length === 0 && (
                      <p className="text-slate-500 text-center py-6">No interviews yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4">
                  All Users ({users.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                        <th className="text-left pb-3 pr-4">ID</th>
                        <th className="text-left pb-3 pr-4">Name</th>
                        <th className="text-left pb-3 pr-4">Email</th>
                        <th className="text-left pb-3 pr-4">Level</th>
                        <th className="text-left pb-3 pr-4">Interviews</th>
                        <th className="text-left pb-3">Joined</th>
                        <th className="pb-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 pr-4 text-slate-500 text-sm">#{u.id}</td>
                          <td className="py-3 pr-4 text-slate-200 text-sm font-medium">{u.name}</td>
                          <td className="py-3 pr-4 text-slate-400 text-sm">{u.email}</td>
                          <td className="py-3 pr-4">
                            <span className="badge bg-slate-700 text-slate-300 text-xs">{u.experienceLevel || '—'}</span>
                          </td>
                          <td className="py-3 pr-4 text-slate-400 text-sm">
                            {interviews.filter(i => i.userId === u.id || i.userEmail === u.email).length}
                          </td>
                          <td className="py-3 text-slate-500 text-xs">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 pl-4">
                            {u.id !== user?.id && (
                              <button onClick={() => handleDeleteUser(u.id, u.name)}
                                disabled={deleting === `user-${u.id}`}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all">
                                {deleting === `user-${u.id}`
                                  ? <RefreshCw size={14} className="animate-spin" />
                                  : <Trash2 size={14} />}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && <p className="text-slate-500 text-center py-8">No users yet</p>}
                </div>
              </div>
            )}

            {/* Interviews Tab */}
            {activeTab === 'interviews' && (
              <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4">
                  All Interviews ({interviews.length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                        <th className="text-left pb-3 pr-4">ID</th>
                        <th className="text-left pb-3 pr-4">User</th>
                        <th className="text-left pb-3 pr-4">Round</th>
                        <th className="text-left pb-3 pr-4">Type</th>
                        <th className="text-left pb-3 pr-4">Status</th>
                        <th className="text-left pb-3 pr-4">Score</th>
                        <th className="text-left pb-3">Date</th>
                        <th className="pb-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {interviews.map(iv => (
                        <tr key={iv.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 pr-4 text-slate-500 text-sm">#{iv.id}</td>
                          <td className="py-3 pr-4 text-slate-400 text-sm">{iv.userEmail || `User #${iv.userId}`}</td>
                          <td className="py-3 pr-4 text-slate-300 text-sm">Round {iv.roundNumber}</td>
                          <td className="py-3 pr-4">
                            <span className="badge bg-slate-700 text-slate-300 text-xs">{iv.interviewType}</span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`badge text-xs ${
                              iv.status === 'COMPLETED' ? 'bg-green-900/40 text-green-400' :
                              iv.status === 'IN_PROGRESS' ? 'bg-yellow-900/40 text-yellow-400' :
                              'bg-slate-700 text-slate-400'
                            }`}>{iv.status}</span>
                          </td>
                          <td className="py-3 pr-4">
                            {iv.score?.overallScore != null ? (
                              <span className={`text-sm font-bold ${
                                iv.score.overallScore >= 7 ? 'text-green-400' :
                                iv.score.overallScore >= 5 ? 'text-yellow-400' : 'text-red-400'
                              }`}>{iv.score.overallScore.toFixed(1)}</span>
                            ) : <span className="text-slate-500">—</span>}
                          </td>
                          <td className="py-3 text-slate-500 text-xs">
                            {iv.createdAt ? new Date(iv.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 pl-4">
                            <button onClick={() => handleDeleteInterview(iv.id)}
                              disabled={deleting === `interview-${iv.id}`}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all">
                              {deleting === `interview-${iv.id}`
                                ? <RefreshCw size={14} className="animate-spin" />
                                : <Trash2 size={14} />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {interviews.length === 0 && <p className="text-slate-500 text-center py-8">No interviews yet</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
