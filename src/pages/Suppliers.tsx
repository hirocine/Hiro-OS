import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Plus, Pencil, UserCheck } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { WhatsAppIcon, InstagramIcon } from '@/components/icons/SocialIcons';
import { formatCurrency } from '@/lib/utils';
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers';
import { SupplierDialog } from '@/features/suppliers/components/SupplierDialog';
import { SupplierFilters } from '@/features/suppliers/components/SupplierFilters';
import { ExpertiseBadge } from '@/features/suppliers/components/ExpertiseBadge';
import { StarRating } from '@/features/suppliers/components/StarRating';
import type { SupplierFilters as Filters, Supplier } from '@/features/suppliers/types';

const FORN_COLS = '1.5fr 1fr 110px 130px 130px 100px 44px';

export default function Suppliers() {
  const navigate = useNavigate();
  const { canAccessSuppliers, roleLoading } = useAuthContext();
  const { suppliers, loading, fetchSuppliers, createSupplier, updateSupplier } = useSuppliers();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>();
  const [filters, setFilters] = useState<Filters>({});

  useEffect(() => {
    fetchSuppliers(filters);
  }, [filters]);

  const handleSearchChange = (search: string) =>
    setFilters((prev) => ({ ...prev, search: search || undefined }));
  const handleRoleChange = (role: string) =>
    setFilters((prev) => ({ ...prev, role: role === 'all' ? undefined : role }));
  const handleExpertiseChange = (expertise: string) =>
    setFilters((prev) => ({ ...prev, expertise: expertise === 'all' ? undefined : (expertise as any) }));
  const handleRatingChange = (rating: string) =>
    setFilters((prev) => ({ ...prev, minRating: rating === 'all' ? undefined : parseInt(rating) }));

  const handleSave = async (data: any) => {
    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, data);
    } else {
      await createSupplier(data);
    }
    setEditingSupplier(undefined);
  };

  const formatWhatsApp = (number: string) => `https://wa.me/${number.replace(/\D/g, '')}`;
  const formatInstagram = (username: string) => `https://instagram.com/${username.replace('@', '')}`;
  const formatCurrencyValue = (value?: number) => (!value ? '—' : formatCurrency(value));

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
            <h1 className="ph-title">Freelancers.</h1>
            <p className="ph-sub">Gerencie sua rede de freelancers.</p>
          </div>
          <div className="ph-actions">
            <button className="btn primary" onClick={() => setDialogOpen(true)} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Novo Fornecedor</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: 28 }}>
          <SupplierFilters
            onSearchChange={handleSearchChange}
            onRoleChange={handleRoleChange}
            onExpertiseChange={handleExpertiseChange}
            onRatingChange={handleRatingChange}
          />
        </div>

        {/* Tabela */}
        <div className="tbl forn" style={{ gridTemplateColumns: FORN_COLS, marginTop: 20, border: '1px solid hsl(var(--ds-line-1))' }}>
          <div className="tbl-head">
            <div>Nome</div>
            <div>Função</div>
            <div>Expertise</div>
            <div>Rating</div>
            <div>Diária Média</div>
            <div>Contatos</div>
            <div></div>
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={`sk-${i}`} className={'tbl-row' + (i === 4 ? ' last' : '')}>
                <div><span className="sk line lg" style={{ width: 160 }} /></div>
                <div><span className="sk line" style={{ width: 100 }} /></div>
                <div><span className="sk line" style={{ width: 70 }} /></div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="sk dot" style={{ width: 10, height: 10 }} />
                  ))}
                </div>
                <div><span className="sk line" style={{ width: 80 }} /></div>
                <div><span className="sk dot" /></div>
                <div></div>
              </div>
            ))
          ) : suppliers.length === 0 ? (
            <div style={{ gridColumn: `1 / -1`, padding: 0 }}>
              <div className="empties" style={{ borderTop: 0, borderLeft: 0, borderRight: 0 }}>
                <div className="empty" style={{ borderRight: 0 }}>
                  <div className="glyph">
                    <UserCheck strokeWidth={1.25} />
                  </div>
                  <h5>Nenhum fornecedor encontrado</h5>
                  <p>Cadastre freelancers e prestadores de serviço para acompanhar sua rede.</p>
                  <div className="actions">
                    <button className="btn primary" onClick={() => setDialogOpen(true)} type="button">
                      <Plus size={14} strokeWidth={1.5} />
                      <span>Cadastrar primeiro</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            suppliers.map((supplier, idx) => {
              const isLast = idx === suppliers.length - 1;
              return (
                <div
                  key={supplier.id}
                  className={'tbl-row' + (isLast ? ' last' : '')}
                  onClick={() => navigate(`/fornecedores/freelancers/${supplier.id}`)}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span className="t-title">{supplier.full_name}</span>
                      {!supplier.is_active && (
                        <span className="pill muted"><span className="dot" />Inativo</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>{supplier.primary_role}</span>
                      {supplier.secondary_role && (
                        <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))' }}>{supplier.secondary_role}</span>
                      )}
                    </div>
                  </div>
                  <div><ExpertiseBadge expertise={supplier.expertise} /></div>
                  <div><StarRating rating={supplier.rating} readonly /></div>
                  <div className="t-mono" style={{ color: 'hsl(var(--ds-fg-1))' }}>
                    {formatCurrencyValue(supplier.daily_rate)}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {supplier.whatsapp && (
                      <a
                        href={formatWhatsApp(supplier.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: 'hsl(var(--ds-accent))', display: 'inline-flex' }}
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                      </a>
                    )}
                    {supplier.instagram && (
                      <a
                        href={formatInstagram(supplier.instagram)}
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
                        setEditingSupplier(supplier);
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

        <SupplierDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingSupplier(undefined);
          }}
          supplier={editingSupplier}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
