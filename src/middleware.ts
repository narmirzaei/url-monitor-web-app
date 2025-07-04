import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export function middleware(request: NextRequest) {
  // Skip authentication for API routes (except specific ones we want to protect)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Allow cron endpoint to work without auth (needed for Vercel cron)
    if (request.nextUrl.pathname === '/api/cron') {
      return NextResponse.next()
    }
    
    // Allow other API endpoints to work without auth for now
    // You can add specific protection later if needed
    return NextResponse.next()
  }
  
  // Skip authentication for static files
  if (request.nextUrl.pathname.startsWith('/_next/') || 
      request.nextUrl.pathname.startsWith('/favicon.ico')) {
    return NextResponse.next()
  }
  
  // Check authentication for all other routes
  if (!isAuthenticated(request)) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="URL Monitor"',
      },
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 