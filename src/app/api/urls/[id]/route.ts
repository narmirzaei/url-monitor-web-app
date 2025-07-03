import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { url, name, checkInterval, isActive } = await request.json()
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    const result = await sql`
      UPDATE monitored_urls 
      SET 
        url = ${url},
        name = ${name},
        check_interval = ${checkInterval},
        is_active = ${isActive},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    return NextResponse.json({ url: result.rows[0] })
  } catch (error) {
    console.error('Error updating URL:', error)
    return NextResponse.json({ error: 'Failed to update URL' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    const result = await sql`
      DELETE FROM monitored_urls 
      WHERE id = ${id}
      RETURNING *
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'URL deleted successfully' })
  } catch (error) {
    console.error('Error deleting URL:', error)
    return NextResponse.json({ error: 'Failed to delete URL' }, { status: 500 })
  }
}