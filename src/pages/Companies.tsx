import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Plus, Pencil, Building2 } from 'lucide-react';
import { EmptyState } from '@/ds/components/EmptyState';
import { useAuthContext } from '@/contexts/AuthContext';
import { WhatsAppIcon, InstagramIcon } from '@/components/icons/SocialIcons';
import { useCompanies } from '@/features/supplier-companies/hooks/useCompanies';
import { CompanyDialog } from '@/features/supplier-companies/components/CompanyDialog';
import { CompanyFilters } from '@/features/supplier-companies/components/CompanyFilters';
import { StarRating } from '@/features/suppliers/components/StarRating';
import type { CompanyFilters as Filters, Company } from '@/features/supplier-companies/types';

const COMP_COLS = '1.5fr 1.2fr 130px 100px 44px';

export default function Companies() {
  const navigate = useNavigate();
  const { canAccessSuppliers, roleLoading } = useAuthContext();
  const { companies, loading, fetchCompanies, createCompany, updateCompany } = useCompanies();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [filters, setFilters] = useState<Filters>({});

  useEffect(() => {
    fetchCompanies(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch helper closes over the listed deps; missing deps are stable refs/setters
  }, [filters]);

  const handleSearchChange = (search: string) =>
    setFilters((prev) => ({ ...prev, search: search || undefined }));
  const handleRatingChange = (rating: string) =>
    setFilters((prev) => ({ ...prev, minRating: rating === 'all' ? undefined : parseInt(rating) }));

  const handleSave = async (data: any) => {
    if (editingCompany) {
      await updateCompany(editingCompany.id, data);
    } else {
      await createCompany(data);
    }
    setEditingCompany(undefined);
  };

  const formatWhatsApp = (number: string) => `https://wa.me/${number.replace(/\D/g, '')}`;
  const formatInstagram = (username: string) => `https://instagram.com/${username.replace('@', '')}`;

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!canAccessSuppliers) return <Navigate to="/" replace />;

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Empresas.</h1>
            <p className="ph-sub">Gerencie suas empresas fornecedoras.</p>
          </div>
          <div className="ph-actions">
            <button className="btn primary" onClick={() => setDialogOpen(true)} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Nova Empresa</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <CompanyFilters onSearchChange={handleSearchChange} onRatingChange={handleRatingChange} />
        </div>

        <div className="tbl" style={{ gridTemplateColumns: COMP_COLS, marginTop: 20, border: '1px solid hsl(var(--ds-line-1))' }}>
          <div className="tbl-head">
            <div>Empresa</div>
            <div>Área</div>
            <div>Rating</div>
            <div>Contatos</div>
            <div></div>
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={`sk-${i}`} className={'tbl-row' + (i === 4 ? ' last' : '')}>
                <div><span className="sk line lg" style={{ width: 160 }} /></div>
                <div><span className="sk line" style={{ width: 100 }} /></div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="sk dot" style={{ width: 10, height: 10 }} />
                  ))}
                </div>
                <div><span className="sk dot" /></div>
                <div></div>
              </div>
            ))
          ) : companies.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <EmptyState
                icon={Building2}
                title="Nenhuma empresa encontrada"
                description="Cadastre empresas fornecedoras para acompanhar a rede."
                variant="bare"
                action={
                  <button className="btn primary" onClick={() => setDialogOpen(true)} type="button">
                    <Plus size={14} strokeWidth={1.5} />
                    <span>Cadastrar primeira</span>
                  </button>
                }
              />
            </div>
          ) : (
            companies.map((company, idx) => {
              const isLast = idx === companies.length - 1;
              return (
                <div
                  key={company.id}
                  className={'tbl-row' + (isLast ? ' last' : '')}
                  onClick={() => navigate(`/fornecedores/empresas/${company.id}`)}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span className="t-title">{company.company_name}</span>
                      {!company.is_active && (
                        <span className="pill muted"><span className="dot" />Inativa</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>{company.area}</div>
                  <div><StarRating rating={company.rating} readonly /></div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {company.whatsapp && (
                      <a
                        href={formatWhatsApp(company.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: 'hsl(var(--ds-accent))', display: 'inline-flex' }}
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </a>
                    )}
                    {company.instagram && (
                      <a
                        href={formatInstagram(company.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: 'hsl(var(--ds-fg-3))', display: 'inline-flex' }}
                      >
                        <InstagramIcon className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <div style={{ justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCompany(company);
                        setDialogOpen(true);
                      }}
                      style={{
                        width: 28, height: 28, display: 'grid', placeItems: 'center',
                        color: 'hsl(var(--ds-fg-3))', cursor: 'pointer',
                      }}
                      aria-label="Editar"
                    >
                      <Pencil size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <CompanyDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingCompany(undefined);
          }}
          company={editingCompany}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
