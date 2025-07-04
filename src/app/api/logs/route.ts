import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const logs = await prisma.urlCheck.findMany({
      include: {
        monitoredUrl: {
          select: {
            name: true,
            url: true
          }
        },
        notifications: {
          select: {
            emailSent: true,
            emailSentAt: true,
            changesSummary: true
          },
          take: 1
        }
      },
      orderBy: { checkTime: 'desc' },
      take: 100
    })

    const formattedLogs = logs.map(log => ({
      id: log.id,
      url_id: log.urlId,
      content_hash: log.contentHash,
      content_preview: log.contentPreview,
      changes_detected: log.changesDetected,
      check_time: log.checkTime,
      error_message: log.errorMessage,
      url_name: log.monitoredUrl.name,
      url: log.monitoredUrl.url,
      email_sent: log.notifications[0]?.emailSent || null,
      email_sent_at: log.notifications[0]?.emailSentAt || null,
      changes_summary: log.notifications[0]?.changesSummary || null
    }))

    return NextResponse.json({ logs: formattedLogs })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}