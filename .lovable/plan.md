

# Fix case thumbnails in ProposalGuidedWizard Step 4

## Changes in `src/features/proposals/components/ProposalGuidedWizard.tsx`

### 1. Add `Film` to lucide-react imports (line 20)
Add `Film` alongside existing icons.

### 2. Add VimeoThumbnail component (after imports, before main component)
Insert the provided `VimeoThumbnail` function component using `useState`, `useEffect`, `Film` icon, and vumbnail.com with Vimeo CDN fallback.

### 3. Replace case thumbnail block (lines 1038-1063)
Replace the current `{c.vimeo_id ? (<> <img ... onError> <div hidden fallback> </>) : (<div placeholder>)}` block with:

```tsx
{c.vimeo_id ? (
  <div className="w-24 h-16 rounded overflow-hidden shrink-0">
    <VimeoThumbnail videoId={extractVimeoId(c.vimeo_id)} videoHash={c.vimeo_hash || undefined} alt={c.campaign_name} className="w-full h-full" />
  </div>
) : (
  <div className="w-24 h-16 rounded bg-muted flex items-center justify-center shrink-0">
    <Video className="h-6 w-6 text-muted-foreground" />
  </div>
)}
```

No other changes.

