# Change Makers - Technical Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  Next.js 15 App (React 19) + Tailwind CSS + shadcn/ui          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                         │
│  • REST API Routes                                               │
│  • Server Actions                                                │
│  • Middleware (Auth, Rate Limiting)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│   Auth Service   │ │  Data Layer  │ │ Job Queue    │
│  (NextAuth.js)   │ │  (Prisma)    │ │ (BullMQ)     │
└──────────────────┘ └──────────────┘ └──────────────┘
        │                    │                │
        ▼                    ▼                ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│   Supabase       │ │  PostgreSQL  │ │ Redis        │
│   (Auth)         │ │  (Database)  │ │ (Queue)      │
└──────────────────┘ └──────────────┘ └──────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│  YouTube API     │ │  Gemini AI   │ │   Stripe     │
│  (Data + Analytics)│ │  (Insights)  │ │  (Payments)  │
└──────────────────┘ └──────────────┘ └──────────────┘
```

---

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  email_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  
  -- Subscription
  subscription_status VARCHAR(50) DEFAULT 'trial', -- trial, active, canceled, past_due
  subscription_plan VARCHAR(50), -- starter, pro, agency, enterprise
  subscription_id VARCHAR(255), -- Stripe subscription ID
  trial_ends_at TIMESTAMP,
  
  -- Settings
  timezone VARCHAR(50) DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{}',
  
  INDEX idx_email (email),
  INDEX idx_subscription_status (subscription_status)
);
```

#### channels
```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_channel_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Channel Info
  title VARCHAR(500) NOT NULL,
  description TEXT,
  custom_url VARCHAR(255),
  thumbnail_url TEXT,
  banner_url TEXT,
  
  -- Stats (cached)
  subscriber_count BIGINT DEFAULT 0,
  view_count BIGINT DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  
  -- Metadata
  published_at TIMESTAMP,
  country VARCHAR(10),
  keywords TEXT[],
  
  -- Access
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT, -- Encrypted OAuth token
  refresh_token TEXT, -- Encrypted OAuth refresh token
  token_expires_at TIMESTAMP,
  
  -- Sync
  last_synced_at TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'pending', -- pending, syncing, completed, failed
  sync_error TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_youtube_channel_id (youtube_channel_id),
  INDEX idx_owner_id (owner_id),
  INDEX idx_sync_status (sync_status)
);
```

#### videos
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_video_id VARCHAR(255) UNIQUE NOT NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  
  -- Video Info
  title VARCHAR(500) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  published_at TIMESTAMP NOT NULL,
  
  -- Stats (latest snapshot)
  view_count BIGINT DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT[],
  category_id VARCHAR(50),
  default_language VARCHAR(10),
  default_audio_language VARCHAR(10),
  
  -- Status
  privacy_status VARCHAR(50), -- public, unlisted, private
  upload_status VARCHAR(50),
  license VARCHAR(50),
  embeddable BOOLEAN DEFAULT true,
  
  -- Flags
  is_short BOOLEAN DEFAULT false,
  made_for_kids BOOLEAN DEFAULT false,
  
  -- Sync
  last_synced_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_youtube_video_id (youtube_video_id),
  INDEX idx_channel_id (channel_id),
  INDEX idx_published_at (published_at DESC),
  INDEX idx_is_short (is_short)
);
```

#### analytics_snapshots
```sql
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  snapshot_type VARCHAR(50) NOT NULL, -- daily, hourly, weekly
  
  -- Metrics
  views BIGINT DEFAULT 0,
  watch_time_minutes BIGINT DEFAULT 0,
  average_view_duration_seconds INTEGER,
  average_view_percentage DECIMAL(5,2),
  
  -- Engagement
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  
  -- Subscribers
  subscribers_gained INTEGER DEFAULT 0,
  subscribers_lost INTEGER DEFAULT 0,
  
  -- Traffic Sources (JSONB for flexibility)
  traffic_sources JSONB DEFAULT '{}',
  -- Example: {"youtube_search": 1000, "suggested_videos": 500, "external": 200}
  
  -- Demographics (JSONB)
  demographics JSONB DEFAULT '{}',
  -- Example: {"age_13_17": 100, "age_18_24": 500, "gender_male": 60}
  
  -- Devices (JSONB)
  devices JSONB DEFAULT '{}',
  -- Example: {"mobile": 600, "desktop": 300, "tv": 100}
  
  -- Geography (JSONB)
  geography JSONB DEFAULT '{}',
  -- Example: {"US": 500, "UK": 200, "CA": 100}
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(channel_id, video_id, snapshot_date, snapshot_type),
  INDEX idx_channel_date (channel_id, snapshot_date DESC),
  INDEX idx_video_date (video_id, snapshot_date DESC),
  INDEX idx_snapshot_type (snapshot_type)
);
```

#### ai_insights
```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  
  -- Insight Details
  insight_type VARCHAR(100) NOT NULL, -- title_suggestion, content_idea, optimization_tip
  category VARCHAR(100), -- seo, engagement, growth, monetization
  priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
  
  -- Content
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  action_items JSONB DEFAULT '[]',
  -- Example: [{"action": "Update title", "impact": "high", "effort": "low"}]
  
  -- Metadata
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  estimated_impact VARCHAR(50), -- low, medium, high
  data_sources JSONB DEFAULT '[]',
  
  -- Status
  status VARCHAR(50) DEFAULT 'new', -- new, viewed, applied, dismissed
  applied_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  
  -- AI Metadata
  model_version VARCHAR(50),
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Insights can expire
  
  INDEX idx_channel_id (channel_id),
  INDEX idx_video_id (video_id),
  INDEX idx_insight_type (insight_type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at DESC)
);
```

#### teams
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  
  -- Branding (for white-label)
  logo_url TEXT,
  primary_color VARCHAR(7), -- Hex color
  custom_domain VARCHAR(255),
  
  -- Owner
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Subscription
  subscription_plan VARCHAR(50),
  max_channels INTEGER DEFAULT 1,
  max_members INTEGER DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_owner_id (owner_id),
  INDEX idx_slug (slug)
);
```

#### team_members
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  role VARCHAR(50) NOT NULL, -- owner, admin, editor, viewer
  
  -- Permissions (JSONB for flexibility)
  permissions JSONB DEFAULT '{}',
  -- Example: {"can_edit_videos": true, "can_delete": false}
  
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(team_id, user_id),
  INDEX idx_team_id (team_id),
  INDEX idx_user_id (user_id)
);
```

#### channel_access
```sql
CREATE TABLE channel_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  role VARCHAR(50) NOT NULL, -- owner, editor, viewer
  
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(channel_id, user_id),
  INDEX idx_channel_id (channel_id),
  INDEX idx_user_id (user_id),
  INDEX idx_team_id (team_id)
);
```

#### content_calendar
```sql
CREATE TABLE content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  
  -- Content Details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'planned', -- planned, in_progress, scheduled, published, canceled
  
  -- Scheduling
  scheduled_publish_at TIMESTAMP,
  published_at TIMESTAMP,
  
  -- Video Details (if uploaded)
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  youtube_video_id VARCHAR(255),
  
  -- Metadata
  tags TEXT[],
  category VARCHAR(100),
  thumbnail_url TEXT,
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  
  -- Workflow
  approval_status VARCHAR(50), -- pending, approved, rejected
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_channel_id (channel_id),
  INDEX idx_scheduled_publish_at (scheduled_publish_at),
  INDEX idx_status (status)
);
```

#### competitor_channels
```sql
CREATE TABLE competitor_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tracking
  tracked_by_channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  competitor_youtube_channel_id VARCHAR(255) NOT NULL,
  
  -- Competitor Info (cached)
  title VARCHAR(500),
  subscriber_count BIGINT,
  view_count BIGINT,
  video_count INTEGER,
  
  -- Tracking Settings
  track_frequency VARCHAR(50) DEFAULT 'daily', -- daily, weekly
  last_tracked_at TIMESTAMP,
  
  -- Notes
  notes TEXT,
  tags TEXT[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(tracked_by_channel_id, competitor_youtube_channel_id),
  INDEX idx_tracked_by (tracked_by_channel_id)
);
```

#### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Stripe
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,
  
  -- Plan
  plan VARCHAR(50) NOT NULL, -- starter, pro, agency, enterprise
  status VARCHAR(50) NOT NULL, -- active, canceled, past_due, trialing
  
  -- Billing
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP,
  
  -- Trial
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  
  -- Usage
  usage_limits JSONB DEFAULT '{}',
  -- Example: {"channels": 3, "ai_operations": 1000}
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_id (user_id),
  INDEX idx_stripe_subscription_id (stripe_subscription_id),
  INDEX idx_status (status)
);
```

#### usage_tracking
```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Usage Type
  resource_type VARCHAR(100) NOT NULL, -- ai_operation, api_call, export
  resource_id VARCHAR(255),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  cost_cents INTEGER DEFAULT 0, -- Internal cost tracking
  
  -- Billing Period
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user_id (user_id),
  INDEX idx_resource_type (resource_type),
  INDEX idx_billing_period (billing_period_start, billing_period_end)
);
```

---

## API Endpoints

### Authentication

```
POST   /api/auth/signup
POST   /api/auth/signin
POST   /api/auth/signout
GET    /api/auth/session
POST   /api/auth/verify-email
POST   /api/auth/reset-password
```

### Channels

```
GET    /api/channels                    # List user's channels
POST   /api/channels/connect            # Connect YouTube channel (OAuth)
GET    /api/channels/:id                # Get channel details
PUT    /api/channels/:id                # Update channel settings
DELETE /api/channels/:id                # Disconnect channel
POST   /api/channels/:id/sync           # Trigger manual sync
GET    /api/channels/:id/analytics      # Get analytics data
GET    /api/channels/:id/insights       # Get AI insights
```

### Videos

```
GET    /api/channels/:channelId/videos           # List videos
GET    /api/videos/:id                           # Get video details
PUT    /api/videos/:id                           # Update video metadata
DELETE /api/videos/:id                           # Delete video (from our DB)
GET    /api/videos/:id/analytics                 # Get video analytics
POST   /api/videos/:id/optimize                  # Get AI optimization suggestions
POST   /api/videos/bulk-update                   # Bulk update videos
```

### Analytics

```
GET    /api/analytics/overview                   # Dashboard overview
GET    /api/analytics/performance                # Performance metrics
GET    /api/analytics/trends                     # Trend analysis
GET    /api/analytics/competitors                # Competitor comparison
POST   /api/analytics/export                     # Export data
```

### AI Services

```
POST   /api/ai/title-suggestions                 # Generate title suggestions
POST   /api/ai/title-score                       # Score a title
POST   /api/ai/thumbnail-analysis                # Analyze thumbnail
POST   /api/ai/content-ideas                     # Generate content ideas
POST   /api/ai/keyword-research                  # Keyword suggestions
POST   /api/ai/description-optimize              # Optimize description
GET    /api/ai/insights/:channelId               # Get AI insights
POST   /api/ai/insights/:id/apply                # Apply insight
POST   /api/ai/insights/:id/dismiss              # Dismiss insight
```

### Teams

```
GET    /api/teams                                # List user's teams
POST   /api/teams                                # Create team
GET    /api/teams/:id                            # Get team details
PUT    /api/teams/:id                            # Update team
DELETE /api/teams/:id                            # Delete team
GET    /api/teams/:id/members                    # List team members
POST   /api/teams/:id/members                    # Invite member
DELETE /api/teams/:id/members/:userId            # Remove member
PUT    /api/teams/:id/members/:userId            # Update member role
```

### Content Calendar

```
GET    /api/calendar/:channelId                  # Get calendar items
POST   /api/calendar/:channelId                  # Create calendar item
GET    /api/calendar/items/:id                   # Get item details
PUT    /api/calendar/items/:id                   # Update item
DELETE /api/calendar/items/:id                   # Delete item
POST   /api/calendar/items/:id/schedule          # Schedule for publishing
POST   /api/calendar/items/:id/approve           # Approve item
```

### Subscriptions

```
GET    /api/subscriptions/plans                  # List available plans
POST   /api/subscriptions/checkout               # Create checkout session
POST   /api/subscriptions/portal                 # Customer portal link
GET    /api/subscriptions/current                # Current subscription
POST   /api/subscriptions/upgrade                # Upgrade plan
POST   /api/subscriptions/cancel                 # Cancel subscription
GET    /api/subscriptions/usage                  # Usage statistics
```

### Webhooks

```
POST   /api/webhooks/stripe                      # Stripe webhook
POST   /api/webhooks/youtube                     # YouTube webhook (PubSubHubbub)
```

---

## Background Jobs

### Sync Jobs

```typescript
// Daily full sync
{
  name: 'sync-channel-full',
  schedule: '0 2 * * *', // 2 AM daily
  handler: async (channelId: string) => {
    // Sync channel stats
    // Sync all videos
    // Sync analytics data
    // Generate AI insights
  }
}

// Hourly quick sync
{
  name: 'sync-channel-quick',
  schedule: '0 * * * *', // Every hour
  handler: async (channelId: string) => {
    // Sync channel stats only
    // Sync recent videos (last 7 days)
  }
}

// Video analytics sync
{
  name: 'sync-video-analytics',
  schedule: '*/30 * * * *', // Every 30 minutes
  handler: async (videoId: string) => {
    // Sync video stats
    // Create analytics snapshot
  }
}
```

### AI Jobs

```typescript
// Generate insights
{
  name: 'generate-ai-insights',
  schedule: '0 3 * * *', // 3 AM daily
  handler: async (channelId: string) => {
    // Analyze channel performance
    // Generate content suggestions
    // Identify optimization opportunities
    // Create AI insights
  }
}

// Process AI request
{
  name: 'process-ai-request',
  queue: 'ai-requests',
  handler: async (request: AIRequest) => {
    // Call Gemini API
    // Process response
    // Store result
    // Notify user
  }
}
```

### Cleanup Jobs

```typescript
// Clean expired insights
{
  name: 'cleanup-expired-insights',
  schedule: '0 4 * * *', // 4 AM daily
  handler: async () => {
    // Delete expired AI insights
    // Archive old analytics snapshots
  }
}

// Clean failed jobs
{
  name: 'cleanup-failed-jobs',
  schedule: '0 5 * * 0', // 5 AM every Sunday
  handler: async () => {
    // Remove old failed jobs
    // Send error reports
  }
}
```

---

## Security Considerations

### Authentication
- Use NextAuth.js v5 with secure session handling
- Implement CSRF protection
- Use httpOnly cookies for session tokens
- Implement rate limiting on auth endpoints

### API Security
- Validate all inputs with Zod schemas
- Implement rate limiting per user/IP
- Use API keys for external integrations
- Encrypt sensitive data at rest (OAuth tokens)

### Data Privacy
- GDPR compliance (data export, deletion)
- Encrypt PII in database
- Implement audit logs for sensitive operations
- Regular security audits

### YouTube API
- Store OAuth tokens encrypted
- Implement token refresh logic
- Handle revoked access gracefully
- Respect YouTube API ToS

---

## Performance Optimization

### Caching Strategy
```typescript
// Redis cache layers
const CACHE_KEYS = {
  channelStats: (id) => `channel:${id}:stats`,
  videoList: (channelId) => `channel:${channelId}:videos`,
  analytics: (id, date) => `analytics:${id}:${date}`,
  aiInsights: (channelId) => `insights:${channelId}`,
};

// Cache TTLs
const CACHE_TTL = {
  channelStats: 300, // 5 minutes
  videoList: 600, // 10 minutes
  analytics: 3600, // 1 hour
  aiInsights: 1800, // 30 minutes
};
```

### Database Optimization
- Use indexes on frequently queried columns
- Implement connection pooling
- Use read replicas for analytics queries
- Archive old data to separate tables

### API Optimization
- Implement request batching
- Use GraphQL for flexible queries (future)
- Compress responses with gzip
- Use CDN for static assets

---

## Monitoring & Observability

### Metrics to Track
- API response times
- Database query performance
- Background job success/failure rates
- YouTube API quota usage
- AI API costs
- User engagement metrics

### Alerting
- Failed background jobs
- High error rates
- API quota approaching limit
- Database connection issues
- Payment failures

### Logging
- Structured logging with context
- Error tracking with Sentry
- User activity logs
- API request logs

---

## Deployment Strategy

### Environments
```
Development  → Local + Supabase Dev
Staging      → Vercel Preview + Supabase Staging
Production   → Vercel Production + Supabase Production
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, staging]

jobs:
  test:
    - Run TypeScript checks
    - Run unit tests
    - Run integration tests
    
  deploy:
    - Deploy to Vercel
    - Run database migrations
    - Smoke tests
    - Notify team
```

### Database Migrations
```bash
# Using Prisma Migrate
npx prisma migrate dev      # Development
npx prisma migrate deploy   # Production
```

---

## Next Steps

1. Set up development environment
2. Initialize database with Prisma
3. Implement authentication flow
4. Build channel connection (OAuth)
5. Create basic dashboard
6. Implement data sync pipeline
7. Add subscription system
8. Launch beta

This architecture provides a solid foundation for scaling to thousands of users while maintaining performance and reliability.
