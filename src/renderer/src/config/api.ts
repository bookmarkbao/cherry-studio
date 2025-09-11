import { Configuration, DefaultApi } from '@cherrystudio/api-sdk'
import { logout } from '@renderer/hooks/useAuth'
import axios from 'axios'

const config = new Configuration({
  basePath: '',
  accessToken: localStorage.getItem('auth_token') || ''
})

// Create axios instance with interceptor
const axiosInstance = axios.create()

// Add response interceptor to handle 401 unauthorized responses
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout()
    }
    return Promise.reject(error)
  }
)

const api = new DefaultApi(config, undefined, axiosInstance as any)

export const updateApiToken = (token: string) => {
  config.accessToken = token
}

export const updateApiBasePath = (basePath: string) => {
  config.basePath = basePath
}

export default api
