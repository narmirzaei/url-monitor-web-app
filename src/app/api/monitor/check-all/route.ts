import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const urlsToCheck = await prisma.monitoredUrl.findMany({
      where: {
        isActive: true,
        OR: [
          { lastCheck: null },
          {
            lastCheck: {
              lt: new Date(Date.now() - 60000) // 1 minute ago, will be multiplied by checkInterval
            }
          }
        ]
      },
      select: { id: true, checkInterval: true, lastCheck: true }
    })

    // Filter URLs that are actually due for checking based on their individual intervals
    const urlsDueForCheck = urlsToCheck.filter(url => {
      if (!url.lastCheck) return true
      const intervalMs = url.checkInterval * 60000 // Convert minutes to milliseconds
      const timeSinceLastCheck = Date.now() - url.lastCheck.getTime()
      return timeSinceLastCheck >= intervalMs
    })

    const results = []

    for (const url of urlsDueForCheck) {
      try {
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : 'http://localhost:3000'
        
        const response = await fetch(`${baseUrl}/api/monitor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urlId: url.id })
        })
        
        const result = await response.json()
        results.push({ urlId: url.id, ...result })
      } catch (error) {
        console.error(`Failed to check URL ${url.id}:`, error)
        results.push({ 
          urlId: url.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return NextResponse.json({
      success: true,
      checkedUrls: urlsDueForCheck.length,
      totalActiveUrls: urlsToCheck.length,
      results
    })

  } catch (error) {
    console.error('Error in check-all API:', error)
    return NextResponse.json({ error: 'Failed to check URLs' }, { status: 500 })
  }
}