import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function GET() {
  try {
    const result = await sql`
      SELECT 
        uc.id,
        uc.url_id,
        uc.content_hash,
        uc.content_preview,
        uc.changes_detected,
        uc.check_time,
        uc.error_message,
        mu.name as url_name,
        mu.url,
        n.email_sent,
        n.email_sent_at,
        n.changes_summary
      FROM url_checks uc
      JOIN monitored_urls mu ON uc.url_id = mu.id
      LEFT JOIN notifications n ON uc.id = n.check_id
      ORDER BY uc.check_time DESC
      LIMIT 100
    `

    return NextResponse.json({ logs: result.rows })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}