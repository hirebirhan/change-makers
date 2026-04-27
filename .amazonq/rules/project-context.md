# Change Makers - Project Context

## Project Overview
Change Makers is a YouTube Analytics Dashboard built with Next.js 15, providing creators with comprehensive insights, AI-powered tools, and content optimization features.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Library**: shadcn/ui
- **APIs**: YouTube Data API v3, Google Gemini API
- **Authentication**: Cookie-based (yt_auth cookie)

## Environment Variables Required
```
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_CHANNEL_ID=your_channel_id
GEMINI_API_KEY=your_gemini_api_key
```

## Application Features

### Current Features
1. **Dashboard** - Channel overview, analytics charts, top videos, monetization progress
2. **Growth Tracking** - Upload streaks, milestones, achievements
3. **Performance Analytics** - Video metrics, engagement analysis
4. **Video Management** - Complete video library with stats
5. **SEO Studio** - Keyword insights, SEO scores, title suggestions
6. **Title Ranker** - AI-powered title scoring
7. **Comment Management** - Centralized comment viewing
8. **AI Assistant** - Content strategy and recommendations
9. **Insights** - Deep dive analytics and reports

### Future Features (Not Yet Implemented)
- Video upload functionality
- Content scheduling and calendar
- Multi-channel management
- Team collaboration tools
- A/B testing for titles/thumbnails
- Automated transcription
- Competitor analysis
- Revenue analytics

## Authentication Flow
1. User visits `/login`
2. Authenticates with YouTube credentials
3. Cookie `yt_auth=true` is set
4. Protected pages check for cookie, redirect to `/login` if missing
5. All pages use `cookies()` from `next/headers` for auth check

## Data Flow
1. **Server-side**: Page components fetch initial data using `getYouTubeData()` from `@/lib/youtube-server`
2. **Client-side**: View components receive `initialData` and handle refresh with `fetchYouTubeAnalytics()` from `@/lib/youtube-api`
3. **State management**: Local state with useState, no global state library
4. **Refresh pattern**: Manual refresh button in AppShell triggers data refetch

## Key Components

### Layout Components
- `AppShell` - Main layout wrapper with sidebar, header, refresh functionality
- `Sidebar` - Navigation menu with all feature links
- `Header` - Top bar with channel info and refresh button

### Feature Components
- `DashboardView` - Main dashboard with overview
- `GrowthView` - Growth tracking page
- `PerformanceView` - Performance analytics
- `SeoView` - SEO studio
- `TitleRankerView` - Title ranking tool
- `CommentsView` - Comment management
- `AiView` - AI assistant
- `InsightsView` - Deep insights

### Shared Components
- `ChannelOverview` - Stat cards for channel metrics
- `AnalyticsChart` - Line chart for daily metrics
- `VideoCard` - Individual video display
- `MonetizationProgress` - Progress toward monetization
- `ReportsSection` - Report cards display

## API Routes
- `/api/youtube` - Fetch YouTube data
- `/api/auth` - Authentication endpoints
- `/api/gemini` - AI/Gemini integration
- `/api/seo` - SEO analysis
- `/api/title-ranker` - Title ranking
- `/api/comments` - Comment management

## YouTube API Quota Management
- Daily quota: 10,000 units
- Video list: ~3 units per request
- Channel stats: ~1 unit per request
- Comment threads: ~1 unit per request
- Implement caching to minimize API calls
- Use refresh sparingly

## Design System

### Colors
- Primary: Default theme primary color
- Muted: Gray tones for secondary elements
- Chart colors: chart-1, chart-2, chart-3, chart-4, chart-5
- Special: orange-500 (streaks), rose-500 (engagement)

### Spacing Scale
- Tight: gap-2, p-2, space-y-2
- Normal: gap-3, p-3, space-y-3
- Comfortable: gap-4, p-4, space-y-4
- Loose: gap-6, p-6, space-y-6

### Responsive Breakpoints
- Mobile: default (< 768px)
- Tablet: md (768px+)
- Desktop: lg (1024px+)
- Wide: xl (1280px+)

## Common Data Types

### ChannelStats
```typescript
{
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  totalEngagement: number;
  title: string;
  description: string;
  thumbnailUrl: string;
}
```

### Video
```typescript
{
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  isShort: boolean;
}
```

### DailyMetric
```typescript
{
  date: string;
  views: number;
  subscribers: number;
  watchTimeHours: number;
  engagement: number;
}
```

## Development Workflow
1. Create page component in `src/app/[feature]/page.tsx`
2. Create view component in `src/components/[Feature]View.tsx`
3. Add navigation link in Sidebar component
4. Implement server-side data fetching in page
5. Implement client-side refresh in view
6. Add proper TypeScript types
7. Follow existing card and layout patterns
8. Test authentication flow
9. Verify responsive design

## Testing Checklist
- [ ] Authentication redirect works
- [ ] Data loads on initial page load
- [ ] Refresh button updates data
- [ ] Responsive layout on mobile/tablet/desktop
- [ ] Loading states display correctly
- [ ] Error states handled gracefully
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] Consistent styling with other pages
- [ ] API quota usage is reasonable
