

# Replace VimeoThumbnail in ProposalDetails.tsx

## What
Replace the current `VimeoThumbnail` component (lines 90-123) that uses the Vimeo oEmbed API (which causes CORS errors) with a simpler version that uses `vumbnail.com` directly and falls back to Vimeo CDN via `<img onError>`.

## Changes

### `src/pages/ProposalDetails.tsx`

**Lines 89-123** — Replace the entire `VimeoThumbnail` function with:

```tsx
// Vimeo thumbnail component - defined at module level to avoid re-creation on every render
function VimeoThumbnail({ videoId, videoHash, alt, className }: { videoId: string; videoHash?: string; alt?: string; className?: string }) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    setFailed(false);
    setThumbUrl(`https://vumbnail.com/${videoId}.jpg`);
  }, [videoId]);

  if (failed || !thumbUrl) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className || ''}`}>
        <Briefcase className="h-8 w-8 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <img
      src={thumbUrl}
      alt={alt || ''}
      className={`object-cover ${className || ''}`}
      loading="lazy"
      onError={() => {
        if (thumbUrl.includes('vumbnail.com')) {
          setThumbUrl(`https://i.vimeocdn.com/video/${videoId}_640.jpg`);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
```

No other changes.

