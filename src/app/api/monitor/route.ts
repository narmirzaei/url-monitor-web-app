import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractPageContent, generateContentHash } from '@/lib/browser'
import { extractContentSimple } from '@/lib/content-extractor'
import { sendChangeNotification } from '@/lib/email'

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