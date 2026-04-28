import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';

import { PersonaContent } from '@/components/Marketing/PersonaContent';
import { PillarsContent } from '@/components/Marketing/PillarsContent';

export default function MarketingStrategy() {
  const [searchParams] = useSearchParams();
  const personaRef = useRef<HTMLElement>(null);
  const pillarsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const aba = searchParams.get('aba');
    if (aba === 'pilares' && pillarsRef.current) {
      pillarsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (aba === 'persona' && personaRef.current) {
      personaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams]);

  return (
    <ResponsiveContainer>
      <PageHeader
        title="Estratégia"
        subtitle="Persona e pilares de conteúdo da Hiro Films"
      />

      <div className="space-y-10">
        <section ref={personaRef} className="scroll-mt-20">
          <PersonaContent />
        </section>

        <section ref={pillarsRef} className="scroll-mt-20">
          <PillarsContent />
        </section>
      </div>
    </ResponsiveContainer>
  );
}
