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
        fullContent: content, // Store the full content for diff comparison
        changesDetected: !!changesDetected
      }
    })

    if (changesDetected) {
      try {
        // Get the previous check record to compare content
        const previousCheck = await prisma.urlCheck.findFirst({
          where: { 
            urlId,
            id: { not: checkResult.id } // Exclude the current check
          },
          orderBy: { checkTime: 'desc' }
        })
        
        const previousContent = previousCheck?.fullContent || previousCheck?.contentPreview || 'No previous content available'
        
        await sendChangeNotification(monitoredUrl, checkResult, previousContent, content)
        
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

    // Update the URL's last check timestamp and content hash AFTER processing changes
    await prisma.monitoredUrl.update({
      where: { id: urlId },
      data: {
        lastContentHash: contentHash,
        lastCheck: new Date()
      }
    })

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
    message: 'Check all endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}

export async function POST() {
  console.log('🕐 Main cron job triggered at:', new Date().toISOString())
  
  try {
    // Check ALL active URLs (this is for manual "Check All" button)
    const urlsToCheck = await prisma.monitoredUrl.findMany({
      where: {
        isActive: true
      },
      select: { id: true, checkInterval: true, lastCheck: true }
    })

    console.log(`📊 Found ${urlsToCheck.length} active URLs to check`)

    // For manual "Check All" button, check ALL URLs regardless of interval
    const urlsDueForCheck = urlsToCheck.map((url: { id: number; checkInterval: number; lastCheck: Date | null }) => {
      console.log(`✅ Manual check for URL ${url.id}. Interval: ${url.checkInterval}min`)
      return url
    })

    console.log(`🎯 ${urlsDueForCheck.length} URLs will be checked manually`)

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

    console.log(`🏁 Main cron job completed. Checked: ${urlsDueForCheck.length}, Results:`, results)

    return NextResponse.json({
      success: true,
      checkedUrls: urlsDueForCheck.length,
      totalActiveUrls: urlsToCheck.length,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in check-all API:', error)
    return NextResponse.json({ error: 'Failed to check URLs' }, { status: 500 })
  }
}