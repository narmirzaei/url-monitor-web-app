import crypto from 'crypto'

// Rotating user agents to avoid detection
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0'
]

// Alternative referers to try
const REFERERS = [
  'https://www.google.com/',
  'https://www.bing.com/',
  'https://www.facebook.com/',
  'https://twitter.com/',
  'https://www.linkedin.com/',
  'https://www.reddit.com/',
  undefined // No referer
]

// Simple HTTP-based content extraction as fallback
export async function extractContentSimple(url: string): Promise<string> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
    // Randomly select a user agent
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
    
    // Enhanced headers to better mimic a real browser
    const headers = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Referer': 'https://www.google.com/',
      'X-Requested-With': 'XMLHttpRequest'
    }
    
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      redirect: 'follow'
    })
    
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    
    // Simple HTML to text conversion
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim()

    return textContent
  } catch (error) {
    console.error('Simple content extraction failed:', error)
    throw error
  }
}

// Alternative extraction method for sites with aggressive anti-bot protection
export async function extractContentWithAlternatives(url: string): Promise<string> {
  const errors: string[] = []
  
  // Try different referers
  for (const referer of REFERERS) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
      
      const headers: Record<string, string> = {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
      
      if (referer) {
        headers['Referer'] = referer
      }
      
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'follow'
      })
      
      clearTimeout(timeoutId)

      if (response.ok) {
        const html = await response.text()
        
        const textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim()

        if (textContent.length > 50) { // Ensure we got meaningful content
          return textContent
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Referer ${referer || 'none'}: ${errorMsg}`)
      continue
    }
  }
  
  throw new Error(`All alternative extraction methods failed: ${errors.join('; ')}`)
}

export function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
} 