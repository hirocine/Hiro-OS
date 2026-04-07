

# Fix HeroBanner layout jump and add widget entrance animation

## Problem
The content area uses `justify-between` with a conditional bottom section (`{(nextRec || weather?.current_weather) && ...}`). When weather/recording data loads after the banner image, the `h1` jumps from bottom to middle as the widget row appears.

## Solution

### File: `src/components/Home/HeroBanner.tsx`

**1. Always render the bottom widget row** -- remove the conditional wrapper so the row always occupies space. Show placeholder height when data isn't ready, then fade in content.

Replace the conditional `{(nextRec || weather?.current_weather) && (` (line 145) with an always-rendered container. The widgets inside fade in with a CSS transition:

```tsx
{/* Always present — reserves space, content fades in */}
<div className={cn(
  "flex items-end justify-between w-full mt-auto pt-8 transition-all duration-700 ease-out",
  (nextRec || weather?.current_weather)
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-2 pointer-events-none"
)}>
  {/* recording pill */}
  {nextRec ? ( ... ) : <div />}
  {/* weather pills */}
  {weather?.current_weather ? ( ... ) : <div />}
</div>
```

This keeps the `h1` in its final position from the start since the bottom row always takes up space.

**2. Add staggered entrance animation to weather pills**

Add a small delay to the weather group so it slides in slightly after the recording pill:

- Recording pill: `transition-all duration-500 delay-300`
- Weather group: `transition-all duration-500 delay-500`

Both start `opacity-0 translate-y-1` and animate to `opacity-100 translate-y-0` when their data is available.

**3. Import `cn`** (already imported via `@/lib/utils`).

### No other files changed.

