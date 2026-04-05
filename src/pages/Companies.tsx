import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Plus, Pencil } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { WhatsAppIcon, InstagramIcon } from '@/components/icons/SocialIcons';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanies } from '@/features/supplier-companies/hooks/useCompanies';
import { CompanyDialog } from '@/features/supplier-companies/components/CompanyDialog';
import { CompanyFilters } from '@/features/supplier-companies/components/CompanyFilters';
import { StarRating } from '@/features/suppliers/components/StarRating';
import type { CompanyFilters as Filters, Company } from '@/features/supplier-companies/types';

export default function Companies() {
  const navigate = useNavigate();
  const { canAccessSuppliers, roleLoading } = useAuthContext();
  const {
    companies,
    loading,
    fetchCompanies,
    createCompany,
    updateCompany,
  } = useCompanies();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [filters, setFilters] = useState<Filters>({});

  useEffect(() => {
    fetchCompanies(filters);
  }, [filters]);

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search: search || undefined }));
  };

  const handleRatingChange = (rating: string) => {
    setFilters((prev) => ({
      ...prev,
      minRating: rating === 'all' ? undefined : parseInt(rating),
    }));
  };

  const handleSave = async (data: any) => {
    if (editingCompany) {
      await updateCompany(editingCompany.id, data);
    } else {
      await createCompany(data);
    }
    setEditingCompany(undefined);
  };

  const formatWhatsApp = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    return `https://wa.me/${cleaned}`;
  };

  const formatInstagram = (username: string) => {
    const cleaned = username.replace('@', '');
    return `https://instagram.com/${cleaned}`;
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!canAccessSuppliers) {
    return <Navigate to="/" replace />;
  }

  return (
    <ResponsiveContainer maxWidth="7xl" className="animate-fade-in">
      <PageHeader
        title="Empresas"
        subtitle="Gerencie suas empresas fornecedoras"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Empresa
          </Button>
        }
      />

      <CompanyFilters
        onSearchChange={handleSearchChange}
        onRatingChange={handleRatingChange}
      />

      <div className="rounded-lg border bg-card">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%]">Empresa</TableHead>
              <TableHead className="w-[25%]">Área</TableHead>
              <TableHead className="w-[15%]">Rating</TableHead>
              <TableHead className="w-[15%]">Contatos</TableHead>
              <TableHead className="w-[20%] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => <Skeleton key={s} className="h-4 w-4" />)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <EmptyState icon={Building2} title="Nenhuma empresa encontrada" description="Cadastre empresas fornecedoras" />
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow
                  key={company.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/fornecedores/empresas/${company.id}`)}
                >
                  <TableCell className="font-medium">
                    {company.company_name}
                    {!company.is_active && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Inativa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{company.area}</TableCell>
                  <TableCell>
                    <StarRating rating={company.rating} readonly />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {company.whatsapp && (
                        <a
                          href={formatWhatsApp(company.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-green-600 hover:text-green-700 dark:text-green-400"
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
                          className="text-pink-600 hover:text-pink-700 dark:text-pink-400"
                        >
                          <InstagramIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCompany(company);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
    </ResponsiveContainer>
  );
}
