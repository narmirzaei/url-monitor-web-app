// Utility for making authenticated API requests
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  // Get stored credentials from localStorage
  const storedCredentials = localStorage.getItem('url-monitor-auth')
  
  if (storedCredentials) {
    const { username, password } = JSON.parse(storedCredentials)
    const encoded = btoa(`${username}:${password}`)
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Basic ${encoded}`
      }
    })
  }
  
  // If no stored credentials, make request without auth
  return fetch(url, options)
}

// Store credentials in localStorage
export function storeCredentials(username: string, password: string) {
  localStorage.setItem('url-monitor-auth', JSON.stringify({ username, password }))
}

// Clear stored credentials
export function clearCredentials() {
  localStorage.removeItem('url-monitor-auth')
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return localStorage.getItem('url-monitor-auth') !== null
} 