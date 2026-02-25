import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface Props {
  briefing: string | null;
  images: string[];
}

export function BriefingSection({ briefing, images }: Props) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  return (
    <section className="py-20 border-t border-white/10">
      <div className="space-y-8">
        <h2 className="text-xs uppercase tracking-[0.3em] text-[#4CFF5C] font-medium text-center">Briefing & Moodboard</h2>

        {briefing && (
          <div className="max-w-3xl mx-auto">
            <p className="text-white/60 leading-relaxed whitespace-pre-wrap text-base sm:text-lg font-light">
              {briefing}
            </p>
          </div>
        )}

        {images.length > 0 && (
          <div className="columns-2 sm:columns-3 gap-3 space-y-3">
            {images.map((url, i) => (
              <div
                key={i}
                className="break-inside-avoid cursor-pointer group"
                onClick={() => setLightboxImage(url)}
              >
                <img
                  src={url}
                  alt={`Moodboard ${i + 1}`}
                  className="w-full rounded-lg ring-1 ring-white/5 transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-white/10">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-50 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            {lightboxImage && (
              <img
                src={lightboxImage}
                alt="Moodboard fullscreen"
                className="w-full h-full object-contain"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
