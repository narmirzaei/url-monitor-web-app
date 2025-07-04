import { NextRequest, NextResponse } from 'next/server'

// Simple authentication check
export function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false
  }
  
  const encoded = authHeader.substring(6)
  const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
  const [username, password] = decoded.split(':')
  
  // Check against environment variables
  const expectedUsername = process.env.BASIC_AUTH_USERNAME || 'admin'
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD
  
  if (!expectedPassword) {
    console.warn('BASIC_AUTH_PASSWORD not set - authentication disabled')
    return true // Allow access if no password is set
  }
  
  return username === expectedUsername && password === expectedPassword
}

// Middleware function to protect routes
export function withAuth(handler: Function) {
  return async (request: NextRequest) => {
    if (!isAuthenticated(request)) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="URL Monitor"',
        },
      })
    }
    
    return handler(request)
  }
}

// Helper to get auth headers for client requests
export function getAuthHeaders(): HeadersInit {
  const username = process.env.BASIC_AUTH_USERNAME || 'admin'
  const password = process.env.BASIC_AUTH_PASSWORD
  
  if (!password) {
    return {}
  }
  
  const encoded = Buffer.from(`${username}:${password}`).toString('base64')
  return {
    'Authorization': `Basic ${encoded}`
  }
} 