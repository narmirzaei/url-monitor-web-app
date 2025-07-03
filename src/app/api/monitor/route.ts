import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { extractPageContent, generateContentHash } from '@/lib/browser'
import { sendChangeNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { urlId } = await request.json()

    if (!urlId) {
      return NextResponse.json({ error: 'URL ID is required' }, { status: 400 })
    }

    const urlResult = await sql`
      SELECT * FROM monitored_urls 
      WHERE id = ${urlId} AND is_active = true
    `

    if (urlResult.rows.length === 0) {
      return NextResponse.json({ error: 'URL not found or inactive' }, { status: 404 })
    }

    const monitoredUrl = urlResult.rows[0]
    
    try {
      const content = await extractPageContent(monitoredUrl.url)
      const contentHash = generateContentHash(content)
      
      const previousHash = monitoredUrl.last_content_hash
      const changesDetected = previousHash && previousHash !== contentHash
      
      const contentPreview = content.substring(0, 500) + (content.length > 500 ? '...' : '')

      const checkResult = await sql`
        INSERT INTO url_checks (url_id, content_hash, content_preview, changes_detected)
        VALUES (${urlId}, ${contentHash}, ${contentPreview}, ${changesDetected})
        RETURNING *
      `

      await sql`
        UPDATE monitored_urls 
        SET last_content_hash = ${contentHash}, last_check = CURRENT_TIMESTAMP
        WHERE id = ${urlId}
      `

      if (changesDetected) {
        try {
          await sendChangeNotification(monitoredUrl, checkResult.rows[0])
          
          await sql`
            INSERT INTO notifications (url_id, check_id, email_sent, email_sent_at, changes_summary)
            VALUES (${urlId}, ${checkResult.rows[0].id}, true, CURRENT_TIMESTAMP, 'Content changes detected')
          `
        } catch (emailError) {
          console.error('Failed to send notification:', emailError)
          
          await sql`
            INSERT INTO notifications (url_id, check_id, email_sent, changes_summary)
            VALUES (${urlId}, ${checkResult.rows[0].id}, false, 'Content changes detected - email failed')
          `
        }
      }

      return NextResponse.json({
        success: true,
        changesDetected,
        contentHash,
        checkId: checkResult.rows[0].id
      })

    } catch (error) {
      console.error('Error during content extraction:', error)
      
      await sql`
        INSERT INTO url_checks (url_id, content_hash, changes_detected, error_message)
        VALUES (${urlId}, '', false, ${error instanceof Error ? error.message : 'Unknown error'})
      `

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