import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clapperboard, Film, Sparkles } from 'lucide-react';
import type { ScopeItem } from '../types';

interface Props {
  preProduction: ScopeItem[];
  production: ScopeItem[];
  postProduction: ScopeItem[];
}

export function ScopeSection({ preProduction, production, postProduction }: Props) {
  const sections = [
    { key: 'pre', label: 'Pré-Produção', icon: Sparkles, items: preProduction },
    { key: 'prod', label: 'Produção', icon: Clapperboard, items: production },
    { key: 'post', label: 'Pós-Produção', icon: Film, items: postProduction },
  ].filter(s => s.items.length > 0);

  if (sections.length === 0) return null;

  return (
    <section className="py-16 px-6 border-t border-white/5">
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-xs uppercase tracking-[0.3em] text-white/30 font-medium text-center">Escopo do Projeto</h2>

        <Accordion type="multiple" defaultValue={sections.map(s => s.key)} className="space-y-3">
          {sections.map(({ key, label, icon: Icon, items }) => (
            <AccordionItem key={key} value={key} className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-white/[0.02] text-white [&>svg]:text-white/40">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-white/40" />
                  <span className="text-base font-medium">{label}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <ul className="space-y-2.5">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/20 mt-2.5 shrink-0" />
                      <span className="text-sm sm:text-base">{item.item}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
