import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const urls = await prisma.monitoredUrl.findMany({
      include: {
        urlChecks: {
          orderBy: { checkTime: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const urlsWithLastCheck = urls.map(url => ({
      id: url.id,
      url: url.url,
      name: url.name,
      check_interval: url.checkInterval,
      is_active: url.isActive,
      last_check: url.lastCheck,
      last_content_hash: url.lastContentHash,
      created_at: url.createdAt,
      updated_at: url.updatedAt,
      last_check_time: url.urlChecks[0]?.checkTime || null,
      last_changes_detected: url.urlChecks[0]?.changesDetected || null,
      last_error: url.urlChecks[0]?.errorMessage || null
    }))

    return NextResponse.json({ urls: urlsWithLastCheck })
  } catch (error) {
    console.error('Error fetching URLs:', error)
    return NextResponse.json({ error: 'Failed to fetch URLs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, name, checkInterval } = await request.json()

    if (!url || !name) {
      return NextResponse.json({ error: 'URL and name are required' }, { status: 400 })
    }

    const newUrl = await prisma.monitoredUrl.create({
      data: {
        url,
        name,
        checkInterval: checkInterval || 60
      }
    })

    return NextResponse.json({ url: newUrl }, { status: 201 })
  } catch (error) {
    console.error('Error creating URL:', error)
    return NextResponse.json({ error: 'Failed to create URL' }, { status: 500 })
  }
}