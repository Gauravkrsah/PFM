// API Configuration for different environments
const API_CONFIG = {
  development: {
    baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'
  },
  production: {
    // Vercel backend URL
    baseURL: process.env.REACT_APP_API_BASE_URL || 'https://pfm-xi.vercel.app'
  }
}

const environment = process.env.NODE_ENV || 'development'

export const API_BASE_URL = API_CONFIG[environment].baseURL

export default API_CONFIG