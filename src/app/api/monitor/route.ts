import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractPageContent, generateContentHash } from '@/lib/browser'
import { extractContentSimple, extractContentWithAlternatives } from '@/lib/content-extractor'
import { sendChangeNotification } from '@/lib/email'

// Retry mechanism with different strategies
async function extractContentWithRetry(url: string, maxRetries = 3): Promise<string> {
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ]

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1} for URL: ${url}`)
      
      // Add delay between retries
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
      }

      // Try simple HTTP extraction first (more reliable in Vercel)
      try {
        return await extractContentSimple(url)
      } catch (simpleError) {
        console.log(`Simple extraction attempt ${attempt + 1} failed:`, simpleError)
        
        // If it's a 403 error, try alternative extraction methods
        if (simpleError instanceof Error && simpleError.message.includes('403')) {
          console.log('403 error detected, trying alternative extraction methods...')
          try {
            return await extractContentWithAlternatives(url)
          } catch (altError) {
            console.log('Alternative extraction also failed:', altError)
          }
        }
        
        // Only try Playwright as a last resort
        if (attempt === maxRetries - 1) {
          try {
            console.log('Trying Playwright as final fallback...')
            return await extractPageContent(url)
          } catch (playwrightError) {
            console.log('Playwright also failed:', playwrightError)
            throw simpleError // Throw the original simple error
          }
        }
      }
    } catch (error) {
      console.log(`Attempt ${attempt + 1} failed:`, error)
      
      if (attempt === maxRetries - 1) {
        throw error
      }
    }
  }
  
  throw new Error('All extraction attempts failed')
}

export async function POST(request: NextRequest) {
  try {
    const { urlId } = await request.json()

    if (!urlId) {
      return NextResponse.json({ error: 'URL ID is required' }, { status: 400 })
    }

    const monitoredUrl = await prisma.monitoredUrl.findFirst({
      where: { 
        id: urlId,
        isActive: true
      }
    })

    if (!monitoredUrl) {
      return NextResponse.json({ error: 'URL not found or inactive' }, { status: 404 })
    }
    
    try {
      const content = await extractContentWithRetry(monitoredUrl.url)
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

      return NextResponse.json({
        success: true,
        changesDetected: !!changesDetected,
        contentHash,
        checkId: checkResult.id
      })

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

      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in monitor API:', error)
    return NextResponse.json({ error: 'Failed to monitor URL' }, { status: 500 })
  }
}