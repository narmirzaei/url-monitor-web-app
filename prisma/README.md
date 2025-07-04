# Prisma Setup Instructions

## Database Connection

To use Prisma with your Vercel Postgres database, you need to:

1. **Get your database connection string** from your Vercel dashboard:
   - Go to your Vercel project dashboard
   - Navigate to Storage > Postgres
   - Click "Connect" and copy the connection string

2. **Create a `.env` file** in your project root with:
   ```
   POSTGRES_URL="your_vercel_postgres_connection_string_here"
   ```

3. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

4. **Create and run migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

## Database Schema

The schema includes three main tables:
- `monitored_urls`: Stores URLs to monitor
- `url_checks`: Stores individual check results
- `notifications`: Stores notification records

## Usage

After setup, you can use Prisma in your code like this:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Example: Get all active URLs
const activeUrls = await prisma.monitoredUrl.findMany({
  where: { isActive: true }
})
``` 