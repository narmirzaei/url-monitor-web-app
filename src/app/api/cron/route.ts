import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractPageContent, generateContentHash } from '@/lib/browser'
import { extractContentSimple } from '@/lib/content-extractor'
import { sendChangeNotification } from '@/lib/email'

async function checkSingleUrl(urlId: number) {
  console.log(`    🔍 checkSingleUrl(${urlId}) - Starting...`)
  
  try {
    console.log(`    📊 Fetching URL details from database...`)
    const monitoredUrl = await prisma.monitoredUrl.findFirst({
      where: { 
        id: urlId,
        isActive: true
      }
    })

    if (!monitoredUrl) {
      console.log(`    ❌ URL ${urlId} not found or inactive`)
      return { success: false, error: 'URL not found or inactive' }
    }
    
    console.log(`    ✅ URL found: ${monitoredUrl.name} (${monitoredUrl.url})`)
    
    console.log(`    🌐 Starting content extraction...`)
    let content: string
    try {
      console.log(`    🎭 Attempting Playwright extraction...`)
      // Try Playwright first
      content = await extractPageContent(monitoredUrl.url)
      console.log(`    ✅ Playwright extraction successful, content length: ${content.length} characters`)
    } catch (playwrightError) {
      console.log(`    ⚠️  Playwright failed, using fallback method:`, playwrightError)
      console.log(`    🔄 Attempting simple HTTP extraction...`)
      // Fallback to simple HTTP extraction
      content = await extractContentSimple(monitoredUrl.url)
      console.log(`    ✅ Fallback extraction successful, content length: ${content.length} characters`)
    }
    
    console.log(`    🔐 Generating content hash...`)
    const contentHash = generateContentHash(content)
    console.log(`    ✅ Content hash generated: ${contentHash.substring(0, 8)}...`)
    
    const previousHash = monitoredUrl.lastContentHash
    console.log(`    📊 Previous hash: ${previousHash ? previousHash.substring(0, 8) + '...' : 'None (first check)'}`)
    
    const changesDetected = previousHash && previousHash !== contentHash
    console.log(`    🔍 Changes detected: ${changesDetected ? 'YES' : 'NO'}`)
    
    const contentPreview = content.substring(0, 500) + (content.length > 500 ? '...' : '')
    console.log(`    📝 Content preview generated (${contentPreview.length} chars)`)

    console.log(`    💾 Creating URL check record in database...`)
    const checkResult = await prisma.urlCheck.create({
      data: {
        urlId,
        contentHash,
        contentPreview,
        changesDetected: !!changesDetected
      }
    })
    console.log(`    ✅ URL check record created with ID: ${checkResult.id}`)

    console.log(`    🔄 Updating URL last check timestamp...`)
    await prisma.monitoredUrl.update({
      where: { id: urlId },
      data: {
        lastContentHash: contentHash,
        lastCheck: new Date() // This will be stored as UTC in the database
      }
    })
    console.log(`    ✅ URL last check timestamp updated`)

    if (changesDetected) {
      console.log(`    📧 Changes detected - sending email notification...`)
      try {
        console.log(`    📤 Sending email via SendGrid...`)
        await sendChangeNotification(monitoredUrl, checkResult)
        console.log(`    ✅ Email sent successfully`)
        
        console.log(`    💾 Creating notification record...`)
        await prisma.notification.create({
          data: {
            urlId,
            checkId: checkResult.id,
            emailSent: true,
            emailSentAt: new Date(), // UTC timestamp
            changesSummary: 'Content changes detected'
          }
        })
        console.log(`    ✅ Notification record created`)
      } catch (emailError) {
        console.error(`    ❌ Failed to send notification:`, emailError)
        console.error(`    ❌ Email error details:`, emailError instanceof Error ? emailError.message : 'Unknown error')
        
        console.log(`    💾 Creating failed notification record...`)
        await prisma.notification.create({
          data: {
            urlId,
            checkId: checkResult.id,
            emailSent: false,
            changesSummary: 'Content changes detected - email failed'
          }
        })
        console.log(`    ✅ Failed notification record created`)
      }
    } else {
      console.log(`    ℹ️  No changes detected - skipping email notification`)
    }

    console.log(`    ✅ checkSingleUrl(${urlId}) - Completed successfully`)
    return {
      success: true,
      changesDetected: !!changesDetected,
      contentHash,
      checkId: checkResult.id
    }

  } catch (error) {
    console.error(`    ❌ checkSingleUrl(${urlId}) - Error during content extraction:`, error)
    console.error(`    ❌ Error details:`, error instanceof Error ? error.message : 'Unknown error')
    console.error(`    ❌ Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
    
    console.log(`    💾 Creating error record in database...`)
    await prisma.urlCheck.create({
      data: {
        urlId,
        contentHash: '',
        changesDetected: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    console.log(`    ✅ Error record created`)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function GET() {
  // Test endpoint to verify the route is working
  return NextResponse.json({
    message: 'Cron endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}

export async function POST() {
  console.log('🚀 ==========================================')
  console.log('🚀 CRON JOB STARTED')
  console.log('🚀 ==========================================')
  
  const now = new Date()
  console.log('🕐 Cron job triggered at:', now.toISOString())
  console.log('🌍 Current timezone offset:', now.getTimezoneOffset(), 'minutes')
  console.log('🕐 Local time:', now.toString())
  console.log('🕐 UTC time:', now.toISOString())
  console.log('🕐 Current timestamp (ms):', now.getTime())
  
  try {
    console.log('📊 STEP 1: Fetching all active URLs from database...')
    
    // Get all active URLs
    const allActiveUrls = await prisma.monitoredUrl.findMany({
      where: {
        isActive: true
      },
      select: { id: true, checkInterval: true, lastCheck: true }
    })

    console.log(`📊 STEP 1 COMPLETE: Found ${allActiveUrls.length} active URLs`)
    console.log('📋 Raw URL data from database:')
    allActiveUrls.forEach((url: { id: number; checkInterval: number; lastCheck: Date | null }, index: number) => {
      console.log(`  ${index + 1}. URL ID: ${url.id}, Interval: ${url.checkInterval}min, Last Check: ${url.lastCheck ? url.lastCheck.toISOString() : 'NULL'}`)
    })

    console.log('🔍 STEP 2: Analyzing each URL for timing...')
    
    // Filter URLs that are due for checking based on their individual intervals
    const urlsDueForCheck = allActiveUrls.filter((url: { id: number; checkInterval: number; lastCheck: Date | null }) => {
      console.log(`\n🔍 ANALYZING URL ${url.id}:`)
      console.log(`  - Check Interval: ${url.checkInterval} minutes`)
      console.log(`  - Last Check: ${url.lastCheck ? url.lastCheck.toISOString() : 'NULL (never checked)'}`)
      
      if (!url.lastCheck) {
        console.log(`  ✅ DECISION: URL ${url.id} has never been checked before - WILL CHECK`)
        return true // Never checked before
      }
      
      const intervalMs = url.checkInterval * 60000 // Convert minutes to milliseconds
      console.log(`  - Interval in milliseconds: ${intervalMs}ms`)
      
      // Use UTC time for consistent calculations
      // Vercel cron jobs run in UTC, so we need to ensure all time calculations are in UTC
      const nowUtc = new Date().getTime()
      const lastCheckUtc = url.lastCheck.getTime()
      const timeSinceLastCheck = nowUtc - lastCheckUtc
      
      console.log(`  - Current UTC timestamp: ${nowUtc}`)
      console.log(`  - Last check UTC timestamp: ${lastCheckUtc}`)
      console.log(`  - Time since last check: ${timeSinceLastCheck}ms (${Math.round(timeSinceLastCheck / 60000)} minutes)`)
      
      // For very frequent checks (1-5 minutes), be more lenient with timing
      let isDue: boolean
      let reason: string
      
      if (url.checkInterval <= 5) {
        // For frequent checks, allow checking if it's been at least 80% of the interval
        const minTimeMs = intervalMs * 0.8
        isDue = timeSinceLastCheck >= minTimeMs
        reason = `Frequent check (≤5min): Need ${Math.round(minTimeMs / 60000)}min (80% of ${url.checkInterval}min), have ${Math.round(timeSinceLastCheck / 60000)}min`
      } else {
        // For less frequent checks, use the full interval
        isDue = timeSinceLastCheck >= intervalMs
        reason = `Less frequent check (>5min): Need ${url.checkInterval}min, have ${Math.round(timeSinceLastCheck / 60000)}min`
      }
      
      console.log(`  - Decision logic: ${reason}`)
      
      if (isDue) {
        console.log(`  ✅ DECISION: URL ${url.id} IS DUE FOR CHECK`)
      } else {
        console.log(`  ⏳ DECISION: URL ${url.id} NOT DUE YET`)
      }
      
      return isDue
    })

    console.log(`\n🎯 STEP 2 COMPLETE: ${urlsDueForCheck.length} URLs are due for checking`)
    
    if (urlsDueForCheck.length === 0) {
      console.log('⚠️  No URLs are due for checking at this time')
    } else {
      console.log('📋 URLs that will be checked:')
      urlsDueForCheck.forEach((url: { id: number; checkInterval: number; lastCheck: Date | null }, index: number) => {
        console.log(`  ${index + 1}. URL ID: ${url.id}, Interval: ${url.checkInterval}min`)
      })
    }
    
    // Log summary of all URLs
    console.log('\n📋 FINAL SUMMARY OF ALL URLs:')
    allActiveUrls.forEach((url: { id: number; checkInterval: number; lastCheck: Date | null }) => {
      const timeSinceLastCheck = url.lastCheck ? Math.round((new Date().getTime() - url.lastCheck.getTime()) / 60000) : 'Never'
      const isDue = urlsDueForCheck.some((u: { id: number; checkInterval: number; lastCheck: Date | null }) => u.id === url.id)
      const lastCheckUtc = url.lastCheck ? url.lastCheck.toISOString() : 'Never'
      console.log(`  URL ${url.id}: Interval=${url.checkInterval}min, Last check=${timeSinceLastCheck}min ago (UTC: ${lastCheckUtc}), Due=${isDue}`)
    })
    
    // Additional timezone debugging
    console.log('\n🕐 TIMEZONE DEBUG INFO:')
    console.log('  - Vercel cron jobs run in UTC')
    console.log('  - Database timestamps are stored in UTC')
    console.log('  - All time calculations use UTC timestamps')
    console.log('  - Current UTC time:', new Date().toISOString())

    console.log('\n🔍 STEP 3: Starting URL checks...')
    const results = []

    for (const url of urlsDueForCheck) {
      console.log(`\n🔍 CHECKING URL ${url.id}:`)
      console.log(`  - Starting check at: ${new Date().toISOString()}`)
      
      try {
        console.log(`  - Calling checkSingleUrl function...`)
        const result = await checkSingleUrl(url.id)
        
        console.log(`  - Check result received:`)
        console.log(`    * Success: ${result.success}`)
        console.log(`    * Changes Detected: ${result.changesDetected}`)
        console.log(`    * Content Hash: ${result.contentHash ? result.contentHash.substring(0, 8) + '...' : 'N/A'}`)
        console.log(`    * Check ID: ${result.checkId || 'N/A'}`)
        if (result.error) {
          console.log(`    * Error: ${result.error}`)
        }
        
        results.push({ urlId: url.id, ...result })
        console.log(`  ✅ URL ${url.id} check completed: ${result.success ? 'SUCCESS' : 'FAILED'}`)
      } catch (error) {
        console.error(`  ❌ Exception during URL ${url.id} check:`, error)
        console.error(`  ❌ Error details:`, error instanceof Error ? error.message : 'Unknown error')
        console.error(`  ❌ Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
        
        results.push({ 
          urlId: url.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    console.log(`\n🏁 STEP 3 COMPLETE: URL checking finished`)
    console.log(`📊 FINAL STATISTICS:`)
    console.log(`  - Total active URLs: ${allActiveUrls.length}`)
    console.log(`  - URLs due for checking: ${urlsDueForCheck.length}`)
    console.log(`  - URLs actually checked: ${results.length}`)
    console.log(`  - Successful checks: ${results.filter(r => r.success).length}`)
    console.log(`  - Failed checks: ${results.filter(r => !r.success).length}`)
    console.log(`  - Changes detected: ${results.filter(r => r.changesDetected).length}`)
    
    console.log(`\n📋 DETAILED RESULTS:`)
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. URL ${result.urlId}: ${result.success ? 'SUCCESS' : 'FAILED'}${result.changesDetected ? ' (CHANGES DETECTED)' : ''}`)
      if (result.error) {
        console.log(`     Error: ${result.error}`)
      }
    })
    
    console.log(`\n🚀 ==========================================`)
    console.log(`🚀 CRON JOB COMPLETED SUCCESSFULLY`)
    console.log(`🚀 ==========================================`)

    return NextResponse.json({
      success: true,
      checkedUrls: urlsDueForCheck.length,
      totalActiveUrls: allActiveUrls.length,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('\n❌ ==========================================')
    console.error('❌ CRON JOB FAILED WITH EXCEPTION')
    console.error('❌ ==========================================')
    console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ Full error object:', error)
    console.error('❌ ==========================================')
    
    return NextResponse.json({ 
      error: 'Failed to check URLs',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 