# Change Makers - YouTube Analytics Dashboard

A comprehensive YouTube channel analytics and management platform built with Next.js, providing creators with powerful insights, AI-powered tools, and content optimization features.

## Features

### 📊 Dashboard
- Real-time channel statistics (subscribers, views, videos, engagement)
- Interactive analytics charts with daily metrics
- Top performing videos ranked by views
- YouTube Shorts performance tracking
- Monetization progress tracking (1K subscribers & 4K watch hours)

### 📈 Growth Tracking
- Upload streak monitoring (current and longest streaks)
- Growth milestones with progress indicators
- Achievement badges for reaching key metrics
- Visual progress bars for subscribers, views, and video count

### 🎯 Performance Analytics
- Video performance metrics and comparisons
- Engagement rate analysis
- Watch time and retention insights
- Content performance trends

### 🎬 Video Management
- Complete video library with thumbnails
- Detailed video statistics (views, likes, comments)
- Video duration and publish date tracking
- Shorts vs regular video categorization

### 🔍 SEO Studio
- Keyword insights and analysis
- Video SEO score calculation
- Google Trends integration
- AI-powered title suggestions
- Content optimization recommendations

### 🏆 Title Ranker
- AI-powered title scoring and analysis
- Multiple title comparison
- SEO optimization suggestions
- Engagement prediction

### 💬 Comment Management
- Centralized comment viewing and management
- Comment sentiment analysis
- Quick response capabilities
- Engagement tracking per video

### 🤖 AI Assistant
- Content strategy recommendations
- Video idea generation
- Audience insights analysis
- Performance optimization tips

### 📊 Insights
- Deep dive analytics and reports
- Audience behavior patterns
- Content performance trends
- Growth opportunity identification

## Tech Stack

- **Framework**: Next.js App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **API Integration**: YouTube Data API v3
- **AI**: Google Gemini API
- **Authentication**: Google OAuth 2.0 Authorization Code Flow with HttpOnly sessions

## Architecture Decision

This project remains a single Next.js app rather than a monorepo. The existing app already uses App Router pages and route handlers, and the new OAuth requirements can be handled securely server-side with Node route handlers, HttpOnly cookies, encrypted token storage, and API proxy routes. A separate backend is still a good future option for background sync jobs, queue workers, multi-tenant analytics warehousing, or cross-domain deployments, but it would add migration risk right now without improving the current security boundary.

The app now has two YouTube data-access modes:

- **Public mode**: existing API-key features keep using `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID`. These routes remain separate and do not require Google sign-in.
- **Authorized mode**: Google sign-in identifies the user, then “Connect YouTube” requests YouTube scopes incrementally. Google access and refresh tokens never go to the browser.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- YouTube Data API v3 credentials
- Google Gemini API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd change-makers
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_CHANNEL_ID=your_channel_id
GEMINI_API_KEY=your_gemini_api_key

APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=file:.data/auth-db.json

GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_LOGIN_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_YOUTUBE_REDIRECT_URI=http://localhost:3000/auth/youtube/callback
GOOGLE_LOGIN_SCOPES=openid email profile
GOOGLE_YOUTUBE_SCOPES=https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly
GOOGLE_REVENUE_SCOPE=https://www.googleapis.com/auth/yt-analytics-monetary.readonly
SESSION_SECRET=replace_with_at_least_32_random_characters
TOKEN_ENCRYPTION_KEY=replace_with_32_random_bytes_base64
LEGACY_ADMIN_USERNAME=admin
LEGACY_ADMIN_PASSWORD=replace_with_a_strong_legacy_password
```

Generate a local token encryption key with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard
│   ├── growth/            # Growth tracking
│   ├── performance/       # Performance analytics
│   ├── videos/            # Video management
│   ├── seo/               # SEO studio
│   ├── title-ranker/      # Title ranking tool
│   ├── comments/          # Comment management
│   ├── ai/                # AI assistant
│   └── insights/          # Deep insights
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── lib/                   # Utility functions
│   ├── youtube-api.ts    # YouTube API integration
│   ├── youtube-server.ts # Server-side YouTube data
│   └── analytics-utils.ts # Analytics calculations
└── types/                 # TypeScript type definitions
```

## OAuth Endpoints

- `GET /auth/google/start`
- `GET /auth/google/callback`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /auth/youtube/start`
- `GET /auth/youtube/callback`
- `POST /auth/youtube/disconnect`
- `GET /api/youtube/me/channels`
- `GET /api/youtube/me/analytics/overview`
- `GET /api/youtube/me/analytics/videos`
- `GET /api/youtube/me/analytics/revenue`

No endpoint returns Google access tokens, refresh tokens, authorization codes, or client secrets.

## Google Cloud Console Setup

1. Create or select a Google Cloud project.
2. Enable **YouTube Data API v3**.
3. Enable **YouTube Analytics API**.
4. Configure the OAuth consent screen with app name, support email, developer contact, and authorized domains.
5. Create an OAuth 2.0 Client ID for a web application.
6. Add local redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - `http://localhost:3000/auth/youtube/callback`
7. Add matching production redirect URIs for your deployed domain.
8. Add scopes:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/yt-analytics.readonly`
   - `https://www.googleapis.com/auth/yt-analytics-monetary.readonly` only for revenue features
9. Public production apps using sensitive YouTube scopes may require Google verification before broad release.

## OAuth Storage

The included local development repository stores OAuth data in `DATABASE_URL=file:.data/auth-db.json` with encrypted tokens. Use `docs/oauth-schema.sql` as the production database shape when moving to Postgres/MySQL or another managed database. Required tables are `users`, `google_connections`, `oauth_states`, and future-ready `analytics_snapshots`.

## Security Checklist

- Keep `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET`, and `TOKEN_ENCRYPTION_KEY` server-only and out of `NEXT_PUBLIC_*`.
- Use HTTPS in production so HttpOnly secure cookies are enforced.
- Rotate `TOKEN_ENCRYPTION_KEY` with a planned re-encryption process.
- Use a managed database in production instead of the local JSON development store.
- Keep OAuth redirect URIs exact and environment-specific.
- Do not log tokens, authorization codes, client secrets, or OAuth state values.
- Monitor refresh failures; `invalid_grant` marks the YouTube connection revoked and requires reconnect.

## Future Features

### 🎥 Video Upload & Management
- Direct video upload to YouTube
- Bulk video editing (titles, descriptions, tags)
- Thumbnail upload and management
- Video metadata optimization

### 📅 Content Scheduling
- Schedule video uploads for optimal times
- Content calendar with drag-and-drop
- Automated publishing workflow
- Timezone-aware scheduling
- Recurring upload schedules

### 📱 Advanced Features (Planned)
- Multi-channel management
- Team collaboration tools
- Advanced A/B testing for titles/thumbnails
- Automated video transcription
- Competitor analysis
- Revenue analytics and forecasting

## Development Guidelines

### Code Style Rules

1. **Component Structure**
   - Use functional components with TypeScript
   - Keep components focused and single-purpose
   - Extract reusable logic into custom hooks

2. **Styling**
   - Use Tailwind CSS utility classes
   - Follow the existing spacing system (gap-3, p-4, space-y-4)
   - Use shadcn/ui components with `size="sm"` for compact layouts
   - Maintain consistent card padding and spacing across pages

3. **API Integration**
   - Server-side data fetching in page components
   - Client-side refresh functionality in view components
   - Proper error handling and loading states

4. **Type Safety**
   - Define interfaces for all data structures
   - Use strict TypeScript configuration
   - Avoid `any` types

5. **Performance**
   - Minimize bundle size
   - Optimize images and assets
   - Use React.memo for expensive components
   - Implement proper caching strategies

### Common Pitfalls to Avoid

- ❌ Don't use CardHeader/CardContent for KPI cards (use direct padding instead)
- ❌ Don't add excessive margins/padding (keep layouts compact)
- ❌ Don't forget to add `size="sm"` prop to stat cards
- ❌ Don't hardcode values (use environment variables)
- ❌ Don't skip error boundaries for API calls
- ✅ Do match dashboard card styling for consistency
- ✅ Do use `leading-none` for compact text
- ✅ Do implement proper loading and error states
- ✅ Do follow the existing component patterns

## API Rate Limits

YouTube Data API v3 has a quota limit of 10,000 units per day. Be mindful of:
- Each video list request costs ~3 units
- Channel statistics cost ~1 unit
- Comment threads cost ~1 unit per request

Implement caching and refresh strategies to stay within limits.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue in the repository.

---

Built with ❤️ for YouTube creators
