import { sql } from '@vercel/postgres'

export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS monitored_urls (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        name TEXT NOT NULL,
        check_interval INTEGER NOT NULL DEFAULT 60,
        is_active BOOLEAN DEFAULT true,
        last_check TIMESTAMP,
        last_content_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS url_checks (
        id SERIAL PRIMARY KEY,
        url_id INTEGER REFERENCES monitored_urls(id) ON DELETE CASCADE,
        content_hash TEXT NOT NULL,
        content_preview TEXT,
        changes_detected BOOLEAN DEFAULT false,
        check_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        error_message TEXT
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        url_id INTEGER REFERENCES monitored_urls(id) ON DELETE CASCADE,
        check_id INTEGER REFERENCES url_checks(id) ON DELETE CASCADE,
        email_sent BOOLEAN DEFAULT false,
        email_sent_at TIMESTAMP,
        changes_summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}