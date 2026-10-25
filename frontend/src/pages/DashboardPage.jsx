import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { interviewApi } from '../utils/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/common/Navbar'
import toast from 'react-hot-toast'
import { Plus, Clock, CheckCircle, XCircle, ChevronRight, Target, Trophy, BookOpen } from 'lucide-react'

const statusConfig = {
  SCHEDULED: { color: 'text-blue-400 bg-blue-900/30', icon: Clock, label: 'Scheduled' },
  IN_PROGRESS: { color: 'text-yellow-400 bg-yellow-900/30', icon: Clock, label: 'In Progress' },
  COMPLETED: { color: 'text-green-400 bg-green-900/30', icon: CheckCircle, label: 'Completed' },
  CANCELLED: { color: 'text-red-400 bg-red-900/30', icon: XCircle, label: 'Cancelled' },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    interviewApi.getAll()
      .then(r => setInterviews(r.data))
      .catch(() => toast.error('Failed to load interviews'))
      .finally(() => setLoading(false))
  }, [])

  const recent = interviews.slice(0, 5)
  const completed = interviews.filter(i => i.status === 'COMPLETED')
  const avgScore = completed.length
    ? (completed.reduce((sum, i) => sum + (i.score?.overallScore || 0), 0) / completed.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-slate-400 mt-1">Ready to ace your next interview?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-indigo-900/40 rounded-xl">
              <BookOpen className="text-indigo-400" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{interviews.length}</div>
              <div className="text-slate-400 text-sm">Total Interviews</div>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-green-900/40 rounded-xl">
              <Trophy className="text-green-400" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{avgScore || '—'}{avgScore ? '/10' : ''}</div>
              <div className="text-slate-400 text-sm">Average Score</div>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="p-3 bg-purple-900/40 rounded-xl">
              <Target className="text-purple-400" size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {completed.filter(i => i.score?.passed).length}
              </div>
              <div className="text-slate-400 text-sm">Rounds Passed</div>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="mb-8">
          <button onClick={() => navigate('/setup')}
            className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
            <Plus size={20} />
            Start New Interview
          </button>
        </div>

        {/* Recent Interviews */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Interviews</h2>
            <button onClick={() => navigate('/history')} className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
              View all <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : recent.length === 0 ? (
            <div className="text-center py-12">
              <Target className="mx-auto text-slate-600 mb-3" size={40} />
              <p className="text-slate-400">No interviews yet</p>
              <p className="text-slate-500 text-sm mt-1">Start your first mock interview!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map(interview => {
                const cfg = statusConfig[interview.status]
                const Icon = cfg.icon
                return (
                  <div key={interview.id}
                    onClick={() => interview.status === 'SCHEDULED' || interview.status === 'IN_PROGRESS'
                      ? navigate(`/interview/${interview.token}`)
                      : navigate(`/result/${interview.token}`)
                    }
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl hover:bg-slate-700/50 cursor-pointer transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${cfg.color}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          Round {interview.roundNumber} — {interview.interviewType}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {interview.technologies?.slice(0,3).join(', ')}
                          {interview.technologies?.length > 3 && ' ...'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {interview.score && (
                        <div className={`font-bold text-lg ${interview.score.passed ? 'text-green-400' : 'text-red-400'}`}>
                          {interview.score.overallScore?.toFixed(1)}/10
                        </div>
                      )}
                      <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
