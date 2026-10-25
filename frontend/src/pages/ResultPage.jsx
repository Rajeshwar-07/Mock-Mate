import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { interviewApi } from '../utils/api'
import Navbar from '../components/common/Navbar'
import toast from 'react-hot-toast'
import { Trophy, CheckCircle, XCircle, ChevronDown, ChevronUp, Target, Plus, ArrowLeft } from 'lucide-react'

export default function ResultPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedQ, setExpandedQ] = useState(null)

  useEffect(() => {
    interviewApi.getByToken(token)
      .then(r => setInterview(r.data))
      .catch(() => { toast.error('Failed to load results'); navigate('/dashboard') })
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center">
      <div className="text-slate-400">Loading results...</div>
    </div>
  )

  const score = interview?.score
  const passed = score?.passed
  const totalScore = score?.overallScore || 0
  const questions = interview?.questions || []
  const answeredQ = questions.filter(q => q.answerText)

  const scoreColor = totalScore >= 7 ? 'text-green-400' : totalScore >= 5 ? 'text-yellow-400' : 'text-red-400'
  const scoreBg = totalScore >= 7 ? 'from-green-900/30 to-green-900/10 border-green-700/30' :
    totalScore >= 5 ? 'from-yellow-900/30 to-yellow-900/10 border-yellow-700/30' :
    'from-red-900/30 to-red-900/10 border-red-700/30'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Score Hero */}
        <div className={`card bg-gradient-to-br ${scoreBg} border mb-6 text-center py-10`}>
          <div className="flex items-center justify-center gap-3 mb-4">
            {passed ? <Trophy className="text-yellow-400" size={40} /> : <Target className="text-slate-400" size={40} />}
          </div>
          <div className={`text-7xl font-bold ${scoreColor} mb-2`}>{totalScore.toFixed(1)}</div>
          <div className="text-2xl text-slate-400 mb-4">/10</div>
          <div className={`text-xl font-semibold ${passed ? 'text-green-400' : 'text-red-400'}`}>
            {passed ? '🎉 Congratulations! You Passed!' : '💪 Keep Practicing!'}
          </div>
          <div className="mt-2 text-slate-400">
            Round {interview?.roundNumber} • {interview?.interviewType} • {interview?.technologies?.slice(0,3).join(', ')}
          </div>
        </div>

        {/* Summary cards */}
        {score && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="card">
              <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                <CheckCircle size={16} /> Strengths
              </h3>
              <ul className="space-y-2">
                {score.strengths?.map((s, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span> {s}
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
                    <span className="text-orange-400 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Feedback & Recommendation */}
        {score?.technicalFeedback && (
          <div className="card mb-6">
            <h3 className="font-semibold text-white mb-2">AI Assessment</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{score.technicalFeedback}</p>
            {score.recommendation && (
              <div className="mt-3 p-3 bg-indigo-900/20 border border-indigo-700/30 rounded-lg">
                <p className="text-indigo-300 text-sm"><span className="font-medium">Recommendation:</span> {score.recommendation}</p>
              </div>
            )}
          </div>
        )}

        {/* Q&A Review */}
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
                  {expandedQ === i ? <ChevronUp size={16} className="text-slate-500 flex-shrink-0 ml-2" /> : <ChevronDown size={16} className="text-slate-500 flex-shrink-0 ml-2" />}
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

        {/* CTA */}
        <div className="flex gap-4 mt-6">
          {passed && (
            <button onClick={() => navigate('/setup')} className="btn-primary flex items-center gap-2 flex-1 justify-center">
              <Plus size={18} /> Start Round {(interview?.roundNumber || 1) + 1}
            </button>
          )}
          <button onClick={() => navigate('/setup')} className={`flex items-center gap-2 justify-center ${passed ? 'btn-secondary flex-1' : 'btn-primary flex-1'}`}>
            {passed ? 'Practice More' : '🔄 Try Again'}
          </button>
        </div>
      </div>
    </div>
  )
}
