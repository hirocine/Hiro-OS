import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Plus, Pencil } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

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
  const { isAdmin, roleLoading } = useAuthContext();
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

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ResponsiveContainer maxWidth="7xl">
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
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhuma empresa encontrada
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
