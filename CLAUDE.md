# Change Makers — Claude Code Guide

YouTube analytics dashboard for "Birhan tech corner" (STEM/tech content).
**Stack:** Next.js 16 App Router · React 19 · TypeScript 5 · Tailwind CSS 4 · shadcn/ui · Gemini AI · YouTube Data API v3 · FFmpeg.wasm

---

## Architecture

- **Pages** (`src/app/`) are async server components — they fetch data server-side and pass it as props to client View components.
- **View components** (`src/components/*View.tsx`) are `"use client"` wrappers that hold refresh state and render the page UI inside `<AppShell>`.
- **API routes** (`src/app/api/`) are Next.js Route Handlers used for client-side refresh calls.
- **No database** — all persistent data comes from the YouTube API (300 s ISR). Lightweight client-side persistence uses `localStorage`.
- **Auth** — httpOnly cookie (`yt_auth=true`), middleware-enforced on all non-API routes.

---

## Code Conventions

- Functional components with TypeScript. No `any`.
- Tailwind CSS only — no inline styles.
- `shadcn/ui` components with `size="sm"` for compact KPI cards.
- Do **not** wrap KPI cards in `<CardHeader>/<CardContent>` — use direct padding.
- Use `leading-none` for tight metric text.
- Server-side fetch in `page.tsx`; client-side refresh via `/api/youtube` in the View component.
- All environment values via `process.env` — never hardcode keys or IDs.
- No comments unless the WHY is non-obvious.

---

## Planned Tasks (priority order)

### Bug Fixes
| # | Task | File(s) |
|---|------|---------|
| 1 | **"Updated just now" stays frozen** — add a 30 s tick interval in AppShell so `relativeTime()` re-evaluates | `src/components/AppShell.tsx` |
| 2 | **Data stale after re-login** — call `router.refresh()` + `router.push("/")` so server components re-run | `src/lib/auth.tsx` |
| 3 | **Monetization threshold wrong** — change `watchTimeHours: 3000 → 4000` (actual YPP requirement) | `src/components/MonetizationProgress.tsx` |

### Infrastructure
| # | Task | Notes |
|---|------|-------|
| 4 | **PWA** ✅ — `@ducanh2912/next-pwa`, **network-first** for navigations & API, cache-first only for content-hashed static bundles. Proper 192 × 192 and 512 × 512 PNG icons. Offline fallback page. | `next.config.ts`, `public/manifest.json`, `src/app/offline/page.tsx` |

### Navigation
| # | Task | Notes |
|---|------|-------|
| 5 | **Add Growth & Insights to sidebar** — both pages exist but are not in the `NAV` array | `src/components/AppShell.tsx` |
| 6 | **Mobile bottom nav bar** — 5-link bottom bar visible on `sm` breakpoint and below | `src/components/AppShell.tsx` |

### New Pages / Features
| # | Task | Notes |
|---|------|-------|
| 7 | **Video Script & Description Generator** — new page `/script-maker`, Gemini writes hook, timestamps structure, keywords, CTA from title + key points | New page + API route |
| 8 | **AI Comment Reply Drafts** — "Draft Reply" button per comment, Gemini suggests contextual reply | `src/components/comments/CommentCard.tsx` |
| 9 | **Upload Calendar** — GitHub-style 52 × 7 contribution heatmap of upload history | `src/components/GrowthView.tsx` or new component |
| 10 | **Content Pipeline kanban** — localStorage-backed board: Ideas → Scripted → Filming → Editing → Scheduled → Published | New page `/pipeline` |
| 11 | **Saved AI Outputs** — "Save" button in AI Studio writes Gemini output to `localStorage`, viewable in a side panel | `src/components/AIView.tsx` |
| 12 | **Notification / Alert system** — user sets subscriber/view thresholds in localStorage, banner shown on page load when crossed | New component wired into AppShell |

### Improvements
| # | Task | Notes |
|---|------|-------|
| 13 | **Gemini-based comment sentiment** — replace keyword matching with batched Gemini classification (50 comments per call) | `src/lib/comments-server.ts` or API route |

---

## PWA Strategy (task 4)

**Network-first everywhere data matters:**
- Page navigations → `NetworkFirst` (10 s timeout, fallback to cache only if offline)
- `/api/*` routes → `NetworkFirst` (10 s timeout, max 5-min TTL in cache)
- `/_next/static/*` → `CacheFirst` (content-addressed hashes, safe to cache long-term)
- YouTube image CDN → `StaleWhileRevalidate` (thumbnails, not analytics data)
- All other requests → `NetworkFirst`

**Offline fallback:** a minimal `/offline` page shown when navigation fails and no cached version exists.

**Icons required for installability:**
- `public/icons/icon-192.png` — 192 × 192 PNG (Android home screen)
- `public/icons/icon-512.png` — 512 × 512 PNG (Android splash)
- `public/icons/icon-maskable-512.png` — 512 × 512 with safe-zone padding (adaptive icons)
- `public/apple-touch-icon.png` — 180 × 180 PNG (iOS)

---

## Environment Variables

```
YOUTUBE_API_KEY=
YOUTUBE_CHANNEL_ID=
GEMINI_API_KEY=
LEGACY_ADMIN_USERNAME=
LEGACY_ADMIN_PASSWORD=
SESSION_SECRET=
TOKEN_ENCRYPTION_KEY=
NEXT_PUBLIC_APP_URL=      # e.g. https://your-domain.com
```
