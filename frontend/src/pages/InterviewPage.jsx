import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { interviewApi } from '../utils/api'
import toast from 'react-hot-toast'
import {
  Send, ChevronRight, Target, CheckCircle, Loader, Mic, MicOff,
  Volume2, VolumeX, Camera, CameraOff, FileText, Bot, X, Eye, EyeOff
} from 'lucide-react'

// ─── Speech utilities ──────────────────────────────────────────────────────
const hasSpeechRecognition = () =>
  typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

const hasSpeechSynthesis = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

function speak(text, { onEnd } = {}) {
  if (!hasSpeechSynthesis()) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.rate = 0.95
  utt.pitch = 1
  utt.volume = 1
  // prefer a natural English voice
  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find(v => v.lang.startsWith('en') && v.localService) ||
                    voices.find(v => v.lang.startsWith('en')) || voices[0]
  if (preferred) utt.voice = preferred
  if (onEnd) utt.onend = onEnd
  window.speechSynthesis.speak(utt)
}

function stopSpeaking() {
  if (hasSpeechSynthesis()) window.speechSynthesis.cancel()
}

// ─── AI Persona panel ──────────────────────────────────────────────────────
function PersonaMessage({ message, type }) {
  return (
    <div className={`flex items-start gap-3 ${type === 'user' ? 'flex-row-reverse' : ''}`}>
      {type === 'ai' && (
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
      )}
      <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm leading-relaxed ${
        type === 'ai'
          ? 'bg-slate-700 text-slate-200 rounded-tl-sm'
          : 'bg-indigo-600 text-white rounded-tr-sm'
      }`}>
        {message}
      </div>
    </div>
  )
}

// ─── Circular score meter ──────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 28, c = 2 * Math.PI * r
  const fill = (score / 10) * c
  const color = score >= 7 ? '#4ade80' : score >= 5 ? '#facc15' : '#f87171'
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="transform -rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${fill} ${c}`} strokeLinecap="round" />
      <text x="36" y="36" textAnchor="middle" dominantBaseline="central"
        className="fill-white text-xs font-bold" style={{ transform: 'rotate(90deg)', transformOrigin: '36px 36px', fontSize: 13 }}>
        {score}/10
      </text>
    </svg>
  )
}

// ─── Main component ────────────────────────────────────────────────────────
export default function InterviewPage() {
  const { token } = useParams()
  const navigate = useNavigate()

  // Data
  const [interview, setInterview] = useState(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [answeredQuestions, setAnsweredQuestions] = useState({})

  // Features
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [cameraOn, setCameraOn] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [transcript, setTranscript] = useState([])
  const [showIdealAnswer, setShowIdealAnswer] = useState({})

  // Voice input
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  // Camera
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Persona chat
  const [chatMessages, setChatMessages] = useState([])
  const chatEndRef = useRef(null)

  const textareaRef = useRef(null)

  // ── Load interview ──
  useEffect(() => {
    interviewApi.start(token)
      .then(r => {
        setInterview(r.data)
        const answered = {}
        r.data.questions?.forEach(q => {
          if (q.answerText) answered[q.id] = { score: q.aiScore, feedback: q.aiFeedback }
        })
        setAnsweredQuestions(answered)
        const firstUnanswered = r.data.questions?.findIndex(q => !q.answerText)
        setCurrentIdx(firstUnanswered >= 0 ? firstUnanswered : 0)
        // greet
        const intro = `Hi! I'm Alex, your AI interviewer. Let's get started with Round ${r.data.roundNumber}. I'll read each question aloud and you can answer by voice or text. Good luck!`
        setChatMessages([{ type: 'ai', text: intro }])
        if (ttsEnabled) speak(intro)
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Failed to load interview')
        navigate('/dashboard')
      })
      .finally(() => setLoading(false))

    return () => {
      stopSpeaking()
      stopCamera()
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [token])

  // ── Read question aloud when it changes ──
  const currentQuestion = interview?.questions?.[currentIdx]
  const totalQuestions = interview?.questions?.length || 0
  const answeredCount = Object.keys(answeredQuestions).length

  useEffect(() => {
    if (!currentQuestion || !ttsEnabled) return
    // only auto-read if not answered yet
    if (!answeredQuestions[currentQuestion.id]) {
      const msg = `Question ${currentIdx + 1}. ${currentQuestion.questionText}`
      speak(msg)
      addChat('ai', `Question ${currentIdx + 1}: ${currentQuestion.questionText}`)
    }
  }, [currentIdx, currentQuestion?.id, ttsEnabled])

  // ── Scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ── Camera ──
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraOn(true)
    } catch {
      toast.error('Camera access denied. Please allow camera in browser settings.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraOn(false)
  }

  const toggleCamera = () => {
    if (cameraOn) stopCamera()
    else startCamera()
  }

  // ── Voice input ──
  const startListening = useCallback(() => {
    if (!hasSpeechRecognition()) {
      toast.error('Speech recognition not supported in this browser. Try Chrome.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    stopSpeaking()
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    recognitionRef.current = rec

    let interim = ''
    rec.onresult = (e) => {
      let final = ''
      interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else interim += e.results[i][0].transcript
      }
      if (final) {
        setAnswer(prev => (prev ? prev + ' ' + final : final))
      }
    }

    rec.onerror = (e) => {
      if (e.error !== 'aborted') toast.error(`Voice error: ${e.error}`)
      setListening(false)
    }
    rec.onend = () => setListening(false)

    rec.start()
    setListening(true)
    toast.success('Listening… speak your answer', { duration: 2000 })
  }, [listening])

  const addChat = (type, text) => {
    setChatMessages(prev => [...prev, { type, text }])
    setTranscript(prev => [...prev, { type: type === 'ai' ? 'Interviewer' : 'You', text, time: new Date().toLocaleTimeString() }])
  }

  // ── Submit answer ──
  const handleSubmitAnswer = async () => {
    if (!answer.trim()) { toast.error('Please provide your answer'); return }
    if (listening) { recognitionRef.current?.stop(); setListening(false) }
    setSubmitting(true)
    addChat('user', answer.trim())
    try {
      const { data } = await interviewApi.submitAnswer(token, {
        questionId: currentQuestion.id,
        answerText: answer.trim()
      })
      setAnsweredQuestions(prev => ({
        ...prev,
        [currentQuestion.id]: { score: data.aiScore, feedback: data.aiFeedback,
          strengths: data.aiStrengths, improvements: data.aiImprovements, idealAnswer: data.idealAnswer }
      }))
      setInterview(prev => ({
        ...prev,
        questions: prev.questions.map(q => q.id === data.id ? data : q)
      }))
      setAnswer('')

      // AI feedback via chat + TTS
      const scoreMsg = data.aiScore >= 7
        ? `Nice work! You scored ${data.aiScore} out of 10. ${data.aiFeedback}`
        : data.aiScore >= 5
        ? `Good attempt. You scored ${data.aiScore} out of 10. ${data.aiFeedback}`
        : `You scored ${data.aiScore} out of 10. ${data.aiFeedback} Let me show you the ideal answer.`

      addChat('ai', scoreMsg)
      if (ttsEnabled) speak(scoreMsg)
      toast.success(`Score: ${data.aiScore}/10`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit answer')
    } finally { setSubmitting(false) }
  }

  const handleNext = () => {
    stopSpeaking()
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
    stopSpeaking()
    setCompleting(true)
    try {
      await interviewApi.complete(token)
      toast.success('Interview completed!')
      navigate(`/result/${token}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete interview')
    } finally { setCompleting(false) }
  }

  const toggleIdealAnswer = (qId) => {
    setShowIdealAnswer(prev => ({ ...prev, [qId]: !prev[qId] }))
  }

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center">
      <div className="text-center">
        <Loader className="mx-auto text-indigo-400 animate-spin mb-4" size={40} />
        <p className="text-slate-400">Loading your interview...</p>
      </div>
    </div>
  )

  const isCurrentAnswered = currentQuestion && answeredQuestions[currentQuestion.id]
  const evalData = isCurrentAnswered ? answeredQuestions[currentQuestion.id] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900/90 border-b border-slate-700 px-4 py-3 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Target className="text-indigo-400" size={20} />
            <span className="font-semibold text-white">MockMate</span>
            <span className="badge bg-indigo-900/40 text-indigo-300">Round {interview?.roundNumber}</span>
            <span className="text-slate-400 text-sm">{answeredCount}/{totalQuestions} answered</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* TTS toggle */}
            <button onClick={() => { setTtsEnabled(e => !e); if (ttsEnabled) stopSpeaking() }}
              title={ttsEnabled ? 'Mute AI voice' : 'Enable AI voice'}
              className={`p-2 rounded-lg transition-all ${ttsEnabled ? 'bg-indigo-700 text-white' : 'bg-slate-700 text-slate-400'}`}>
              {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            {/* Camera toggle */}
            <button onClick={toggleCamera} title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
              className={`p-2 rounded-lg transition-all ${cameraOn ? 'bg-green-700 text-white' : 'bg-slate-700 text-slate-400'}`}>
              {cameraOn ? <Camera size={16} /> : <CameraOff size={16} />}
            </button>
            {/* Transcript toggle */}
            <button onClick={() => setShowTranscript(s => !s)} title="View transcript"
              className={`p-2 rounded-lg transition-all ${showTranscript ? 'bg-purple-700 text-white' : 'bg-slate-700 text-slate-400'}`}>
              <FileText size={16} />
            </button>
            <button onClick={handleComplete} disabled={completing}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
              {completing ? <Loader size={14} className="animate-spin" /> : null}
              {completing ? 'Finishing...' : 'Finish Interview'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-4 gap-4 overflow-hidden">

        {/* ── Left: Question sidebar ── */}
        <div className="w-44 flex-shrink-0 hidden md:block">
          <div className="sticky top-4">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Questions</p>
            <div className="space-y-1">
              {interview?.questions?.map((q, i) => {
                const answered = answeredQuestions[q.id]
                const isCurrent = i === currentIdx
                return (
                  <button key={q.id} onClick={() => { setCurrentIdx(i); setAnswer('') }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                      isCurrent ? 'bg-indigo-700 text-white' :
                      answered ? 'text-green-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-800'
                    }`}>
                    {answered
                      ? <CheckCircle size={12} />
                      : <span className="w-3 h-3 rounded-full border border-current flex-shrink-0" />}
                    Q{i + 1}
                    {answered && <span className="ml-auto text-xs opacity-70">{answered.score}</span>}
                  </button>
                )
              })}
            </div>
            <div className="mt-4">
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {Math.round(totalQuestions ? (answeredCount / totalQuestions) * 100 : 0)}% complete
              </p>
            </div>
          </div>
        </div>

        {/* ── Center: Main content ── */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto">

          {/* Camera preview (small, top-right of content area) */}
          {cameraOn && (
            <div className="flex justify-end">
              <div className="relative w-40 h-28 rounded-xl overflow-hidden border-2 border-green-500/50 bg-black">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 px-1.5 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white text-xs">LIVE</span>
                </div>
              </div>
            </div>
          )}

          {currentQuestion && (
            <>
              {/* Question card */}
              <div className="card">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge bg-indigo-900/40 text-indigo-300">Q{currentIdx + 1}</span>
                    <span className={`badge ${
                      currentQuestion.difficulty === 'easy' ? 'bg-green-900/40 text-green-400' :
                      currentQuestion.difficulty === 'hard' ? 'bg-red-900/40 text-red-400' :
                      'bg-yellow-900/40 text-yellow-400'
                    }`}>{currentQuestion.difficulty}</span>
                    <span className="badge bg-slate-700/60 text-slate-400">{currentQuestion.category}</span>
                  </div>
                  <button onClick={() => ttsEnabled && speak(`Question ${currentIdx + 1}. ${currentQuestion.questionText}`)}
                    disabled={!ttsEnabled}
                    className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors flex-shrink-0"
                    title="Read question aloud">
                    <Volume2 size={14} />
                  </button>
                </div>
                <p className="text-white text-lg leading-relaxed">{currentQuestion.questionText}</p>
              </div>

              {/* Answer section */}
              {isCurrentAnswered ? (
                <div className="space-y-3">
                  {/* Score */}
                  <div className={`card border ${
                    evalData?.score >= 7 ? 'border-green-700/50 bg-green-900/10' :
                    evalData?.score >= 5 ? 'border-yellow-700/50 bg-yellow-900/10' :
                    'border-red-700/50 bg-red-900/10'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-white">AI Evaluation</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{evalData?.feedback}</p>
                        {evalData?.strengths?.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-green-400 uppercase tracking-wider mb-1">✓ Strengths</p>
                            <ul className="space-y-1">
                              {evalData.strengths.map((s, i) => (
                                <li key={i} className="text-slate-300 text-xs flex gap-2">
                                  <span className="text-green-400">•</span>{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {evalData?.improvements?.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-orange-400 uppercase tracking-wider mb-1">↑ Improve</p>
                            <ul className="space-y-1">
                              {evalData.improvements.map((s, i) => (
                                <li key={i} className="text-slate-300 text-xs flex gap-2">
                                  <span className="text-orange-400">•</span>{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <ScoreRing score={evalData?.score || 0} />
                    </div>
                  </div>

                  {/* Your answer */}
                  <div className="card bg-slate-900/50">
                    <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Your Answer</p>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">
                      {interview.questions[currentIdx]?.answerText}
                    </p>
                  </div>

                  {/* Ideal answer (show if score < 8 or toggle) */}
                  {(evalData?.score < 8 || showIdealAnswer[currentQuestion.id]) && (
                    <div className="card border border-indigo-700/40 bg-indigo-900/10">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                          <Bot size={12} /> Ideal Answer
                        </p>
                        <button onClick={() => toggleIdealAnswer(currentQuestion.id)}
                          className="text-slate-500 hover:text-slate-300 transition-colors">
                          {showIdealAnswer[currentQuestion.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {(evalData?.score < 8 || showIdealAnswer[currentQuestion.id]) ? (
                        <p className="text-indigo-200 text-sm leading-relaxed">
                          {evalData?.idealAnswer ||
                           interview.questions[currentIdx]?.idealAnswer ||
                           "A strong answer should cover the core concepts clearly, provide a practical example or real-world use-case, and demonstrate understanding of trade-offs."}
                        </p>
                      ) : null}
                    </div>
                  )}
                  {evalData?.score >= 8 && !showIdealAnswer[currentQuestion.id] && (
                    <button onClick={() => toggleIdealAnswer(currentQuestion.id)}
                      className="text-indigo-400 text-xs hover:text-indigo-300 flex items-center gap-1 transition-colors">
                      <Eye size={12} /> View ideal answer
                    </button>
                  )}

                  {currentIdx < totalQuestions - 1 && (
                    <button onClick={handleNext} className="btn-primary w-full flex items-center justify-center gap-2">
                      Next Question <ChevronRight size={18} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <label className="label mb-0">Your Answer</label>
                    <div className="flex items-center gap-2">
                      {hasSpeechRecognition() && (
                        <button onClick={startListening}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            listening
                              ? 'bg-red-600 text-white animate-pulse'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}>
                          {listening ? <MicOff size={14} /> : <Mic size={14} />}
                          {listening ? 'Listening...' : 'Voice Input'}
                        </button>
                      )}
                    </div>
                  </div>
                  {listening && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">
                      <div className="flex gap-0.5">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="w-1 bg-red-400 rounded-full animate-pulse"
                            style={{ height: `${12 + Math.random() * 12}px`, animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                      Recording… speak clearly, click Stop when done
                    </div>
                  )}
                  <textarea ref={textareaRef}
                    value={answer} onChange={e => setAnswer(e.target.value)}
                    placeholder="Type your answer here, or use Voice Input above…"
                    rows={7} className="input resize-none text-sm leading-relaxed"
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

        {/* ── Right: AI Persona chat ── */}
        <div className="w-72 flex-shrink-0 hidden lg:flex flex-col">
          <div className="card flex flex-col h-full" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Alex — AI Interviewer</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <p className="text-xs text-green-400">Active</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ minHeight: 0 }}>
              {chatMessages.map((msg, i) => (
                <PersonaMessage key={i} message={msg.text} type={msg.type} />
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Transcript Modal ── */}
      {showTranscript && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <FileText size={18} className="text-purple-400" /> Interview Transcript
              </h2>
              <button onClick={() => setShowTranscript(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3 flex-1">
              {transcript.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No transcript yet. Start answering questions.</p>
              ) : (
                transcript.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-slate-500 text-xs w-16 flex-shrink-0 mt-0.5">{entry.time}</span>
                    <div>
                      <span className={`text-xs font-medium ${entry.type === 'Interviewer' ? 'text-indigo-400' : 'text-green-400'}`}>
                        {entry.type}:
                      </span>
                      <p className="text-slate-300 text-sm mt-0.5">{entry.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-slate-700">
              <button
                onClick={() => {
                  const text = transcript.map(e => `[${e.time}] ${e.type}: ${e.text}`).join('\n')
                  const blob = new Blob([text], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url
                  a.download = `mockmate-transcript-${token}.txt`; a.click()
                  URL.revokeObjectURL(url)
                }}
                className="btn-secondary text-sm flex items-center gap-2">
                <FileText size={14} /> Download Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
