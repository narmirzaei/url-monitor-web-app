import { NextResponse } from 'next/server'
import { generateEmailDiff, generateSimpleDiff } from '@/lib/diff'

export async function GET() {
  // Test the diff functionality with sample content
  const oldContent = "This is the old content. It has some text that will be changed."
  const newContent = "This is the new content. It has different text now."
  
  const emailDiff = generateEmailDiff(oldContent, newContent)
  const simpleDiff = generateSimpleDiff(oldContent, newContent)
  
  return NextResponse.json({
    message: 'Diff functionality test',
    timestamp: new Date().toISOString(),
    emailDiff,
    simpleDiff,
    test: {
      oldContent,
      newContent,
      hasChanges: emailDiff.hasChanges
    }
  })
} 