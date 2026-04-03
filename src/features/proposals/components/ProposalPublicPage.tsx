import { useParams } from 'react-router-dom';
import { useProposalDetails } from '../hooks/useProposalDetails';
import { Loader2 } from 'lucide-react';
import { ProposalNavbar } from './public/ProposalNavbar';
import { ProposalHero } from './public/ProposalHero';
import { ProposalClients } from './public/ProposalClients';
import { ProposalCases } from './public/ProposalCases';
import { ProposalObjetivo } from './public/ProposalObjetivo';
import { ProposalEntregaveis } from './public/ProposalEntregaveis';
import { ProposalInvestimento } from './public/ProposalInvestimento';
import { ProposalProximosPassos } from './public/ProposalProximosPassos';
import { ProposalDownloadButton } from './public/ProposalDownloadButton';
import { ProposalFooter } from './public/ProposalFooter';

function GlowSpot({ className }: { className: string }) {
  return (
    <div className={`absolute pointer-events-none w-[600px] h-[600px] rounded-full bg-[#4CFF5C]/[0.03] blur-[120px] ${className}`} />
  )
}

export function ProposalPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: proposal, isLoading, error } = useProposalDetails(slug);

  if (isLoading) {
    return null;
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Proposta não encontrada</h1>
          <p className="text-white/50">O link pode ter expirado ou estar incorreto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="proposal-page min-h-screen bg-black text-[#f5f5f5] relative">
      <GlowSpot className='right-[-200px] top-[1800px]' />
      <GlowSpot className='left-[-200px] top-[3200px]' />
      <GlowSpot className='right-[-100px] top-[4800px]' />
      <GlowSpot className='left-[-150px] top-[6200px]' />

      <div className="no-print">
        <ProposalNavbar validityDate={proposal.validity_date} />
      </div>
      <div className="no-print">
        <ProposalDownloadButton
          whatsappNumber={proposal.whatsapp_number}
          projectName={proposal.project_name}
        />
      </div>

      <ProposalHero
        clientName={proposal.client_name}
        projectName={proposal.project_name}
        validityDate={proposal.validity_date}
        createdAt={proposal.created_at}
        clientResponsible={proposal.client_responsible}
        companyDescription={proposal.company_description}
      />

      <ProposalClients />

      <div className='proposal-content-px'><div className='border-b border-gray-800' /></div>

      <ProposalObjetivo
        objetivo={proposal.objetivo}
        clientName={proposal.client_name}
        diagnosticoDores={proposal.diagnostico_dores}
      />

      {proposal.cases.length > 0 && (
        <ProposalCases cases={proposal.cases} />
      )}

      {proposal.entregaveis.length > 0 && (
        <ProposalEntregaveis entregaveis={proposal.entregaveis} />
      )}

      <div className='proposal-content-px'><div className='border-b border-gray-800' /></div>

      <div className='relative overflow-hidden'>
        <div className='absolute inset-0 pointer-events-none overflow-hidden'>
          <div className='absolute inset-[-10%] w-[120%] h-[120%] proposal-invest-gradient-1' />
          <div className='absolute inset-[-10%] w-[120%] h-[120%] proposal-invest-gradient-2' />
        </div>
        <div className='relative z-10'>
          <ProposalInvestimento
            baseValue={proposal.base_value}
            finalValue={proposal.final_value}
            discountPct={proposal.discount_pct}
            listPrice={proposal.list_price}
            paymentTerms={proposal.payment_terms}
            paymentOptions={proposal.payment_options}
            testimonialName={proposal.testimonial_name}
            testimonialRole={proposal.testimonial_role}
            testimonialText={proposal.testimonial_text}
            testimonialImage={proposal.testimonial_image}
          />
        </div>
      </div>

      <div className='relative overflow-hidden rounded-t-[40px] border-t border-gray-800'>
        <div className='absolute inset-0 pointer-events-none overflow-hidden' style={{ zIndex: 0 }}>
          <div className='absolute inset-[-25%] w-[150%] h-[150%]'>
            <iframe
              src='https://player.vimeo.com/video/1068269996?h=bad24e450f&title=0&byline=0&portrait=0&background=1&muted=1'
              className='w-full h-full border-0'
              tabIndex={-1}
              allow='autoplay'
            />
          </div>
          <div className='absolute inset-0' style={{
            zIndex: 1,
            background: 'linear-gradient(to right, rgb(0,0,0) 35%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.1) 100%)',
          }} />
          <div className='absolute inset-x-0 bottom-0 h-[200px]' style={{
            zIndex: 2,
            background: 'linear-gradient(to bottom, transparent 0%, rgb(0,0,0) 100%)',
          }} />
        </div>
        <div className='relative' style={{ zIndex: 2 }}>
          <ProposalProximosPassos validityDate={proposal.validity_date} />
        </div>
      </div>

      <ProposalFooter />
    </div>
  );
}

