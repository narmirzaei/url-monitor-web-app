import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractPageContent, generateContentHash } from '@/lib/browser'
import { extractContentSimple } from '@/lib/content-extractor'
import { sendChangeNotification } from '@/lib/email'

// Vercel logging function
function log(message: string) {
  // Force immediate logging for Vercel
  const timestamp = new Date().toISOString()
  const logMessage = `[CRON-${timestamp}] ${message}`
  
  // Multiple logging approaches to ensure visibility
  console.log(logMessage)
  console.error(logMessage) // Error logs are more likely to show up
  process.stdout.write(logMessage + '\n')
  
  // Also log to stderr which Vercel might capture better
  process.stderr.write(logMessage + '\n')
  
  // Try to write to a file as backup (this might not work in Vercel but worth trying)
  try {
    const fs = require('fs')
    const logFile = '/tmp/cron-logs.txt'
    fs.appendFileSync(logFile, logMessage + '\n')
  } catch (e) {
    // Ignore file write errors
  }
}

async function checkSingleUrl(urlId: number) {
  log(`    🔍 checkSingleUrl(${urlId}) - Starting...`)
  
  try {
    log(`    📊 Fetching URL details from database...`)
    const monitoredUrl = await prisma.monitoredUrl.findFirst({
      where: { 
        id: urlId,
        isActive: true
      }
    })

    if (!monitoredUrl) {
      log(`    ❌ URL ${urlId} not found or inactive`)
      return { success: false, error: 'URL not found or inactive' }
    }
    
    log(`    ✅ URL found: ${monitoredUrl.name} (${monitoredUrl.url})`)
    
    log(`    🌐 Starting content extraction...`)
    let content: string
    try {
      log(`    🎭 Attempting Playwright extraction...`)
      // Try Playwright first
      content = await extractPageContent(monitoredUrl.url)
      log(`    ✅ Playwright extraction successful, content length: ${content.length} characters`)
    } catch (playwrightError) {
      log(`    ⚠️  Playwright failed, using fallback method: ${playwrightError}`)
      log(`    🔄 Attempting simple HTTP extraction...`)
      // Fallback to simple HTTP extraction
      content = await extractContentSimple(monitoredUrl.url)
      log(`    ✅ Fallback extraction successful, content length: ${content.length} characters`)
    }
    
    log(`    🔐 Generating content hash...`)
    const contentHash = generateContentHash(content)
    log(`    ✅ Content hash generated: ${contentHash.substring(0, 8)}...`)
    
    const previousHash = monitoredUrl.lastContentHash
    log(`    📊 Previous hash: ${previousHash ? previousHash.substring(0, 8) + '...' : 'None (first check)'}`)
    
    const changesDetected = previousHash && previousHash !== contentHash
    log(`    🔍 Changes detected: ${changesDetected ? 'YES' : 'NO'}`)
    
    const contentPreview = content.substring(0, 500) + (content.length > 500 ? '...' : '')
    log(`    📝 Content preview generated (${contentPreview.length} chars)`)

    log(`    💾 Creating URL check record in database...`)
    const checkResult = await prisma.urlCheck.create({
      data: {
        urlId,
        contentHash,
        contentPreview,
        changesDetected: !!changesDetected
      }
    })
    log(`    ✅ URL check record created with ID: ${checkResult.id}`)

    log(`    🔄 Updating URL last check timestamp...`)
    await prisma.monitoredUrl.update({
      where: { id: urlId },
      data: {
        lastContentHash: contentHash,
        lastCheck: new Date() // This will be stored as UTC in the database
      }
    })
    log(`    ✅ URL last check timestamp updated`)

    if (changesDetected) {
      log(`    📧 Changes detected - sending email notification...`)
      try {
        log(`    📊 Fetching previous content for diff...`)
        // Get the previous check record to compare content
        const previousCheck = await prisma.urlCheck.findFirst({
          where: { 
            urlId,
            id: { not: checkResult.id } // Exclude the current check
          },
          orderBy: { checkTime: 'desc' }
        })
        
        const previousContent = previousCheck?.contentPreview || 'No previous content available'
        log(`    ✅ Previous content fetched (${previousContent.length} chars)`)
        
        log(`    📤 Sending email via SendGrid...`)
        await sendChangeNotification(monitoredUrl, checkResult, previousContent, content)
        log(`    ✅ Email sent successfully`)
        
        log(`    💾 Creating notification record...`)
        await prisma.notification.create({
          data: {
            urlId,
            checkId: checkResult.id,
            emailSent: true,
            emailSentAt: new Date(), // UTC timestamp
            changesSummary: 'Content changes detected'
          }
        })
        log(`    ✅ Notification record created`)
      } catch (emailError) {
        log(`    ❌ Failed to send notification: ${emailError}`)
        log(`    ❌ Email error details: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`)
        
        log(`    💾 Creating failed notification record...`)
        await prisma.notification.create({
          data: {
            urlId,
            checkId: checkResult.id,
            emailSent: false,
            changesSummary: 'Content changes detected - email failed'
          }
        })
        log(`    ✅ Failed notification record created`)
      }
    } else {
      log(`    ℹ️  No changes detected - skipping email notification`)
    }

    log(`    ✅ checkSingleUrl(${urlId}) - Completed successfully`)
    return {
      success: true,
      changesDetected: !!changesDetected,
      contentHash,
      checkId: checkResult.id
    }

  } catch (error) {
    log(`    ❌ checkSingleUrl(${urlId}) - Error during content extraction: ${error}`)
    log(`    ❌ Error details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    log(`    ❌ Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`)
    
    log(`    💾 Creating error record in database...`)
    await prisma.urlCheck.create({
      data: {
        urlId,
        contentHash: '',
        changesDetected: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    log(`    ✅ Error record created`)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function GET() {
  // Immediate logging to verify the function is called
  console.log('[CRON-IMMEDIATE] GET function called')
  console.error('[CRON-IMMEDIATE-ERROR] GET function called')
  process.stdout.write('[CRON-IMMEDIATE-STDOUT] GET function called\n')
  process.stderr.write('[CRON-IMMEDIATE-STDERR] GET function called\n')
  
  log('🚀 ==========================================')
  log('🚀 CRON JOB STARTED (GET)')
  log('🚀 ==========================================')
  
  const now = new Date()
  log(`🕐 Cron job triggered at: ${now.toISOString()}`)
  log(`🌍 Current timezone offset: ${now.getTimezoneOffset()} minutes`)
  log(`🕐 Local time: ${now.toString()}`)
  log(`🕐 UTC time: ${now.toISOString()}`)
  log(`🕐 Current timestamp (ms): ${now.getTime()}`)
  
  try {
    log('📊 STEP 1: Fetching all active URLs from database...')
    
    // Get all active URLs
    const allActiveUrls = await prisma.monitoredUrl.findMany({
      where: {
        isActive: true
      },
      select: { id: true, checkInterval: true, lastCheck: true }
    })

    log(`📊 STEP 1 COMPLETE: Found ${allActiveUrls.length} active URLs`)
    log('📋 Raw URL data from database:')
    allActiveUrls.forEach((url: { id: number; checkInterval: number; lastCheck: Date | null }, index: number) => {
      log(`  ${index + 1}. URL ID: ${url.id}, Interval: ${url.checkInterval}min, Last Check: ${url.lastCheck ? url.lastCheck.toISOString() : 'NULL'}`)
    })

    log('🔍 STEP 2: Analyzing each URL for timing...')
    
    // Filter URLs that are due for checking based on their individual intervals
    const urlsDueForCheck = allActiveUrls.filter((url: { id: number; checkInterval: number; lastCheck: Date | null }) => {
      log(`\n🔍 ANALYZING URL ${url.id}:`)
      log(`  - Check Interval: ${url.checkInterval} minutes`)
      log(`  - Last Check: ${url.lastCheck ? url.lastCheck.toISOString() : 'NULL (never checked)'}`)
      
      if (!url.lastCheck) {
        log(`  ✅ DECISION: URL ${url.id} has never been checked before - WILL CHECK`)
        return true // Never checked before
      }
      
      const intervalMs = url.checkInterval * 60000 // Convert minutes to milliseconds
      log(`  - Interval in milliseconds: ${intervalMs}ms`)
      
      // Use UTC time for consistent calculations
      // Vercel cron jobs run in UTC, so we need to ensure all time calculations are in UTC
      const nowUtc = new Date().getTime()
      const lastCheckUtc = url.lastCheck.getTime()
      const timeSinceLastCheck = nowUtc - lastCheckUtc
      
      log(`  - Current UTC timestamp: ${nowUtc}`)
      log(`  - Last check UTC timestamp: ${lastCheckUtc}`)
      log(`  - Time since last check: ${timeSinceLastCheck}ms (${Math.round(timeSinceLastCheck / 60000)} minutes)`)
      
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
      
      log(`  - Decision logic: ${reason}`)
      
      if (isDue) {
        log(`  ✅ DECISION: URL ${url.id} IS DUE FOR CHECK`)
      } else {
        log(`  ⏳ DECISION: URL ${url.id} NOT DUE YET`)
      }
      
      return isDue
    })

    log(`\n🎯 STEP 2 COMPLETE: ${urlsDueForCheck.length} URLs are due for checking`)
    
    if (urlsDueForCheck.length === 0) {
      log('⚠️  No URLs are due for checking at this time')
    } else {
      log('📋 URLs that will be checked:')
      urlsDueForCheck.forEach((url: { id: number; checkInterval: number; lastCheck: Date | null }, index: number) => {
        log(`  ${index + 1}. URL ID: ${url.id}, Interval: ${url.checkInterval}min`)
      })
    }
    
    // Log summary of all URLs
    log('\n📋 FINAL SUMMARY OF ALL URLs:')
    allActiveUrls.forEach((url: { id: number; checkInterval: number; lastCheck: Date | null }) => {
      const timeSinceLastCheck = url.lastCheck ? Math.round((new Date().getTime() - url.lastCheck.getTime()) / 60000) : 'Never'
      const isDue = urlsDueForCheck.some((u: { id: number; checkInterval: number; lastCheck: Date | null }) => u.id === url.id)
      const lastCheckUtc = url.lastCheck ? url.lastCheck.toISOString() : 'Never'
      log(`  URL ${url.id}: Interval=${url.checkInterval}min, Last check=${timeSinceLastCheck}min ago (UTC: ${lastCheckUtc}), Due=${isDue}`)
    })
    
    // Additional timezone debugging
    log('\n🕐 TIMEZONE DEBUG INFO:')
    log('  - Vercel cron jobs run in UTC')
    log('  - Database timestamps are stored in UTC')
    log('  - All time calculations use UTC timestamps')
    log(`  - Current UTC time: ${new Date().toISOString()}`)

    log('\n🔍 STEP 3: Starting URL checks...')
    const results = []

    for (const url of urlsDueForCheck) {
      log(`\n🔍 CHECKING URL ${url.id}:`)
      log(`  - Starting check at: ${new Date().toISOString()}`)
      
      try {
        log(`  - Calling checkSingleUrl function...`)
        const result = await checkSingleUrl(url.id)
        
        log(`  - Check result received:`)
        log(`    * Success: ${result.success}`)
        log(`    * Changes Detected: ${result.changesDetected}`)
        log(`    * Content Hash: ${result.contentHash ? result.contentHash.substring(0, 8) + '...' : 'N/A'}`)
        log(`    * Check ID: ${result.checkId || 'N/A'}`)
        if (result.error) {
          log(`    * Error: ${result.error}`)
        }
        
        results.push({ urlId: url.id, ...result })
        log(`  ✅ URL ${url.id} check completed: ${result.success ? 'SUCCESS' : 'FAILED'}`)
      } catch (error) {
        log(`  ❌ Exception during URL ${url.id} check: ${error}`)
        log(`  ❌ Error details: ${error instanceof Error ? error.message : 'Unknown error'}`)
        log(`  ❌ Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`)
        
        results.push({ 
          urlId: url.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    log(`\n🏁 STEP 3 COMPLETE: URL checking finished`)
    log(`📊 FINAL STATISTICS:`)
    log(`  - Total active URLs: ${allActiveUrls.length}`)
    log(`  - URLs due for checking: ${urlsDueForCheck.length}`)
    log(`  - URLs actually checked: ${results.length}`)
    log(`  - Successful checks: ${results.filter(r => r.success).length}`)
    log(`  - Failed checks: ${results.filter(r => !r.success).length}`)
    log(`  - Changes detected: ${results.filter(r => r.changesDetected).length}`)
    
    log(`\n📋 DETAILED RESULTS:`)
    results.forEach((result, index) => {
      log(`  ${index + 1}. URL ${result.urlId}: ${result.success ? 'SUCCESS' : 'FAILED'}${result.changesDetected ? ' (CHANGES DETECTED)' : ''}`)
      if (result.error) {
        log(`     Error: ${result.error}`)
      }
    })
    
    log(`\n🚀 ==========================================`)
    log(`🚀 CRON JOB COMPLETED SUCCESSFULLY`)
    log(`🚀 ==========================================`)

    return NextResponse.json({
      success: true,
      checkedUrls: urlsDueForCheck.length,
      totalActiveUrls: allActiveUrls.length,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    log('\n❌ ==========================================')
    log('❌ CRON JOB FAILED WITH EXCEPTION')
    log('❌ ==========================================')
    log(`❌ Error type: ${error instanceof Error ? error.constructor.name : typeof error}`)
    log(`❌ Error message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    log(`❌ Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`)
    log(`❌ Full error object: ${error}`)
    log('❌ ==========================================')
    
    return NextResponse.json({ 
      error: 'Failed to check URLs',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST() {
  // Immediate logging to verify the function is called
  console.log('[CRON-IMMEDIATE] POST function called')
  console.error('[CRON-IMMEDIATE-ERROR] POST function called')
  process.stdout.write('[CRON-IMMEDIATE-STDOUT] POST function called\n')
  process.stderr.write('[CRON-IMMEDIATE-STDERR] POST function called\n')
  
  log('🚀 ==========================================')
  log('🚀 CRON JOB STARTED')
  log('🚀 ==========================================')
  
  const now = new Date()
  log(`🕐 Cron job triggered at: ${now.toISOString()}`)
  log(`🌍 Current timezone offset: ${now.getTimezoneOffset()} minutes`)
  log(`🕐 Local time: ${now.toString()}`)
  log(`🕐 UTC time: ${now.toISOString()}`)
  log(`🕐 Current timestamp (ms): ${now.getTime()}`)
  
      try {
      log('📊 STEP 1: Fetching all active URLs from database...')
      
      // Get all active URLs
      const allActiveUrls = await prisma.monitoredUrl.findMany({
        where: {
          isActive: true
        },
        select: { id: true, checkInterval: true, lastCheck: true }
      })

      log(`📊 STEP 1 COMPLETE: Found ${allActiveUrls.length} active URLs`)
      log('📋 Raw URL data from database:')
      allActiveUrls.forEach((url: { id: number; checkInterval: number; lastCheck: Date | null }, index: number) => {
        log(`  ${index + 1}. URL ID: ${url.id}, Interval: ${url.checkInterval}min, Last Check: ${url.lastCheck ? url.lastCheck.toISOString() : 'NULL'}`)
      })

      log('🔍 STEP 2: Analyzing each URL for timing...')
    
    // Filter URLs that are due for checking based on their individual intervals
    const urlsDueForCheck = allActiveUrls.filter((url: { id: number; checkInterval: number; lastCheck: Date | null }) => {
      log(`\n🔍 ANALYZING URL ${url.id}:`)
      log(`  - Check Interval: ${url.checkInterval} minutes`)
      log(`  - Last Check: ${url.lastCheck ? url.lastCheck.toISOString() : 'NULL (never checked)'}`)
      
      if (!url.lastCheck) {
        log(`  ✅ DECISION: URL ${url.id} has never been checked before - WILL CHECK`)
        return true // Never checked before
      }
      
      const intervalMs = url.checkInterval * 60000 // Convert minutes to milliseconds
      log(`  - Interval in milliseconds: ${intervalMs}ms`)
      
      // Use UTC time for consistent calculations
      // Vercel cron jobs run in UTC, so we need to ensure all time calculations are in UTC
      const nowUtc = new Date().getTime()
      const lastCheckUtc = url.lastCheck.getTime()
      const timeSinceLastCheck = nowUtc - lastCheckUtc
      
      log(`  - Current UTC timestamp: ${nowUtc}`)
      log(`  - Last check UTC timestamp: ${lastCheckUtc}`)
      log(`  - Time since last check: ${timeSinceLastCheck}ms (${Math.round(timeSinceLastCheck / 60000)} minutes)`)
      
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
      
      log(`  - Decision logic: ${reason}`)
      
      if (isDue) {
        log(`  ✅ DECISION: URL ${url.id} IS DUE FOR CHECK`)
      } else {
        log(`  ⏳ DECISION: URL ${url.id} NOT DUE YET`)
      }
      
      return isDue
    })

    log(`\n🎯 STEP 2 COMPLETE: ${urlsDueForCheck.length} URLs are due for checking`)
    
    if (urlsDueForCheck.length === 0) {
      log('⚠️  No URLs are due for checking at this time')
    } else {
      log('📋 URLs that will be checked:')
      urlsDueForCheck.forEach((url: { id: number; checkInterval: number; lastCheck: Date | null }, index: number) => {
        log(`  ${index + 1}. URL ID: ${url.id}, Interval: ${url.checkInterval}min`)
      })
    }
    
    // Log summary of all URLs
    log('\n📋 FINAL SUMMARY OF ALL URLs:')
    allActiveUrls.forEach((url: { id: number; checkInterval: number; lastCheck: Date | null }) => {
      const timeSinceLastCheck = url.lastCheck ? Math.round((new Date().getTime() - url.lastCheck.getTime()) / 60000) : 'Never'
      const isDue = urlsDueForCheck.some((u: { id: number; checkInterval: number; lastCheck: Date | null }) => u.id === url.id)
      const lastCheckUtc = url.lastCheck ? url.lastCheck.toISOString() : 'Never'
      log(`  URL ${url.id}: Interval=${url.checkInterval}min, Last check=${timeSinceLastCheck}min ago (UTC: ${lastCheckUtc}), Due=${isDue}`)
    })
    
    // Additional timezone debugging
    log('\n🕐 TIMEZONE DEBUG INFO:')
    log('  - Vercel cron jobs run in UTC')
    log('  - Database timestamps are stored in UTC')
    log('  - All time calculations use UTC timestamps')
    log(`  - Current UTC time: ${new Date().toISOString()}`)

    log('\n🔍 STEP 3: Starting URL checks...')
    const results = []

    for (const url of urlsDueForCheck) {
      log(`\n🔍 CHECKING URL ${url.id}:`)
      log(`  - Starting check at: ${new Date().toISOString()}`)
      
      try {
        log(`  - Calling checkSingleUrl function...`)
        const result = await checkSingleUrl(url.id)
        
        log(`  - Check result received:`)
        log(`    * Success: ${result.success}`)
        log(`    * Changes Detected: ${result.changesDetected}`)
        log(`    * Content Hash: ${result.contentHash ? result.contentHash.substring(0, 8) + '...' : 'N/A'}`)
        log(`    * Check ID: ${result.checkId || 'N/A'}`)
        if (result.error) {
          log(`    * Error: ${result.error}`)
        }
        
        results.push({ urlId: url.id, ...result })
        log(`  ✅ URL ${url.id} check completed: ${result.success ? 'SUCCESS' : 'FAILED'}`)
      } catch (error) {
        log(`  ❌ Exception during URL ${url.id} check: ${error}`)
        log(`  ❌ Error details: ${error instanceof Error ? error.message : 'Unknown error'}`)
        log(`  ❌ Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`)
        
        results.push({ 
          urlId: url.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    log(`\n🏁 STEP 3 COMPLETE: URL checking finished`)
    log(`📊 FINAL STATISTICS:`)
    log(`  - Total active URLs: ${allActiveUrls.length}`)
    log(`  - URLs due for checking: ${urlsDueForCheck.length}`)
    log(`  - URLs actually checked: ${results.length}`)
    log(`  - Successful checks: ${results.filter(r => r.success).length}`)
    log(`  - Failed checks: ${results.filter(r => !r.success).length}`)
    log(`  - Changes detected: ${results.filter(r => r.changesDetected).length}`)
    
    log(`\n📋 DETAILED RESULTS:`)
    results.forEach((result, index) => {
      log(`  ${index + 1}. URL ${result.urlId}: ${result.success ? 'SUCCESS' : 'FAILED'}${result.changesDetected ? ' (CHANGES DETECTED)' : ''}`)
      if (result.error) {
        log(`     Error: ${result.error}`)
      }
    })
    
    log(`\n🚀 ==========================================`)
    log(`🚀 CRON JOB COMPLETED SUCCESSFULLY`)
    log(`🚀 ==========================================`)

    return NextResponse.json({
      success: true,
      checkedUrls: urlsDueForCheck.length,
      totalActiveUrls: allActiveUrls.length,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    log('\n❌ ==========================================')
    log('❌ CRON JOB FAILED WITH EXCEPTION')
    log('❌ ==========================================')
    log(`❌ Error type: ${error instanceof Error ? error.constructor.name : typeof error}`)
    log(`❌ Error message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    log(`❌ Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`)
    log(`❌ Full error object: ${error}`)
    log('❌ ==========================================')
    
    return NextResponse.json({ 
      error: 'Failed to check URLs',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 