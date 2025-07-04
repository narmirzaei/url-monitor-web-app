import { NextResponse } from 'next/server'

export async function GET() {
  const timestamp = new Date().toISOString()
  
  // Multiple logging approaches
  console.log(`[CRON-TEST-GET] GET request received at ${timestamp}`)
  console.error(`[CRON-TEST-GET-ERROR] GET request received at ${timestamp}`)
  process.stdout.write(`[CRON-TEST-GET-STDOUT] GET request received at ${timestamp}\n`)
  process.stderr.write(`[CRON-TEST-GET-STDERR] GET request received at ${timestamp}\n`)
  
  return NextResponse.json({
    message: 'Cron test endpoint working',
    timestamp,
    environment: process.env.NODE_ENV
  })
}

export async function POST() {
  const timestamp = new Date().toISOString()
  
  // Multiple logging approaches
  console.log(`[CRON-TEST-POST] POST request received at ${timestamp}`)
  console.error(`[CRON-TEST-POST-ERROR] POST request received at ${timestamp}`)
  process.stdout.write(`[CRON-TEST-POST-STDOUT] POST request received at ${timestamp}\n`)
  process.stderr.write(`[CRON-TEST-POST-STDERR] POST request received at ${timestamp}\n`)
  
  return NextResponse.json({
    message: 'Cron test POST endpoint working',
    timestamp,
    environment: process.env.NODE_ENV
  })
} 