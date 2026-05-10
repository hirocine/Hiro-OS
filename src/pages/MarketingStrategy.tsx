import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Estratégia.</h1>
            <p className="ph-sub">Persona e pilares de conteúdo da Hiro Films.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, marginTop: 24 }}>
          <section ref={personaRef} className="scroll-mt-20">
            <PersonaContent />
          </section>
          <section ref={pillarsRef} className="scroll-mt-20">
            <PillarsContent />
          </section>
        </div>
      </div>
    </div>
  );
}
