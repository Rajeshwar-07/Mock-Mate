import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
}

export const interviewApi = {
  create: (data) => api.post('/interviews', data),
  getAll: () => api.get('/interviews'),
  getByToken: (token) => api.get(`/interviews/${token}`),
  start: (token) => api.post(`/interviews/${token}/start`),
  submitAnswer: (token, data) => api.post(`/interviews/${token}/answer`, data),
  complete: (token) => api.post(`/interviews/${token}/complete`),
}

export const resumeApi = {
  upload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  get: () => api.get('/resume'),
  delete: () => api.delete('/resume'),
}

export default api
