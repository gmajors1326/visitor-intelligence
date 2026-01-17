# Visitor Intelligence Dashboard

A comprehensive Next.js-based visitor analytics and intelligence platform with real-time tracking, bot detection, AI flagging, scoring, hot sessions, alerts, daily digests, and consent-based heatmap tracking.

## Features

- **Real-time Visitor Tracking**: Automatic logging of all page visits via Edge-safe middleware
- **Bot Detection**: Advanced bot and crawler detection with pattern matching
- **AI Detection**: Identifies AI-powered bots and crawlers
- **Scoring System**: Intelligent scoring based on engagement metrics
- **Hot Sessions**: Automatically identifies high-engagement sessions
- **Alerts System**: Real-time alerts for significant events (AI detected, hot sessions, etc.)
- **Daily Digests**: Automated daily summaries of visitor activity
- **Heatmap Lite**: Consent-based click and scroll tracking
- **Premium Dark UI**: Beautiful dark theme with CSS variables and modules

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Styling**: CSS Modules with CSS Variables (no Tailwind/UI frameworks)
- **Deployment**: Vercel-compatible

## Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd "theTorKing visitor intelligence"
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
# Supabase Postgres (Transaction Pooler)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres

# Admin auth
ADMIN_PASSWORD_HASH=PASTE_YOUR_BCRYPT_HASH

# Internal security
INTERNAL_KEY=generate-a-long-random-string
IP_HASH_SALT=generate-a-long-random-string
UA_HASH_SALT=generate-a-long-random-string
```

4. Generate and run database migrations:
```bash
npm run db:generate
npm run db:push
```

Or use Drizzle Studio to manage your database:
```bash
npm run db:studio
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the following main tables:

- **visitors**: Individual page visit records
- **sessions**: Session-level aggregated data
- **alerts**: System alerts and notifications
- **heatmap_data**: Consent-based interaction data
- **daily_digests**: Daily summary reports

## API Routes

- `POST /api/internal/log-visit` - Internal route for logging visits (called by middleware)
- `POST /api/consent` - Update user consent status
- `POST /api/heatmap` - Log heatmap interaction data
- `GET /api/heatmap?url=...` - Get aggregated heatmap data for a URL
- `GET /api/stats` - Get dashboard statistics
- `GET /api/alerts` - Get alerts (supports ?isRead=false, ?severity=high, ?limit=50)
- `PATCH /api/alerts` - Update alert read status
- `GET /api/sessions` - Get sessions (supports ?hot=true, ?limit=50)
- `POST /api/digest` - Generate daily digest
- `GET /api/digest` - Get daily digests (supports ?limit=30)

## Deployment

### Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The middleware automatically uses Vercel's geolocation headers (`x-vercel-ip-country`, `x-vercel-ip-city`) when available.

### Environment Variables

Make sure to set these in your production environment:

- `DATABASE_URL` - Your Supabase PostgreSQL connection string (Transaction Pooler)
- `ADMIN_PASSWORD_HASH` - Bcrypt hash for admin authentication
- `INTERNAL_KEY` - Secret key for internal API authentication
- `IP_HASH_SALT` - Salt for IP address hashing
- `UA_HASH_SALT` - Salt for user agent hashing

## Usage

### Dashboard

Visit `/dashboard` to see:
- Real-time visitor statistics
- Recent alerts
- Top pages and countries
- Hot sessions

### Consent Banner

The consent banner appears on all pages. Users must accept to enable:
- Heatmap tracking
- Enhanced analytics

### Daily Digests

Generate daily digests by calling:
```bash
POST /api/digest
```

This creates a summary of the previous day's activity.

## Development

### Database Migrations

```bash
# Generate migration files
npm run db:generate

# Push schema changes (development)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

### Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Dashboard.tsx     # Main dashboard
│   ├── ConsentBanner.tsx  # Consent UI
│   └── HeatmapTracker.tsx # Client-side tracking
├── lib/                   # Utilities and database
│   ├── db/               # Database schema and connection
│   └── utils/            # Utility functions
├── middleware.ts          # Request logging middleware
└── drizzle.config.ts      # Drizzle configuration
```

## License

Private project - All rights reserved
