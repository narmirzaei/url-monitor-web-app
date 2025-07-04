import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { url, name, checkInterval, is_active } = await request.json()
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    const updatedUrl = await prisma.monitoredUrl.update({
      where: { id },
      data: {
        url,
        name,
        checkInterval,
        isActive: is_active
      }
    })

    return NextResponse.json({ url: updatedUrl })
  } catch (error) {
    console.error('Error updating URL:', error)
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }
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

    await prisma.monitoredUrl.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'URL deleted successfully' })
  } catch (error) {
    console.error('Error deleting URL:', error)
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete URL' }, { status: 500 })
  }
}