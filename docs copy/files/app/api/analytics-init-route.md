# analytics-init/route.ts Documentation

**Path**: `app/api/analytics-init/route.ts`
**Type**: Next.js API Route Handler
**Size**: 96 lines
**Last Modified**: Recently active

## Purpose

This API endpoint initializes analytics sessions for tracking user behavior across the application. It creates or retrieves analytics sessions, capturing device information, referrer data, and user context for comprehensive analytics tracking.

## Key Components

### POST Handler
- **Purpose**: Creates new analytics sessions or retrieves existing valid sessions
- **Parameters**: 
  - Request body: `{ sessionId?: string }`
  - Headers: User-Agent, Referer, Accept-Language
- **Returns**: `{ sessionId: string, existingSession: object }`
- **Authentication**: Uses Supabase auth session if available

### Core Functionality

#### Session Management
- Generates UUID v4 for new session IDs
- Validates existing sessions (30-minute validity window)
- Tracks session continuity across page visits

#### Data Collection
- **Device Detection**: Uses UAParser.js to identify device type (desktop/mobile/tablet)
- **Locale Detection**: Extracts locale from Accept-Language header or URL path
- **Referrer Tracking**: Captures and parses referrer URLs
- **User Association**: Links sessions to authenticated users when available

#### Database Operations
- **Table**: `analytics_sessions`
- **Fields Captured**:
  - `id`: UUID session identifier
  - `first_page`: Initial page visited in session
  - `user_id`: Associated user ID (if authenticated)
  - `referrer`: HTTP referrer
  - `user_agent`: Full user agent string
  - `device_type`: Parsed device type
  - `locale`: Detected user locale

## Dependencies

- `next/server`: NextResponse for API responses
- `uuid`: v4 UUID generation for session IDs
- `@/utils/supabase/server`: Supabase client creation
- `next/headers`: Server-side header access
- `ua-parser-js`: User agent parsing for device detection

## Usage Examples

### Client-side Session Initialization
```javascript
const response = await fetch('/api/analytics-init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId: existingSessionId })
})
const { sessionId, existingSession } = await response.json()
```

### New Session Creation
```javascript
const response = await fetch('/api/analytics-init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})
```

## Notes

- **Error Handling**: Gracefully handles header parsing failures
- **Session Persistence**: Sessions remain valid for 30 minutes
- **Locale Detection**: Prioritizes URL path locale over Accept-Language header
- **Device Detection**: Falls back to 'desktop' if device type cannot be determined
- **Security**: Uses server-side Supabase client for secure database operations

## Related Files

- `lib/analytics.ts` - Analytics utilities and tracking functions
- `components/analytics/` - Frontend analytics components
- `app/api/analytics/` - Related analytics API endpoints
- `utils/supabase/server.ts` - Supabase server client configuration

## Database Schema Dependencies

- `analytics_sessions` table with RLS policies
- User authentication system integration
- Proper indexes on session_id and user_id for performance
