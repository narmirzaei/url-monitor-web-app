import { NextResponse } from 'next/server'
import { sendChangeNotification } from '@/lib/email'

export async function GET() {
  try {
    // Simulate the data that would be passed to the email function
    const mockMonitoredUrl = {
      id: 1,
      name: "Test Website",
      url: "https://example.com"
    }
    
    const mockCheckResult = {
      id: 123,
      checkTime: new Date(),
      contentHash: "abc123def456",
      contentPreview: "This is the new content preview..."
    }
    
    const previousContent = "This is the old content. It has some text that will be changed."
    const currentContent = "This is the new content. It has different text now."
    
    console.log('🧪 TEST: About to send email with diff...')
    console.log('Previous content length:', previousContent.length)
    console.log('Current content length:', currentContent.length)
    console.log('Previous content:', previousContent.substring(0, 100) + '...')
    console.log('Current content:', currentContent.substring(0, 100) + '...')
    
    // Try to send the email
    await sendChangeNotification(mockMonitoredUrl, mockCheckResult, previousContent, currentContent)
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      timestamp: new Date().toISOString(),
      testData: {
        previousContentLength: previousContent.length,
        currentContentLength: currentContent.length,
        hasPreviousContent: !!previousContent,
        hasCurrentContent: !!currentContent
      }
    })
    
  } catch (error) {
    console.error('❌ TEST: Email sending failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 