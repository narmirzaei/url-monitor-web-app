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
        lastCheck: new Date()
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
            emailSentAt: new Date(),
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
    message: 'Check frequent endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}

export async function POST() {
  console.log('🕐 Frequent cron job triggered at:', new Date().toISOString())
  
  try {
    // Check URLs that need frequent monitoring (1-5 minutes)
    const frequentUrls = await prisma.monitoredUrl.findMany({
      where: {
        isActive: true,
        checkInterval: {
          lte: 5 // 5 minutes or less
        }
      },
      select: { id: true, checkInterval: true, lastCheck: true }
    })

    console.log(`📊 Found ${frequentUrls.length} frequent URLs to check`)

    const urlsDueForCheck = frequentUrls.filter((url: { id: number; checkInterval: number; lastCheck: Date | null }) => {
      if (!url.lastCheck) return true
      
      const intervalMs = url.checkInterval * 60000
      const timeSinceLastCheck = Date.now() - url.lastCheck.getTime()
      const isDue = timeSinceLastCheck >= intervalMs
      
      if (isDue) {
        console.log(`✅ Frequent URL ${url.id} is due. Interval: ${url.checkInterval}min, Time since last check: ${Math.round(timeSinceLastCheck / 60000)}min`)
      } else {
        console.log(`⏳ Frequent URL ${url.id} not due yet. Interval: ${url.checkInterval}min, Time since last check: ${Math.round(timeSinceLastCheck / 60000)}min`)
      }
      
      return isDue
    })

    console.log(`🎯 ${urlsDueForCheck.length} frequent URLs are due for checking`)

    const results = []

    for (const url of urlsDueForCheck) {
      try {
        console.log(`🔍 Checking frequent URL ${url.id}...`)
        const result = await checkSingleUrl(url.id)
        results.push({ urlId: url.id, ...result })
        console.log(`✅ Frequent URL ${url.id} check completed:`, result.success ? 'SUCCESS' : 'FAILED')
      } catch (error) {
        console.error(`❌ Failed to check frequent URL ${url.id}:`, error)
        results.push({ 
          urlId: url.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    console.log(`🏁 Frequent cron job completed. Checked: ${urlsDueForCheck.length}, Results:`, results)

    return NextResponse.json({
      success: true,
      checkedUrls: urlsDueForCheck.length,
      totalFrequentUrls: frequentUrls.length,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error in check-frequent API:', error)
    return NextResponse.json({ error: 'Failed to check frequent URLs' }, { status: 500 })
  }
} 