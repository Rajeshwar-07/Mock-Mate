import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { interviewApi } from '../utils/api'
import Navbar from '../components/common/Navbar'
import toast from 'react-hot-toast'
import { Clock, CheckCircle, XCircle, ChevronRight, Trophy, Filter } from 'lucide-react'

const statusConfig = {
  SCHEDULED: { color: 'bg-blue-900/30 text-blue-400', label: 'Scheduled' },
  IN_PROGRESS: { color: 'bg-yellow-900/30 text-yellow-400', label: 'In Progress' },
  COMPLETED: { color: 'bg-green-900/30 text-green-400', label: 'Completed' },
  CANCELLED: { color: 'bg-red-900/30 text-red-400', label: 'Cancelled' },
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    interviewApi.getAll()
      .then(r => setInterviews(r.data))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? interviews : interviews.filter(i => i.status === filter)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Interview History</h1>
          <div className="flex gap-2">
            {['ALL', 'COMPLETED', 'SCHEDULED'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}>
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="mx-auto text-slate-600 mb-3" size={40} />
            <p className="text-slate-400">No interviews found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(interview => {
              const cfg = statusConfig[interview.status]
              return (
                <div key={interview.id}
                  onClick={() => interview.status === 'COMPLETED'
                    ? navigate(`/result/${interview.token}`)
                    : navigate(`/interview/${interview.token}`)
                  }
                  className="card hover:bg-slate-700/50 cursor-pointer transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-white">
                          Round {interview.roundNumber} — {interview.interviewType}
                        </span>
                        <span className={`badge ${cfg.color}`}>{cfg.label}</span>
                        {interview.score?.passed !== undefined && (
                          <span className={`badge ${interview.score.passed ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                            {interview.score.passed ? 'Passed' : 'Failed'}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 text-sm">
                        {interview.technologies?.join(', ')}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">
                        {interview.createdAt ? new Date(interview.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        }) : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {interview.score && (
                        <div className={`text-2xl font-bold ${
                          interview.score.overallScore >= 7 ? 'text-green-400' :
                          interview.score.overallScore >= 5 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {interview.score.overallScore?.toFixed(1)}
                        </div>
                      )}
                      <ChevronRight size={18} className="text-slate-600 group-hover:text-slate-400" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
