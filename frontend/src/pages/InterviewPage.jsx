import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { interviewApi } from '../utils/api'
import toast from 'react-hot-toast'
import { Send, ChevronRight, Target, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react'

export default function InterviewPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [interview, setInterview] = useState(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [answeredQuestions, setAnsweredQuestions] = useState({})
  const [lastEval, setLastEval] = useState(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    interviewApi.start(token)
      .then(r => {
        setInterview(r.data)
        // Pre-populate answered questions
        const answered = {}
        r.data.questions?.forEach(q => {
          if (q.answerText) answered[q.id] = { score: q.aiScore, feedback: q.aiFeedback }
        })
        setAnsweredQuestions(answered)
        // Find first unanswered
        const firstUnanswered = r.data.questions?.findIndex(q => !q.answerText)
        setCurrentIdx(firstUnanswered >= 0 ? firstUnanswered : 0)
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Failed to load interview')
        navigate('/dashboard')
      })
      .finally(() => setLoading(false))
  }, [token])

  const currentQuestion = interview?.questions?.[currentIdx]
  const totalQuestions = interview?.questions?.length || 0
  const answeredCount = Object.keys(answeredQuestions).length

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      toast.error('Please write your answer before submitting')
      return
    }
    setSubmitting(true)
    try {
      const { data } = await interviewApi.submitAnswer(token, {
        questionId: currentQuestion.id,
        answerText: answer.trim()
      })
      setAnsweredQuestions(prev => ({
        ...prev,
        [currentQuestion.id]: { score: data.aiScore, feedback: data.aiFeedback }
      }))
      setLastEval({ score: data.aiScore, feedback: data.aiFeedback, strengths: data.aiStrengths, improvements: data.aiImprovements })
      // Update question in list
      setInterview(prev => ({
        ...prev,
        questions: prev.questions.map(q => q.id === data.id ? data : q)
      }))
      setAnswer('')
      toast.success(`Answered! Score: ${data.aiScore}/10`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit answer')
    } finally { setSubmitting(false) }
  }

  const handleNext = () => {
    setLastEval(null)
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1)
      setAnswer('')
    }
  }

  const handleComplete = async () => {
    if (answeredCount < totalQuestions) {
      const unanswered = totalQuestions - answeredCount
      if (!confirm(`You have ${unanswered} unanswered question(s). Complete anyway?`)) return
    }
    setCompleting(true)
    try {
      await interviewApi.complete(token)
      toast.success('Interview completed!')
      navigate(`/result/${token}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete interview')
    } finally { setCompleting(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto text-indigo-400 animate-spin mb-4" size={40} />
          <p className="text-slate-400">Loading your interview...</p>
        </div>
      </div>
    )
  }

  const isCurrentAnswered = currentQuestion && answeredQuestions[currentQuestion.id]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      {/* Header */}
      <div className="bg-slate-900/80 border-b border-slate-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="text-indigo-400" size={20} />
            <span className="font-semibold text-white">MockMate Interview</span>
            <span className="badge bg-indigo-900/40 text-indigo-300">
              Round {interview?.roundNumber}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">
              {answeredCount} / {totalQuestions} answered
            </span>
            <button onClick={handleComplete} disabled={completing}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
              {completing ? <Loader size={14} className="animate-spin" /> : null}
              {completing ? 'Finishing...' : 'Finish Interview'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 flex gap-6">
        {/* Question List Sidebar */}
        <div className="w-48 flex-shrink-0">
          <div className="sticky top-6">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Questions</p>
            <div className="space-y-1">
              {interview?.questions?.map((q, i) => {
                const answered = answeredQuestions[q.id]
                const isCurrent = i === currentIdx
                return (
                  <button key={q.id} onClick={() => { setCurrentIdx(i); setLastEval(null); setAnswer('') }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                      isCurrent ? 'bg-indigo-700 text-white' :
                      answered ? 'text-green-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-800'
                    }`}>
                    {answered ? <CheckCircle size={12} /> : <span className="w-3 h-3 rounded-full border border-current flex-shrink-0" />}
                    Q{i + 1}
                    <span className="ml-auto text-xs opacity-70">{q.difficulty?.[0]?.toUpperCase()}</span>
                  </button>
                )
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{Math.round(totalQuestions ? (answeredCount / totalQuestions) * 100 : 0)}% complete</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-4">
          {currentQuestion && (
            <>
              {/* Question Card */}
              <div className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="badge bg-indigo-900/40 text-indigo-300">Q{currentIdx + 1}</span>
                    <span className={`badge ${
                      currentQuestion.difficulty === 'easy' ? 'bg-green-900/40 text-green-400' :
                      currentQuestion.difficulty === 'hard' ? 'bg-red-900/40 text-red-400' :
                      'bg-yellow-900/40 text-yellow-400'
                    }`}>{currentQuestion.difficulty}</span>
                    <span className="badge bg-slate-700/60 text-slate-400">{currentQuestion.category}</span>
                  </div>
                </div>
                <p className="text-white text-lg leading-relaxed">{currentQuestion.questionText}</p>
              </div>

              {/* Answer or Result */}
              {isCurrentAnswered ? (
                <div className="space-y-3">
                  {/* Score */}
                  <div className={`card border ${
                    (answeredQuestions[currentQuestion.id]?.score || 0) >= 7
                      ? 'border-green-700/50 bg-green-900/10'
                      : (answeredQuestions[currentQuestion.id]?.score || 0) >= 5
                      ? 'border-yellow-700/50 bg-yellow-900/10'
                      : 'border-red-700/50 bg-red-900/10'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-white">AI Evaluation</span>
                      <span className={`text-2xl font-bold ${
                        (answeredQuestions[currentQuestion.id]?.score || 0) >= 7 ? 'text-green-400' :
                        (answeredQuestions[currentQuestion.id]?.score || 0) >= 5 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {answeredQuestions[currentQuestion.id]?.score}/10
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">{answeredQuestions[currentQuestion.id]?.feedback}</p>
                  </div>

                  {/* Your answer */}
                  <div className="card bg-slate-900/50">
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Your Answer</p>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">
                      {interview.questions[currentIdx]?.answerText}
                    </p>
                  </div>

                  {currentIdx < totalQuestions - 1 && (
                    <button onClick={handleNext} className="btn-primary w-full flex items-center justify-center gap-2">
                      Next Question <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="card">
                  <label className="label">Your Answer</label>
                  <textarea ref={textareaRef}
                    value={answer} onChange={e => setAnswer(e.target.value)}
                    placeholder="Type your answer here... Be as detailed as possible."
                    rows={8} className="input resize-none text-sm leading-relaxed"
                    disabled={submitting}
                    onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handleSubmitAnswer() }} />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-slate-500 text-xs">Ctrl + Enter to submit</p>
                    <button onClick={handleSubmitAnswer} disabled={submitting || !answer.trim()}
                      className="btn-primary flex items-center gap-2">
                      {submitting ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                      {submitting ? 'Evaluating...' : 'Submit Answer'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
