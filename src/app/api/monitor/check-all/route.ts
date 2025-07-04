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
    const urlsDueForCheck = urlsToCheck.filter((url: { id: number; checkInterval: number; lastCheck: Date | null }) => {
      if (!url.lastCheck) return true
      const intervalMs = url.checkInterval * 60000 // Convert minutes to milliseconds
      const timeSinceLastCheck = Date.now() - url.lastCheck.getTime()
      return timeSinceLastCheck >= intervalMs
    })

    const results = []

    for (const url of urlsDueForCheck) {
      try {
        const result = await checkSingleUrl(url.id)
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