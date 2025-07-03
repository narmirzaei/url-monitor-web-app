import sgMail from '@sendgrid/mail'

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export async function sendChangeNotification(monitoredUrl: any, checkResult: any) {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured')
  }

  if (!process.env.NOTIFICATION_EMAIL) {
    throw new Error('Notification email not configured')
  }

  const msg = {
    to: process.env.NOTIFICATION_EMAIL,
    from: process.env.FROM_EMAIL || process.env.NOTIFICATION_EMAIL,
    subject: `Content Change Detected: ${monitoredUrl.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Content Change Detected</h2>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">URL Details</h3>
          <p><strong>Name:</strong> ${monitoredUrl.name}</p>
          <p><strong>URL:</strong> <a href="${monitoredUrl.url}" style="color: #2563eb;">${monitoredUrl.url}</a></p>
          <p><strong>Check Time:</strong> ${new Date(checkResult.check_time).toLocaleString()}</p>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 10px 0; color: #92400e;">Changes Detected</h3>
          <p style="color: #92400e;">Content has changed since the last check. Please review the website for updates.</p>
        </div>

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">Content Preview</h3>
          <p style="font-size: 14px; color: #6b7280; font-family: monospace; white-space: pre-wrap;">${checkResult.content_preview}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${monitoredUrl.url}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Website
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          This notification was sent by URL Monitor Web App<br>
          Check ID: ${checkResult.id} | Content Hash: ${checkResult.content_hash.substring(0, 8)}...
        </p>
      </div>
    `
  }

  await sgMail.send(msg)
}