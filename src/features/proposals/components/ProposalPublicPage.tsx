import { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProposalDetails } from '../hooks/useProposalDetails';
import { Loader2 } from 'lucide-react';
import { UrgencyBar } from './UrgencyBar';
import { HeroSection } from './HeroSection';
import { AboutSection } from './AboutSection';
import { ShowcaseSection } from './ShowcaseSection';
import { BriefingSection } from './BriefingSection';
import { ScopeSection } from './ScopeSection';
import { TimelineSection } from './TimelineSection';
import { InvestmentSection } from './InvestmentSection';
import { FloatingActions } from './FloatingActions';
import { ProposalHeader } from './ProposalHeader';

export function ProposalPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: proposal, isLoading, error } = useProposalDetails(slug);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setHeaderVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [proposal]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Proposta não encontrada</h1>
          <p className="text-white/50">O link pode ter expirado ou estar incorreto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="print:hidden">
        <UrgencyBar validityDate={proposal.validity_date} />
        <ProposalHeader ref={headerRef} projectName={proposal.project_name} />
      </div>

      <HeroSection
        clientName={proposal.client_name}
        projectName={proposal.project_name}
        projectNumber={proposal.project_number}
        validityDate={proposal.validity_date}
        createdAt={proposal.created_at}
        clientResponsible={proposal.client_responsible}
      />

      <div ref={contentRef} className="proposal-content max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <AboutSection />

        {proposal.video_url && (
          <div className="print:hidden">
            <ShowcaseSection videoUrl={proposal.video_url} />
          </div>
        )}

        {(proposal.briefing || proposal.moodboard_images.length > 0) && (
          <BriefingSection briefing={proposal.briefing} images={proposal.moodboard_images as string[]} />
        )}

        {(proposal.scope_pre_production.length > 0 || proposal.scope_production.length > 0 || proposal.scope_post_production.length > 0) && (
          <ScopeSection
            preProduction={proposal.scope_pre_production}
            production={proposal.scope_production}
            postProduction={proposal.scope_post_production}
          />
        )}

        {proposal.timeline.length > 0 && (
          <TimelineSection timeline={proposal.timeline} />
        )}

        <InvestmentSection
          baseValue={proposal.base_value}
          discountPct={proposal.discount_pct}
          finalValue={proposal.final_value}
          paymentTerms={proposal.payment_terms}
        />
      </div>

      <div className="print:hidden">
        <FloatingActions projectName={proposal.project_name} visible={!headerVisible} />
      </div>

      <div className="h-24 print:hidden" />
    </div>
  );
}
