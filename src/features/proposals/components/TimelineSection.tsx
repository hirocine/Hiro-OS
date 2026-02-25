import type { TimelineItem } from '../types';

interface Props {
  timeline: TimelineItem[];
}

export function TimelineSection({ timeline }: Props) {
  if (timeline.length === 0) return null;

  return (
    <section className="py-16 px-6 border-t border-white/5">
      <div className="max-w-3xl mx-auto space-y-10">
        <h2 className="text-xs uppercase tracking-[0.3em] text-white/30 font-medium text-center">Cronograma</h2>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />

          <div className="space-y-8">
            {timeline.map((item, i) => (
              <div key={i} className="relative flex gap-6 pl-4 sm:pl-6">
                {/* Dot */}
                <div className="absolute left-4 sm:left-6 top-1.5 -translate-x-1/2 h-3 w-3 rounded-full border-2 border-white/30 bg-[#111113] z-10" />

                <div className="ml-6 space-y-1">
                  <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                    {item.week}
                  </p>
                  <p className="text-white/50 text-sm sm:text-base">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
