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

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **API Integration**: YouTube Data API v3
- **AI**: Google Gemini API
- **Authentication**: Cookie-based auth

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
