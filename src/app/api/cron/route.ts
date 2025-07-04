import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractPageContent, generateContentHash } from '@/lib/browser'
import { extractContentSimple } from '@/lib/content-extractor'
import { sendChangeNotification } from '@/lib/email'

async function checkSingleUrl(urlId: number) {
  try {
    const monitoredUrl = await prisma.monitoredUrl.findFirst({
      where: { 
        id: urlId,
        isActive: true
      }
    })

    if (!monitoredUrl) {
      return { success: false, error: 'URL not found or inactive' }
    }
    
    let content: string
    try {
      // Try Playwright first
      content = await extractPageContent(monitoredUrl.url)
    } catch (playwrightError) {
      console.log('Playwright failed, using fallback method:', playwrightError)
      // Fallback to simple HTTP extraction
      content = await extractContentSimple(monitoredUrl.url)
    }
    
    const contentHash = generateContentHash(content)
    
    const previousHash = monitoredUrl.lastContentHash
    const changesDetected = previousHash && previousHash !== contentHash
    
    const contentPreview = content.substring(0, 500) + (content.length > 500 ? '...' : '')

    const checkResult = await prisma.urlCheck.create({
      data: {
        urlId,
        contentHash,
        contentPreview,
        changesDetected: !!changesDetected
      }
    })

    await prisma.monitoredUrl.update({
      where: { id: urlId },
      data: {
        lastContentHash: contentHash,
        lastCheck: new Date() // This will be stored as UTC in the database
      }
    })

    if (changesDetected) {
      try {
        await sendChangeNotification(monitoredUrl, checkResult)
        
        await prisma.notification.create({
          data: {
            urlId,
            checkId: checkResult.id,
            emailSent: true,
            emailSentAt: new Date(), // UTC timestamp
            changesSummary: 'Content changes detected'
          }
        })
      } catch (emailError) {
        console.error('Failed to send notification:', emailError)
        
        await prisma.notification.create({
          data: {
            urlId,
            checkId: checkResult.id,
            emailSent: false,
            changesSummary: 'Content changes detected - email failed'
          }
        })
      }
    }

    return {
      success: true,
      changesDetected: !!changesDetected,
      contentHash,
      checkId: checkResult.id
    }

  } catch (error) {
    console.error('Error during content extraction:', error)
    
    await prisma.urlCheck.create({
      data: {
        urlId,
        contentHash: '',
        changesDetected: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function GET() {
  // Test endpoint to verify the route is working
  return NextResponse.json({
    message: 'Cron endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}

export async function POST() {
  const now = new Date()
  console.log('🕐 Cron job triggered at:', now.toISOString())
  console.log('🌍 Current timezone offset:', now.getTimezoneOffset(), 'minutes')
  console.log('🕐 Local time:', now.toString())
  console.log('🕐 UTC time:', now.toISOString())
  
  try {
    // Get all active URLs
    const allActiveUrls = await prisma.monitoredUrl.findMany({
      where: {
        isActive: true
      },
      select: { id: true, checkInterval: true, lastCheck: true }
    })

    console.log(`📊 Found ${allActiveUrls.length} active URLs`)

    // Filter URLs that are due for checking based on their individual intervals
    const urlsDueForCheck = allActiveUrls.filter((url: { id: number; checkInterval: number; lastCheck: Date | null }) => {
      if (!url.lastCheck) return true // Never checked before
      
      const intervalMs = url.checkInterval * 60000 // Convert minutes to milliseconds
      
      // Use UTC time for consistent calculations
      // Vercel cron jobs run in UTC, so we need to ensure all time calculations are in UTC
      const nowUtc = new Date().getTime()
      const lastCheckUtc = url.lastCheck.getTime()
      const timeSinceLastCheck = nowUtc - lastCheckUtc
      
      // For very frequent checks (1-5 minutes), be more lenient with timing
      let isDue: boolean
      if (url.checkInterval <= 5) {
        // For frequent checks, allow checking if it's been at least 80% of the interval
        const minTimeMs = intervalMs * 0.8
        isDue = timeSinceLastCheck >= minTimeMs
      } else {
        // For less frequent checks, use the full interval
        isDue = timeSinceLastCheck >= intervalMs
      }
      
      // For debugging: log all URLs and their status with UTC timestamps
      const lastCheckUtcString = url.lastCheck.toISOString()
      if (isDue) {
        console.log(`✅ URL ${url.id} is due for check. Interval: ${url.checkInterval}min, Time since last check: ${Math.round(timeSinceLastCheck / 60000)}min, Last check (UTC): ${lastCheckUtcString}`)
      } else {
        console.log(`⏳ URL ${url.id} not due yet. Interval: ${url.checkInterval}min, Time since last check: ${Math.round(timeSinceLastCheck / 60000)}min, Last check (UTC): ${lastCheckUtcString}`)
      }
      
      return isDue
    })

    console.log(`🎯 ${urlsDueForCheck.length} URLs are due for checking`)
    
    // Log summary of all URLs
    console.log('📋 Summary of all URLs:')
    allActiveUrls.forEach((url: { id: number; checkInterval: number; lastCheck: Date | null }) => {
      const timeSinceLastCheck = url.lastCheck ? Math.round((new Date().getTime() - url.lastCheck.getTime()) / 60000) : 'Never'
      const isDue = urlsDueForCheck.some((u: { id: number; checkInterval: number; lastCheck: Date | null }) => u.id === url.id)
      const lastCheckUtc = url.lastCheck ? url.lastCheck.toISOString() : 'Never'
      console.log(`  URL ${url.id}: Interval=${url.checkInterval}min, Last check=${timeSinceLastCheck}min ago (UTC: ${lastCheckUtc}), Due=${isDue}`)
    })
    
    // Additional timezone debugging
    console.log('🕐 Timezone Debug Info:')
    console.log('  - Vercel cron jobs run in UTC')
    console.log('  - Database timestamps are stored in UTC')
    console.log('  - All time calculations use UTC timestamps')
    console.log('  - Current UTC time:', new Date().toISOString())

    const results = []

    for (const url of urlsDueForCheck) {
      try {
        console.log(`🔍 Checking URL ${url.id}...`)
        const result = await checkSingleUrl(url.id)
        results.push({ urlId: url.id, ...result })
        console.log(`✅ URL ${url.id} check completed:`, result.success ? 'SUCCESS' : 'FAILED')
      } catch (error) {
        console.error(`❌ Failed to check URL ${url.id}:`, error)
        results.push({ 
          urlId: url.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    console.log(`🏁 Cron job completed. Checked: ${urlsDueForCheck.length}, Results:`, results)

    return NextResponse.json({
      success: true,
      checkedUrls: urlsDueForCheck.length,
      totalActiveUrls: allActiveUrls.length,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error in cron API:', error)
    return NextResponse.json({ error: 'Failed to check URLs' }, { status: 500 })
  }
} 