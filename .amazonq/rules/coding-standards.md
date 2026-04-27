# Change Makers - Coding Standards

## UI Component Rules

### Card Components
- Use `size="sm"` prop for all stat/KPI cards to maintain compact layouts
- For KPI cards, use CardHeader with CardDescription and CardTitle directly
- Avoid using CardHeader + CardContent wrapper pattern for stat cards (adds unnecessary padding)
- Use direct padding (e.g., `p-3`, `p-4`) only when not using CardHeader/CardContent

### Spacing & Layout
- Main container: `px-4 py-4 space-y-4` (compact spacing)
- Card grids: `gap-3` for consistent spacing
- Icon containers: `w-7 h-7` with appropriate background colors
- Icons: `size-3.5` for consistency
- Text spacing: Use `leading-none` or `leading-tight` for compact layouts

### Typography
- Page titles: `text-xl font-bold`
- Page descriptions: `text-xs text-muted-foreground`
- Card titles: `text-xl tabular-nums` for numbers
- Card labels: `text-xs` in CardDescription
- Inline units: `text-xs font-normal text-muted-foreground`

### Color Patterns
- Primary stats: `bg-primary/10` with `text-primary`
- Secondary stats: `bg-muted` with `text-muted-foreground`
- Special indicators: `bg-orange-500/10` with `text-orange-500`, `bg-rose-500/10` with `text-rose-500`

## Component Patterns

### Stat Card Pattern (Follow Dashboard ChannelOverview)
```tsx
<Card size="sm">
  <CardHeader>
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10">
        <Icon className="size-3.5 text-primary" />
      </div>
      <CardDescription className="text-xs">Label</CardDescription>
    </div>
    <CardTitle className="text-xl tabular-nums">
      {value} <span className="text-xs font-normal text-muted-foreground">unit</span>
    </CardTitle>
  </CardHeader>
</Card>
```

### View Component Pattern
```tsx
export function FeatureView({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await fetchYouTubeAnalytics();
      setData(result);
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <AppShell channel={data.channel} onRefresh={refresh} refreshing={refreshing} lastUpdated={lastUpdated}>
      <main className="flex-1 w-full px-4 py-4 space-y-4">
        {/* Content */}
      </main>
    </AppShell>
  );
}
```

## Common Mistakes to Avoid

1. **Don't add excessive padding/margins**
   - ❌ `px-6 py-8 space-y-6`
   - ✅ `px-4 py-4 space-y-4`

2. **Don't use CardHeader + CardContent for stat cards**
   - ❌ `<Card><CardHeader>...</CardHeader><CardContent>...</CardContent></Card>`
   - ✅ `<Card size="sm"><CardHeader>...</CardHeader></Card>`

3. **Don't forget size prop on stat cards**
   - ❌ `<Card>`
   - ✅ `<Card size="sm">`

4. **Don't use inconsistent icon sizes**
   - ❌ `w-4 h-4`, `w-5 h-5`, `w-3.5 h-3.5` mixed
   - ✅ `size-3.5` consistently

5. **Don't add unnecessary line height**
   - ❌ Default line height for compact layouts
   - ✅ `leading-none` or `leading-tight`

## TypeScript Rules

- Always define interfaces for component props
- Use strict type checking
- Avoid `any` types - use `unknown` if type is truly unknown
- Export types from `@/types` directory
- Use type imports: `import type { Type } from 'module'`

## API Integration

- Server-side data fetching in page components (async functions)
- Client-side refresh in view components (useState + useCallback)
- Always handle loading and error states
- Implement proper error boundaries
- Cache API responses when appropriate
- Be mindful of YouTube API quota limits

## File Organization

- Page components: `src/app/[feature]/page.tsx`
- View components: `src/components/[Feature]View.tsx`
- UI components: `src/components/ui/[component].tsx`
- Utilities: `src/lib/[utility].ts`
- Types: `src/types/[type].ts`

## Performance

- Use React.memo for expensive components
- Implement useMemo for expensive calculations
- Use useCallback for event handlers passed to children
- Optimize images with Next.js Image component
- Lazy load components when appropriate
