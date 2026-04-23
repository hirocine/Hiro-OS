import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProposalServices } from '../ProposalServices';
import { createDefaultServices } from '@/lib/services-template';

function makeServicesAllIncluded() {
  const s = createDefaultServices();
  s.phases.forEach((p) => p.subcategories.forEach((sub) => sub.items.forEach((i) => (i.included = true))));
  return s;
}

describe('ProposalServices', () => {
  it('não renderiza fase com enabled:false', () => {
    const services = makeServicesAllIncluded();
    services.phases[0].enabled = false;
    render(<ProposalServices services={services} />);
    expect(screen.queryByText('Pré-produção')).not.toBeInTheDocument();
    expect(screen.getByText('Gravação')).toBeInTheDocument();
  });

  it('não renderiza fase sem nenhum item incluído', () => {
    const services = createDefaultServices();
    // Habilitar apenas 1 item em pos_producao
    const pos = services.phases.find((p) => p.id === 'pos_producao')!;
    pos.subcategories[0].items[0].included = true;
    render(<ProposalServices services={services} />);
    expect(screen.queryByText('Pré-produção')).not.toBeInTheDocument();
    expect(screen.queryByText('Gravação')).not.toBeInTheDocument();
    expect(screen.getByText('Pós-produção')).toBeInTheDocument();
  });

  it('renderiza specification quando não-vazia', () => {
    const services = makeServicesAllIncluded();
    services.phases[0].subcategories[0].items[0].specification = 'Texto único de teste';
    render(<ProposalServices services={services} />);
    expect(screen.getByText('Texto único de teste')).toBeInTheDocument();
  });

  it('formata quantity como {n}x', () => {
    const services = makeServicesAllIncluded();
    services.phases[0].subcategories[0].items[0].quantity = 3;
    render(<ProposalServices services={services} />);
    expect(screen.getByText('3x')).toBeInTheDocument();
  });

  it('itens com included:false nunca aparecem', () => {
    const services = makeServicesAllIncluded();
    services.phases[0].subcategories[0].items[0].included = false;
    services.phases[0].subcategories[0].items[0].label = 'Item Oculto Teste';
    render(<ProposalServices services={services} />);
    expect(screen.queryByText('Item Oculto Teste')).not.toBeInTheDocument();
  });

  it('isCustom não muda renderização do cliente (sem badge)', () => {
    const services = makeServicesAllIncluded();
    services.phases[0].subcategories[0].items[0].isCustom = true;
    services.phases[0].subcategories[0].items[0].label = 'Item Custom';
    render(<ProposalServices services={services} />);
    expect(screen.getByText('Item Custom')).toBeInTheDocument();
    expect(screen.queryByText(/custom/i)).not.toBeInTheDocument();
  });

  it('retorna null quando nenhuma fase é visível', () => {
    const services = createDefaultServices();
    const { container } = render(<ProposalServices services={services} />);
    expect(container.firstChild).toBeNull();
  });
});
