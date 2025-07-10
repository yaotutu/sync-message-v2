# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sync Message V2 is a Next.js application for managing and synchronizing SMS messages with features like card key linking, template-based message processing, user management, and public API access.

## Development Commands

```bash
# Development
npm run dev                    # Start development server (default port 3000)
PORT=8080 npm run dev         # Start with custom port

# Production
npm run build                 # Build for production
npm start                     # Start production server

# Database
npx prisma migrate dev        # Run database migrations
npm run seed                  # Seed database with test data
npm run init-db              # Initialize database and seed (combines migrate + seed)
npx prisma studio            # Open Prisma Studio for database management

# Linting
npm run lint                  # Run ESLint

# PM2 Deployment
pm2 start ecosystem.config.js                    # Start with PM2 (development)
pm2 start ecosystem.config.js --env production   # Start with PM2 (production)
```

## Testing

Run individual test files using Node.js:
```bash
node test/public-messages-api-test.js
node test/test-rule-processor.js
node test/test-expiration-feature.js
```

## Database Architecture

- **SQLite** database via Prisma ORM
- **Users**: User accounts with webhook keys, admin privileges, and settings
- **Messages**: SMS messages linked to users with metadata (sender, content, timestamps)
- **CardLinks**: Generated links that connect card keys to users and messages
- **Templates**: Rule-based message processing templates
- **Rules**: Pattern matching rules for filtering/processing messages

Key relationships:
- Users own CardLinks and Messages
- CardLinks can reference Templates and Messages
- Templates contain multiple Rules for message processing

## Key Architecture Patterns

### Message Processing Pipeline
1. **Public API** (`/api/public/messages`) receives requests with cardKey, appName, phone
2. **CardLink Resolution** validates parameters and finds associated user
3. **Message Filtering** finds relevant messages after firstUsedAt timestamp
4. **Rule Processing** applies template rules to filter/transform messages
5. **Caching** binds selected message to CardLink for future requests

### State Management
- **Zustand** for client-side state (footer controls, etc.)
- **React Context** patterns for component state
- **Server state** managed through Next.js API routes

### Component Structure
- **View Pages**: Public-facing message display (`/view`)
- **User Dashboard**: Management interface (`/user`)
- **Admin Panel**: User management (`/admin`)
- **API Routes**: RESTful endpoints under `/api`

## Important Files and Patterns

### Core Services
- `src/lib/db/` - Database access layer with specific models
- `src/lib/services/messageProcessor.js` - Rule-based message filtering
- `src/lib/utils/type-conversion.js` - BigInt/timestamp handling utilities

### API Patterns
- Next.js App Router API routes in `src/app/api/`
- Consistent error handling with JSON responses
- BigInt serialization support for timestamps

### UI Components
- Material-UI components with responsive design
- Shared components in `src/components/` and page-specific in subdirectories
- Mobile-first responsive patterns

## Debugging and Troubleshooting

### Database Queries
```bash
# Direct SQLite access
sqlite3 prisma/database.db ".tables"
sqlite3 prisma/database.db "SELECT * FROM cardLinks WHERE card_key = 'key';"
sqlite3 prisma/database.db "SELECT * FROM messages WHERE username = 'user';"
```

### Common Issues
- **Chinese character matching**: Rules and messages must have exact character matches
- **Timestamp handling**: Use BigInt for database timestamps, convert for display
- **CardLink validation**: Ensure cardKey, appName, and phone parameters all match
- **Rule processing**: Check template rules order and pattern matching modes

### Logging
- API requests logged with timing information
- PM2 logs available in `./logs/` directory
- Use `pm2 logs sync-message-v2` to view real-time logs

## Environment Configuration

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` for SQLite database path
- `ADMIN_PASSWORD` for admin access
- `PORT` for custom server port (optional)

## Production Deployment

The application uses PM2 for process management with configuration in `ecosystem.config.js`. Default port is 4000 in production, customizable via PORT environment variable.