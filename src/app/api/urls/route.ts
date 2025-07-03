import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { initializeDatabase } from '@/lib/db'

export async function GET() {
  try {
    await initializeDatabase()
    
    const result = await sql`
      SELECT 
        mu.*,
        uc.check_time as last_check_time,
        uc.changes_detected as last_changes_detected,
        uc.error_message as last_error
      FROM monitored_urls mu
      LEFT JOIN url_checks uc ON mu.id = uc.url_id 
        AND uc.check_time = (
          SELECT MAX(check_time) 
          FROM url_checks 
          WHERE url_id = mu.id
        )
      ORDER BY mu.created_at DESC
    `

    return NextResponse.json({ urls: result.rows })
  } catch (error) {
    console.error('Error fetching URLs:', error)
    return NextResponse.json({ error: 'Failed to fetch URLs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    
    const { url, name, checkInterval } = await request.json()

    if (!url || !name) {
      return NextResponse.json({ error: 'URL and name are required' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO monitored_urls (url, name, check_interval)
      VALUES (${url}, ${name}, ${checkInterval || 60})
      RETURNING *
    `

    return NextResponse.json({ url: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating URL:', error)
    return NextResponse.json({ error: 'Failed to create URL' }, { status: 500 })
  }
}