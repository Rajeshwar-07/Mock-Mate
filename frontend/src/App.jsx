import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import SetupPage from './pages/SetupPage'
import InterviewPage from './pages/InterviewPage'
import ResultPage from './pages/ResultPage'
import HistoryPage from './pages/HistoryPage'
import AdminPage from './pages/AdminPage'

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
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
