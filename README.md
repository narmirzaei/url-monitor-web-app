# URL Monitor Web App

A comprehensive web application for monitoring website content changes with intelligent notifications.

## Features

- **Real-time URL Monitoring**: Track multiple websites for content changes
- **Smart Content Detection**: Uses Playwright browser automation with cookie consent handling
- **Email Notifications**: Sends detailed change notifications via SendGrid
- **Dashboard Interface**: Clean, responsive UI for managing monitored URLs
- **Activity Logs**: Detailed history of all checks and detected changes
- **Serverless Architecture**: Deployed on Vercel with automatic cron scheduling

## Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Serverless API routes with Playwright for browser automation
- **Database**: PostgreSQL via Vercel Storage
- **Email**: SendGrid integration for notifications
- **Deployment**: Vercel with automatic cron jobs

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd url-monitor-web-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the required environment variables:
   - Database credentials from Vercel Postgres
   - SendGrid API key
   - Notification email addresses

4. **Run development server**
   ```bash
   npm run dev
   ```

## Deployment

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Set up Vercel Storage**
   - Add PostgreSQL database through Vercel dashboard
   - Environment variables will be automatically configured

3. **Configure SendGrid**
   - Add your SendGrid API key to environment variables
   - Set up notification email addresses

## Usage

1. **Add URLs to monitor**
   - Use the dashboard to add new URLs
   - Configure check intervals (1-1440 minutes)
   - Set descriptive names for easy identification

2. **Monitor changes**
   - Automatic checks run every 5 minutes via cron jobs
   - Manual checks available through the dashboard
   - Pause/resume monitoring for individual URLs

3. **View activity**
   - Dashboard shows real-time status of all monitored URLs
   - Logs page provides detailed history of all checks
   - Email notifications sent when changes are detected

## API Endpoints

- `GET /api/urls` - List all monitored URLs
- `POST /api/urls` - Add new URL to monitor
- `PUT /api/urls/[id]` - Update URL configuration
- `DELETE /api/urls/[id]` - Remove URL from monitoring
- `POST /api/monitor` - Check specific URL for changes
- `POST /api/monitor/check-all` - Check all active URLs
- `GET /api/logs` - Get monitoring activity logs

## Environment Variables

```env
# Database (Vercel Postgres)
POSTGRES_URL=

# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
NOTIFICATION_EMAIL=your-email@example.com
FROM_EMAIL=noreply@yourdomain.com

# Authentication
BASIC_AUTH_USERNAME=admin
BASIC_AUTH_PASSWORD=your-secure-password-here

# Vercel Configuration
VERCEL_URL=your-vercel-url.vercel.app
```

## 🔐 Authentication

This app uses basic authentication to protect your URLs. To set up authentication:

### Setup

1. **Add environment variables** to your Vercel project:
   - `BASIC_AUTH_USERNAME` (default: `admin`)
   - `BASIC_AUTH_PASSWORD` (required for protection)

2. **Default credentials**:
   - Username: `admin` (or set via `BASIC_AUTH_USERNAME`)
   - Password: Set via `BASIC_AUTH_PASSWORD` environment variable

3. **Local development**: Create a `.env.local` file with the same variables

### Security Notes

- If no password is set, authentication will be disabled (useful for development)
- Credentials are stored in browser localStorage for convenience
- API endpoints are protected by middleware
- Cron jobs continue to work without authentication

## Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Playwright**: Browser automation for content extraction
- **Prisma**: Type-safe database ORM with PostgreSQL
- **SendGrid**: Email delivery service
- **Vercel**: Deployment and hosting platform

## Key Features

### Intelligent Content Monitoring
- Headless browser automation with Playwright
- Automatic cookie consent dismissal
- Content filtering to remove ads and dynamic elements
- SHA-256 hash-based change detection

### Professional Email Notifications
- Rich HTML email templates
- Detailed change summaries
- Content previews
- Timestamp tracking

### Comprehensive Dashboard
- Real-time status updates
- URL management (add/edit/delete)
- Manual check triggers
- Activity monitoring

### Serverless Architecture
- Automatic scaling
- Cron job scheduling
- Database connection pooling
- Error handling and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the ISC License.