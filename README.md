# ALIP - Automated Log Intelligence Platform

A production-quality full-stack web application that automatically ingests application logs, analyzes them, groups similar errors, detects trends, and displays actionable insights in a modern dashboard.

## Problem Statement

Modern applications generate massive amounts of log data. Without proper tooling, engineering teams struggle to:

- **Identify patterns** in recurring errors
- **Detect anomalies** before they become incidents
- **Track trends** in error rates over time
- **Prioritize** which issues to fix first
- **Get alerted** when something goes wrong

ALIP solves these challenges by providing automated log intelligence with minimal setup.

## Solution

ALIP provides:

1. **Log Ingestion** - REST API accepting JSON logs with automatic normalization
2. **Error Grouping** - Similar errors grouped by fingerprint for deduplication
3. **Trend Analysis** - Hourly and daily metrics with change detection
4. **Smart Alerting** - Configurable rules for thresholds, spikes, and new error types
5. **Modern Dashboard** - Real-time visualization of KPIs, trends, and alerts

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Applications  │────▶│    ALIP API     │────▶│   PostgreSQL    │
│  (Log Sources)  │     │   (Express.js)  │     │   (via Prisma)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  ALIP Dashboard │
                        │   (Next.js)     │
                        └─────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + TypeScript + Express.js |
| Frontend | Next.js 14 (App Router) + React 18 |
| Database | PostgreSQL |
| ORM | Prisma |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Validation | Zod |

### Project Structure

```
/alip
├── apps/
│   ├── api/                 # Express backend
│   │   └── src/
│   │       ├── config/      # Configuration
│   │       ├── controllers/ # Request handlers
│   │       ├── middleware/  # Express middleware
│   │       ├── repositories/# Data access layer
│   │       ├── routes/      # API routes
│   │       ├── services/    # Business logic
│   │       └── utils/       # Utilities
│   │
│   └── web/                 # Next.js frontend
│       └── src/
│           ├── app/         # App Router pages
│           ├── components/  # React components
│           ├── hooks/       # Custom hooks
│           └── lib/         # API client, utilities
│
├── packages/
│   └── shared-types/        # Shared TypeScript types
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Demo data seeder
│
└── scripts/
    └── generate-spike.ts    # Error spike generator
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)
- npm 9+

### Installation

1. **Clone and install dependencies**

```bash
cd ALIP
npm install
```

2. **Start PostgreSQL**

```bash
docker-compose up -d
```

3. **Set up the database**

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

4. **Start the development servers**

```bash
# Terminal 1: Start API server
npm run dev:api

# Terminal 2: Start web dashboard
npm run dev:web
```

5. **Open the dashboard**

Navigate to [http://localhost:3000](http://localhost:3000)

## API Reference

### Log Ingestion

```bash
# Single log
POST /api/logs
Content-Type: application/json

{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "service": "auth-service",
  "message": "Failed to authenticate user 12345",
  "stackTrace": "Error: Authentication failed\n    at ..."
}

# Batch logs
POST /api/logs
Content-Type: application/json

{
  "logs": [
    { "timestamp": "...", "level": "ERROR", "service": "...", "message": "..." },
    { "timestamp": "...", "level": "INFO", "service": "...", "message": "..." }
  ]
}
```

### Query Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/logs | List logs with filters |
| GET | /api/logs/stats | Get log statistics |
| GET | /api/error-groups | List error groups |
| GET | /api/error-groups/top | Get top recurring errors |
| GET | /api/trends | Get trend data |
| GET | /api/trends/compare | Compare periods |
| GET | /api/alerts | List alerts |
| GET | /api/alert-rules | List alert rules |
| GET | /api/stats/overview | Dashboard KPIs |
| GET | /api/health | Health check |

## Log Normalization

ALIP automatically normalizes log messages by replacing dynamic values:

| Pattern | Replacement |
|---------|-------------|
| UUIDs | `<UUID>` |
| Timestamps | `<TIMESTAMP>` |
| IP addresses | `<IP>` |
| Email addresses | `<EMAIL>` |
| Numeric IDs | `<ID>` |
| Hex strings | `<HEX>` |
| URLs | `<URL>` |

**Example:**
```
Original:  "User 12345 failed to auth at 2024-01-15T10:30:00Z"
Normalized: "User <ID> failed to auth at <TIMESTAMP>"
```

This enables grouping of similar errors even when specific values differ.

## Alert Rules

Three types of alert rules are supported:

1. **Error Count Threshold** - Triggers when error count exceeds N in a time window
2. **Spike Detection** - Triggers when current errors exceed historical average by N standard deviations
3. **New Error Type** - Triggers when N new error patterns appear in a time window

## Dashboard Pages

### Overview (/)
- Total logs (24h)
- Error rate
- Active alerts
- Error timeline chart
- Top recurring errors

### Error Groups (/errors)
- Sortable/filterable table
- Status management (Active/Resolved/Ignored)
- Detailed modal view

### Trends (/trends)
- Log volume chart (stacked by level)
- Error rate chart
- Service comparison table
- Period-over-period comparison

### Alerts (/alerts)
- Active/acknowledged/resolved alerts
- Alert rule management
- Create/edit/delete rules

## Testing the Alerts

Generate an error spike to test alerting:

```bash
# Generate 50 error logs (default)
npx ts-node scripts/generate-spike.ts

# Generate 100 error logs
npx ts-node scripts/generate-spike.ts 100
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://alip:alip_secret@localhost:5432/alip?schema=public"

# API Server
API_PORT=3001
API_HOST=localhost

# Web Server
WEB_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

## Design Decisions

### Repository/Service Pattern
Business logic is separated from data access. Controllers handle HTTP, services implement logic, repositories handle database operations.

### Fingerprint-Based Grouping
Errors are grouped by a SHA-256 hash of (service + level + normalizedMessage). This ensures consistent grouping across restarts.

### Trend Pre-Aggregation
Trends are pre-aggregated into hourly and daily buckets for fast dashboard queries. Raw logs are retained for detailed analysis.

### Optimistic Alert Resolution
Alerts auto-resolve when conditions return to normal. This reduces alert fatigue while keeping teams informed.

## Production Considerations

For production deployment:

1. **Database** - Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
2. **Caching** - Add Redis for frequent queries
3. **Authentication** - Implement JWT authentication
4. **Rate Limiting** - Add rate limiting to ingestion endpoint
5. **Monitoring** - Add APM (DataDog, New Relic)
6. **Scaling** - Run API behind load balancer

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Start API in development |
| `npm run dev:web` | Start dashboard in development |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run build` | Build all packages |
| `npm run docker:up` | Start PostgreSQL |
| `npm run docker:down` | Stop PostgreSQL |

## License

MIT

---

Built with TypeScript, Express.js, Next.js, Prisma, and Tailwind CSS.
