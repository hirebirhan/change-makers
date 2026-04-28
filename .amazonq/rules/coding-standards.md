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
- Page titles: `text-xl font-semibold tracking-tight` or `text-2xl font-semibold tracking-tight`
- Page descriptions: `text-xs text-muted-foreground leading-none` or `text-sm text-muted-foreground leading-tight`
- Card titles: `text-xl tabular-nums` for numbers, `text-base font-semibold` for text
- Card labels: `text-xs` in CardDescription
- Inline units: `text-xs font-normal text-muted-foreground`
- Body text: Use `leading-tight` or `leading-none` for compact layouts
- Headings: Always use `font-semibold` with `tracking-tight` for polished look
- NEVER use `font-bold` - always use `font-semibold` for consistency with sidebar

### Color Patterns
- Primary stats: `bg-primary/10` with `text-primary`
- Secondary stats: `bg-muted` with `text-muted-foreground`
- Special indicators: `bg-orange-500/10` with `text-orange-500`, `bg-rose-500/10` with `text-rose-500`

### Chart Colors
- **CRITICAL**: Always use raw CSS variables for chart colors: `var(--chart-1)`, `var(--chart-2)`, etc.
- **NEVER** wrap chart variables in color functions like `hsl()`, `oklch()`, or `rgb()`
- Chart variables in globals.css already contain the complete color function
- ❌ WRONG: `color: "hsl(var(--chart-1))"` or `color: "oklch(var(--chart-1))"`
- ✅ CORRECT: `color: "var(--chart-1)"`
- For Tailwind classes, use: `bg-chart-1`, `text-chart-1`, `border-chart-1`, etc.
- Chart color mapping:
  - `--chart-1`: Green (primary, positive metrics)
  - `--chart-2`: Blue (secondary metrics)
  - `--chart-3`: Purple (tertiary metrics)
  - `--chart-4`: Pink (quaternary metrics)
  - `--chart-5`: Red/Orange (negative metrics, warnings)

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

6. **Don't use font-bold for headings**
   - ❌ `text-xl font-bold`
   - ✅ `text-xl font-semibold tracking-tight`

7. **Don't wrap chart color variables in color functions**
   - ❌ `color: "hsl(var(--chart-1))"` or `color: "oklch(var(--chart-1))"`
   - ✅ `color: "var(--chart-1)"`
   - Reason: CSS variables already contain complete color functions like `oklch(0.65 0.25 142)`

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
