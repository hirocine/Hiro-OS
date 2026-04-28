import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Separator } from '@/components/ui/separator';
import { UserCircle, Layers } from 'lucide-react';

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

      {/* === SEÇÃO 1: Persona / ICP === */}
      <section ref={personaRef} className="scroll-mt-20">
        <div className="flex items-center gap-3 pb-3 mb-5 border-b border-border">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <UserCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight">Persona / ICP</h2>
            <p className="text-sm text-muted-foreground">Quem é o cliente ideal da Hiro Films</p>
          </div>
        </div>
        <PersonaContent />
      </section>

      <div className="my-6">
        <Separator />
      </div>

      {/* === SEÇÃO 2: Pilares === */}
      <section ref={pillarsRef} className="scroll-mt-20">
        <div className="flex items-center gap-3 pb-3 mb-5 border-b border-border">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight">Pilares de Conteúdo</h2>
            <p className="text-sm text-muted-foreground">Os temas centrais que sua marca representa</p>
          </div>
        </div>
        <PillarsContent />
      </section>
    </ResponsiveContainer>
  );
}
