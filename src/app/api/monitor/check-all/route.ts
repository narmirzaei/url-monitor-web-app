import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function POST() {
  try {
    const result = await sql`
      SELECT id FROM monitored_urls 
      WHERE is_active = true 
      AND (
        last_check IS NULL 
        OR last_check < NOW() - INTERVAL '1 minute' * check_interval
      )
    `

    const urlsToCheck = result.rows
    const results = []

    for (const url of urlsToCheck) {
      try {
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/monitor`, {
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
      checkedUrls: urlsToCheck.length,
      results
    })

  } catch (error) {
    console.error('Error in check-all API:', error)
    return NextResponse.json({ error: 'Failed to check URLs' }, { status: 500 })
  }
}