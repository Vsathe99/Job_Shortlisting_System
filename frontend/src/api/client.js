import axios from 'axios'

const api = axios.create({
    baseURL: '',   // Vite proxy handles routing to 8000
    timeout: 30000,
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('ats_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Global Error Handler
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            localStorage.removeItem('ats_token')
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login'
            }
        }

        // Format Pydantic/FastAPI validation errors
        if (error.response?.data?.detail) {
            const detail = error.response.data.detail
            if (Array.isArray(detail)) {
                // Transform Pydantic V2 error list into a single string
                error.response.data.detail = detail
                    .map(err => `${err.loc.join('.')}: ${err.msg}`)
                    .join(' | ')
            }
        }

        return Promise.reject(error)
    }
)

export default api
