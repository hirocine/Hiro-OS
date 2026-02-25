interface Props {
  videoUrl: string;
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`;

  return null;
}

export function ShowcaseSection({ videoUrl }: Props) {
  const embedUrl = getEmbedUrl(videoUrl);
  if (!embedUrl) return null;

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-xs uppercase tracking-[0.3em] text-white/30 font-medium text-center">Showcase</h2>
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black/50 shadow-2xl ring-1 ring-white/5">
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Video Reel"
          />
        </div>
      </div>
    </section>
  );
}
