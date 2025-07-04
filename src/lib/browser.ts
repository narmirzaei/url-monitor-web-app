import { chromium, Browser, Page } from 'playwright'
import crypto from 'crypto'

export async function getBrowser(): Promise<Browser> {
  return await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  })
}

export async function closeBrowser(browser: Browser): Promise<void> {
  await browser.close()
}

export async function dismissCookieConsent(page: Page): Promise<void> {
  const cookieSelectors = [
    'button[id*="accept"]',
    'button[id*="agree"]',
    'button[class*="accept"]',
    'button[class*="agree"]',
    'button:has-text("Accept")',
    'button:has-text("Agree")',
    'button:has-text("OK")',
    'button:has-text("Got it")',
    'button:has-text("I understand")',
    'button:has-text("Continue")',
    '[data-testid*="accept"]',
    '[data-testid*="agree"]',
    '.cookie-accept',
    '.cookie-agree',
    '#cookie-accept',
    '#cookie-agree'
  ]

  for (const selector of cookieSelectors) {
    try {
      const button = await page.locator(selector).first()
      if (await button.isVisible({ timeout: 1000 })) {
        await button.click()
        console.log(`Clicked cookie consent button: ${selector}`)
        await page.waitForTimeout(1000)
        break
      }
    } catch (error) {
      continue
    }
  }
}

export async function extractPageContent(url: string): Promise<string> {
  const browser = await getBrowser()
  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  })

  try {
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    })

    await page.waitForTimeout(2000)

    await dismissCookieConsent(page)

    await page.waitForTimeout(3000)

    const content = await page.evaluate(() => {
      const elementsToRemove = [
        'script',
        'style',
        'nav',
        'header',
        'footer',
        '[class*="ad"]',
        '[class*="banner"]',
        '[class*="popup"]',
        '[class*="modal"]',
        '[class*="cookie"]',
        '[id*="ad"]',
        '[id*="banner"]',
        '[id*="popup"]',
        '[id*="modal"]',
        '[id*="cookie"]'
      ]

      elementsToRemove.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => el.remove())
      })

      const mainSelectors = [
        'main',
        'article',
        '[role="main"]',
        '.main-content',
        '.content',
        '#content',
        '.post-content',
        '.entry-content'
      ]

      let mainContent = ''
      for (const selector of mainSelectors) {
        const element = document.querySelector(selector)
        if (element) {
          mainContent = element.textContent || (element as HTMLElement).innerText || ''
          break
        }
      }

      if (!mainContent) {
        mainContent = document.body.textContent || (document.body as HTMLElement).innerText || ''
      }

      return mainContent
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim()
    })

    return content
  } finally {
    await page.close()
    await closeBrowser(browser)
  }
}

export function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex')
}