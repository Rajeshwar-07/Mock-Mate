import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import SetupPage from './pages/SetupPage'
import InterviewPage from './pages/InterviewPage'
import ResultPage from './pages/ResultPage'
import HistoryPage from './pages/HistoryPage'
import AdminPage from './pages/AdminPage'

// Keeps the Python AI service alive by pinging every 30 seconds
// Prevents Render free tier from going inactive (sleeps after 15 min idle)
function useKeepAiAlive() {
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || ''
    const ping = () => {
      fetch(`${base}/health/ai`, { signal: AbortSignal.timeout(10000) })
        .catch(() => {})
    }
    ping()
    const interval = setInterval(ping, 30000)
    return () => clearInterval(interval)
  }, [])
}

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  useKeepAiAlive()
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/setup" element={<PrivateRoute><SetupPage /></PrivateRoute>} />
      <Route path="/interview/:token" element={<PrivateRoute><InterviewPage /></PrivateRoute>} />
      <Route path="/result/:token" element={<PrivateRoute><ResultPage /></PrivateRoute>} />
      <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
