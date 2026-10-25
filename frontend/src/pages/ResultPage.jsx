import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { interviewApi } from '../utils/api'
import Navbar from '../components/common/Navbar'
import toast from 'react-hot-toast'
import {
  Trophy, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Target, Plus, ArrowLeft, BarChart2, FileText, Eye, EyeOff, Download
} from 'lucide-react'

// ─── Mini bar chart for per-question scores ─────────────────────────────────
function ScoreBarChart({ questions }) {
  const answered = questions.filter(q => q.answerText && q.aiScore != null)
  if (!answered.length) return null
  const maxScore = 10
  return (
    <div className="space-y-2">
      {answered.map((q, i) => {
        const pct = ((q.aiScore || 0) / maxScore) * 100
        const color = q.aiScore >= 7 ? 'bg-green-500' : q.aiScore >= 5 ? 'bg-yellow-500' : 'bg-red-500'
        return (
          <div key={q.id} className="flex items-center gap-3">
            <span className="text-slate-400 text-xs w-6 flex-shrink-0">Q{questions.indexOf(q) + 1}</span>
            <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full transition-all duration-700`}
                style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-xs font-bold w-8 text-right ${
              q.aiScore >= 7 ? 'text-green-400' : q.aiScore >= 5 ? 'text-yellow-400' : 'text-red-400'
            }`}>{q.aiScore}/10</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Category radar-like summary ────────────────────────────────────────────
function CategoryBreakdown({ questions }) {
  const cats = {}
  questions.forEach(q => {
    if (!q.answerText || q.aiScore == null) return
    if (!cats[q.category]) cats[q.category] = { total: 0, count: 0 }
    cats[q.category].total += q.aiScore
    cats[q.category].count++
  })
  const entries = Object.entries(cats).map(([cat, { total, count }]) => ({
    cat, avg: total / count
  }))
  if (!entries.length) return null
  return (
    <div className="grid grid-cols-2 gap-3">
      {entries.map(({ cat, avg }) => (
        <div key={cat} className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl">
          <div className="relative w-10 h-10 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="4" />
              <circle cx="18" cy="18" r="14" fill="none"
                stroke={avg >= 7 ? '#4ade80' : avg >= 5 ? '#facc15' : '#f87171'}
                strokeWidth="4"
                strokeDasharray={`${(avg / 10) * 2 * Math.PI * 14} ${2 * Math.PI * 14}`}
                strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white"
              style={{ transform: 'rotate(90deg) translateX(0)' }}>
            </span>
          </div>
          <div>
            <p className="text-slate-300 text-sm capitalize font-medium">{cat}</p>
            <p className={`text-lg font-bold ${avg >= 7 ? 'text-green-400' : avg >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
              {avg.toFixed(1)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function ResultPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedQ, setExpandedQ] = useState(null)
  const [showIdeal, setShowIdeal] = useState({})
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    interviewApi.getByToken(token)
      .then(r => setInterview(r.data))
      .catch(() => { toast.error('Failed to load results'); navigate('/dashboard') })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center">
      <Loader className="text-indigo-400 animate-spin" size={40} />
    </div>
  )

  const score = interview?.score
  const passed = score?.passed
  const totalScore = score?.overallScore || 0
  const questions = interview?.questions || []
  const answeredQ = questions.filter(q => q.answerText)

  const scoreColor = totalScore >= 7 ? 'text-green-400' : totalScore >= 5 ? 'text-yellow-400' : 'text-red-400'
  const scoreBg = totalScore >= 7
    ? 'from-green-900/30 to-emerald-900/10 border-green-700/30'
    : totalScore >= 5
    ? 'from-yellow-900/30 to-amber-900/10 border-yellow-700/30'
    : 'from-red-900/30 to-rose-900/10 border-red-700/30'

  const downloadTranscript = () => {
    const lines = [`MockMate Interview Report`, `=`.repeat(40),
      `Round: ${interview.roundNumber} | Type: ${interview.interviewType}`,
      `Score: ${totalScore.toFixed(1)}/10 | ${passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}`,
      `Technologies: ${interview.technologies?.join(', ')}`, '',
      `AI Assessment:`, score?.technicalFeedback || '', '',
      `Recommendation:`, score?.recommendation || '', '',
      ...questions.map((q, i) => [
        `Q${i + 1}: ${q.questionText}`,
        `Your Answer: ${q.answerText || '(Skipped)'}`,
        `Score: ${q.aiScore || 'N/A'}/10`,
        `Feedback: ${q.aiFeedback || ''}`, ''
      ].join('\n'))
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `mockmate-report-round${interview.roundNumber}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Trophy },
    { id: 'breakdown', label: 'Breakdown', icon: BarChart2 },
    { id: 'qa', label: 'Q&A Review', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <button onClick={downloadTranscript}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <Download size={15} /> Download Report
          </button>
        </div>

        {/* Score Hero */}
        <div className={`card bg-gradient-to-br ${scoreBg} border mb-6 text-center py-10 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-5">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="absolute text-6xl" style={{
                left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                transform: 'rotate(-15deg)', opacity: 0.3
              }}>⭐</div>
            ))}
          </div>
          <div className="relative">
            <div className="flex items-center justify-center gap-3 mb-4">
              {passed ? <Trophy className="text-yellow-400" size={48} /> : <Target className="text-slate-400" size={48} />}
            </div>
            <div className={`text-8xl font-bold ${scoreColor} mb-1 tracking-tight`}>{totalScore.toFixed(1)}</div>
            <div className="text-2xl text-slate-400 mb-4">/10</div>
            <div className={`text-xl font-semibold ${passed ? 'text-green-400' : 'text-orange-400'}`}>
              {passed ? '🎉 Congratulations! You Passed!' : '💪 Keep Practicing!'}
            </div>
            <div className="mt-2 text-slate-400 text-sm">
              Round {interview?.roundNumber} • {interview?.interviewType} • {interview?.technologies?.slice(0, 3).join(', ')}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{answeredQ.length}</div>
                <div className="text-xs text-slate-400">Answered</div>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{questions.length - answeredQ.length}</div>
                <div className="text-xs text-slate-400">Skipped</div>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div className="text-center">
                <div className={`text-2xl font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
                  {passed ? 'PASS' : 'FAIL'}
                </div>
                <div className="text-xs text-slate-400">Result</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {score && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="card">
                  <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                    <CheckCircle size={16} /> Strengths
                  </h3>
                  <ul className="space-y-2">
                    {score.strengths?.map((s, i) => (
                      <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card">
                  <h3 className="font-semibold text-orange-400 mb-3 flex items-center gap-2">
                    <Target size={16} /> Areas to Improve
                  </h3>
                  <ul className="space-y-2">
                    {score.improvements?.map((s, i) => (
                      <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {score?.technicalFeedback && (
              <div className="card">
                <h3 className="font-semibold text-white mb-2">AI Assessment</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{score.technicalFeedback}</p>
                {score.recommendation && (
                  <div className="mt-3 p-3 bg-indigo-900/20 border border-indigo-700/30 rounded-lg">
                    <p className="text-indigo-300 text-sm">
                      <span className="font-medium">Recommendation:</span> {score.recommendation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Breakdown Tab */}
        {activeTab === 'breakdown' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart2 size={16} className="text-indigo-400" /> Score per Question
              </h3>
              <ScoreBarChart questions={questions} />
            </div>
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Category Performance</h3>
              <CategoryBreakdown questions={questions} />
            </div>
            {/* Difficulty distribution */}
            {['easy', 'medium', 'hard'].map(diff => {
              const dqs = questions.filter(q => q.difficulty === diff && q.answerText)
              if (!dqs.length) return null
              const avg = dqs.reduce((s, q) => s + (q.aiScore || 0), 0) / dqs.length
              return (
                <div key={diff} className="flex items-center gap-3">
                  <span className={`badge flex-shrink-0 capitalize ${
                    diff === 'easy' ? 'bg-green-900/40 text-green-400' :
                    diff === 'hard' ? 'bg-red-900/40 text-red-400' : 'bg-yellow-900/40 text-yellow-400'
                  }`}>{diff}</span>
                  <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${
                      avg >= 7 ? 'bg-green-500' : avg >= 5 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} style={{ width: `${(avg / 10) * 100}%` }} />
                  </div>
                  <span className="text-slate-400 text-sm w-16 text-right">{avg.toFixed(1)}/10 avg</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Q&A Review Tab */}
        {activeTab === 'qa' && (
          <div className="card">
            <h3 className="font-semibold text-white mb-4">
              Question-by-Question Review ({answeredQ.length}/{questions.length})
            </h3>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className="border border-slate-700/50 rounded-xl overflow-hidden">
                  <button onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors text-left">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`badge flex-shrink-0 ${
                        (q.aiScore || 0) >= 7 ? 'bg-green-900/40 text-green-400' :
                        (q.aiScore || 0) >= 5 ? 'bg-yellow-900/40 text-yellow-400' :
                        q.answerText ? 'bg-red-900/40 text-red-400' : 'bg-slate-700 text-slate-500'
                      }`}>
                        {q.answerText ? `${q.aiScore}/10` : 'Skipped'}
                      </span>
                      <span className="text-slate-300 text-sm truncate">{q.questionText}</span>
                    </div>
                    {expandedQ === i
                      ? <ChevronUp size={16} className="text-slate-500 flex-shrink-0 ml-2" />
                      : <ChevronDown size={16} className="text-slate-500 flex-shrink-0 ml-2" />}
                  </button>

                  {expandedQ === i && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50">
                      <div className="pt-3">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Question</p>
                        <p className="text-white text-sm">{q.questionText}</p>
                      </div>
                      {q.answerText ? (
                        <>
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Your Answer</p>
                            <p className="text-slate-300 text-sm whitespace-pre-wrap bg-slate-900/50 p-3 rounded-lg">{q.answerText}</p>
                          </div>
                          {q.aiFeedback && (
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">AI Feedback</p>
                              <p className="text-slate-300 text-sm">{q.aiFeedback}</p>
                            </div>
                          )}
                          {/* Ideal Answer */}
                          <div>
                            <button onClick={() => setShowIdeal(p => ({ ...p, [q.id]: !p[q.id] }))}
                              className={`text-xs flex items-center gap-1 transition-colors ${
                                showIdeal[q.id] ? 'text-indigo-400' : 'text-slate-500 hover:text-indigo-400'
                              }`}>
                              {showIdeal[q.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                              {showIdeal[q.id] ? 'Hide ideal answer' : 'Show ideal answer'}
                            </button>
                            {showIdeal[q.id] && (
                              <div className="mt-2 p-3 bg-indigo-900/20 border border-indigo-700/30 rounded-lg">
                                <p className="text-xs text-indigo-400 uppercase tracking-wider mb-1">Ideal Answer</p>
                                <p className="text-indigo-200 text-sm leading-relaxed">
                                  {q.idealAnswer || "A strong answer covers the core concept clearly, with a practical example and an awareness of trade-offs."}
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-slate-500 text-sm italic">This question was not answered</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex gap-4 mt-6">
          {passed && (
            <button onClick={() => navigate('/setup')} className="btn-primary flex items-center gap-2 flex-1 justify-center">
              <Plus size={18} /> Start Round {(interview?.roundNumber || 1) + 1}
            </button>
          )}
          <button onClick={() => navigate('/setup')}
            className={`flex items-center gap-2 justify-center ${passed ? 'btn-secondary flex-1' : 'btn-primary flex-1'}`}>
            {passed ? 'Practice More' : '🔄 Try Again'}
          </button>
        </div>
      </div>
    </div>
  )
}
