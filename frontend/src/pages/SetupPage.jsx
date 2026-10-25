import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { interviewApi, resumeApi } from '../utils/api'
import useAuthStore from '../store/authStore'
import Navbar from '../components/common/Navbar'
import toast from 'react-hot-toast'
import { Upload, X, CheckCircle, ChevronRight, ChevronLeft, Loader } from 'lucide-react'

const TECHNOLOGIES = [
  { id: 'java', label: 'Java' },
  { id: 'spring_boot', label: 'Spring Boot' },
  { id: 'python', label: 'Python' },
  { id: 'django', label: 'Django' },
  { id: 'react', label: 'React' },
  { id: 'angular', label: 'Angular' },
  { id: 'nodejs', label: 'Node.js' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'sql', label: 'SQL' },
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'mongodb', label: 'MongoDB' },
  { id: 'redis', label: 'Redis' },
  { id: 'aws', label: 'AWS' },
  { id: 'docker', label: 'Docker' },
  { id: 'kubernetes', label: 'Kubernetes' },
  { id: 'microservices', label: 'Microservices' },
  { id: 'system_design', label: 'System Design' },
  { id: 'data_structures', label: 'Data Structures' },
  { id: 'algorithms', label: 'Algorithms' },
]

const INTERVIEW_TYPES = [
  { value: 'TECHNICAL', label: 'Technical', desc: '80% technical + 20% behavioral' },
  { value: 'HR', label: 'HR Round', desc: '20% technical + 80% behavioral' },
  { value: 'MIXED', label: 'Mixed', desc: '50% technical + 50% behavioral' },
]

const LEVELS = [
  { value: 'FRESHER', label: 'Fresher', desc: '0-1 year', color: 'text-green-400' },
  { value: 'JUNIOR', label: 'Junior', desc: '1-2 years', color: 'text-blue-400' },
  { value: 'MID', label: 'Mid-Level', desc: '2-4 years', color: 'text-yellow-400' },
  { value: 'SENIOR', label: 'Senior', desc: '4+ years', color: 'text-purple-400' },
]

export default function SetupPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    experienceLevel: user?.experienceLevel || 'FRESHER',
    interviewType: 'TECHNICAL',
    technologies: [],
    roundNumber: 1,
  })
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUploaded, setResumeUploaded] = useState(user?.hasResume || false)
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)

  const onDrop = useCallback(files => {
    if (files[0]) setResumeFile(files[0])
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1, maxSize: 5 * 1024 * 1024
  })

  const toggleTech = (id) => {
    setForm(f => ({
      ...f, technologies: f.technologies.includes(id)
        ? f.technologies.filter(t => t !== id)
        : [...f.technologies, id]
    }))
  }

  const handleUploadResume = async () => {
    if (!resumeFile) return
    setUploading(true)
    try {
      await resumeApi.upload(resumeFile)
      setResumeUploaded(true)
      toast.success('Resume uploaded! AI will use it for questions.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally { setUploading(false) }
  }

  const handleCreate = async () => {
    if (form.technologies.length === 0) {
      toast.error('Please select at least one technology')
      return
    }
    setCreating(true)
    try {
      const { data } = await interviewApi.create(form)
      toast.success('Interview created! Email sent. Starting now...')
      navigate(`/interview/${data.token}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create interview')
    } finally { setCreating(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s === step ? 'bg-indigo-600 text-white' :
                s < step ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && <div className={`h-px flex-1 w-12 ${s < step ? 'bg-green-600' : 'bg-slate-700'}`} />}
            </div>
          ))}
          <div className="ml-2 text-slate-400 text-sm">
            {step === 1 ? 'Level & Type' : step === 2 ? 'Technologies' : 'Resume'}
          </div>
        </div>

        {/* Step 1: Level & Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Experience Level</h2>
              <div className="grid grid-cols-2 gap-3">
                {LEVELS.map(l => (
                  <button key={l.value} onClick={() => setForm({...form, experienceLevel: l.value})}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      form.experienceLevel === l.value
                        ? 'border-indigo-500 bg-indigo-900/30' : 'border-slate-700 hover:border-slate-500'
                    }`}>
                    <div className={`font-semibold ${l.color}`}>{l.label}</div>
                    <div className="text-slate-400 text-sm">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Interview Type</h2>
              <div className="space-y-3">
                {INTERVIEW_TYPES.map(t => (
                  <button key={t.value} onClick={() => setForm({...form, interviewType: t.value})}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      form.interviewType === t.value
                        ? 'border-indigo-500 bg-indigo-900/30' : 'border-slate-700 hover:border-slate-500'
                    }`}>
                    <div className="font-semibold text-white">{t.label}</div>
                    <div className="text-slate-400 text-sm">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(2)} className="btn-primary w-full flex items-center justify-center gap-2">
              Next <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Technologies */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-2">Select Technologies</h2>
              <p className="text-slate-400 text-sm mb-4">
                Choose the technologies you want to be interviewed on. <span className="text-indigo-400">{form.technologies.length} selected</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {TECHNOLOGIES.map(t => (
                  <button key={t.id} onClick={() => toggleTech(t.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      form.technologies.includes(t.id)
                        ? 'border-indigo-500 bg-indigo-900/50 text-indigo-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                    }`}>
                    {form.technologies.includes(t.id) && '✓ '}{t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                <ChevronLeft size={18} /> Back
              </button>
              <button onClick={() => setStep(3)} disabled={form.technologies.length === 0}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Resume */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-2">Upload Resume</h2>
              <p className="text-slate-400 text-sm mb-4">
                Optional but recommended. AI will generate questions based on your projects and experience.
              </p>

              {resumeUploaded ? (
                <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-700/50 rounded-xl">
                  <CheckCircle className="text-green-400" size={20} />
                  <div>
                    <div className="text-green-400 font-medium">Resume uploaded!</div>
                    <div className="text-slate-400 text-sm">AI will use your resume for personalized questions</div>
                  </div>
                </div>
              ) : (
                <>
                  <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragActive ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 hover:border-slate-500'
                  }`}>
                    <input {...getInputProps()} />
                    <Upload className="mx-auto text-slate-500 mb-3" size={32} />
                    {resumeFile ? (
                      <div>
                        <p className="text-white font-medium">{resumeFile.name}</p>
                        <p className="text-slate-400 text-sm mt-1">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-400">Drop your resume here or click to browse</p>
                        <p className="text-slate-500 text-sm mt-1">PDF or DOCX, max 5MB</p>
                      </>
                    )}
                  </div>

                  {resumeFile && (
                    <div className="flex gap-3 mt-3">
                      <button onClick={() => setResumeFile(null)} className="btn-secondary flex items-center gap-2">
                        <X size={16} /> Remove
                      </button>
                      <button onClick={handleUploadResume} disabled={uploading}
                        className="btn-primary flex-1 flex items-center justify-center gap-2">
                        {uploading ? <><Loader size={16} className="animate-spin" /> Uploading...</> : 'Upload Resume'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2">
                <ChevronLeft size={18} /> Back
              </button>
              <button onClick={handleCreate} disabled={creating}
                className="btn-primary flex-1 flex items-center justify-center gap-2 text-lg py-4">
                {creating ? <><Loader size={20} className="animate-spin" /> Creating Interview...</>
                  : '🚀 Start Interview'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
