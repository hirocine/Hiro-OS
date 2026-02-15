import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Plus, Pencil } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { WhatsAppIcon, InstagramIcon } from '@/components/icons/SocialIcons';
import { formatCurrency } from '@/lib/utils';
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
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers';
import { SupplierDialog } from '@/features/suppliers/components/SupplierDialog';
import { SupplierFilters } from '@/features/suppliers/components/SupplierFilters';
import { ExpertiseBadge } from '@/features/suppliers/components/ExpertiseBadge';
import { StarRating } from '@/features/suppliers/components/StarRating';
import { Skeleton } from '@/components/ui/skeleton';
import type { SupplierFilters as Filters, Supplier } from '@/features/suppliers/types';

export default function Suppliers() {
  const navigate = useNavigate();
  const { isAdmin, roleLoading } = useAuthContext();
  const {
    suppliers,
    loading,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
  } = useSuppliers();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>();
  const [filters, setFilters] = useState<Filters>({});

  useEffect(() => {
    fetchSuppliers(filters);
  }, [filters]);

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search: search || undefined }));
  };

  const handleRoleChange = (role: string) => {
    setFilters((prev) => ({ ...prev, role: role === 'all' ? undefined : role }));
  };

  const handleExpertiseChange = (expertise: string) => {
    setFilters((prev) => ({
      ...prev,
      expertise: expertise === 'all' ? undefined : (expertise as any),
    }));
  };

  const handleRatingChange = (rating: string) => {
    setFilters((prev) => ({
      ...prev,
      minRating: rating === 'all' ? undefined : parseInt(rating),
    }));
  };

  const handleSave = async (data: any) => {
    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, data);
    } else {
      await createSupplier(data);
    }
    setEditingSupplier(undefined);
  };

  const formatWhatsApp = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    return `https://wa.me/${cleaned}`;
  };

  const formatInstagram = (username: string) => {
    const cleaned = username.replace('@', '');
    return `https://instagram.com/${cleaned}`;
  };

  const formatCurrencyValue = (value?: number) => {
    if (!value) return '-';
    return formatCurrency(value);
  };

  // Proteção de rota: apenas admins podem acessar
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
    <ResponsiveContainer maxWidth="7xl" className="animate-fade-in">
      <PageHeader
        title="Freelancers"
        subtitle="Gerencie sua rede de freelancers"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        }
      />

      <SupplierFilters
        onSearchChange={handleSearchChange}
        onRoleChange={handleRoleChange}
        onExpertiseChange={handleExpertiseChange}
        onRatingChange={handleRatingChange}
      />

      <div className="rounded-lg border bg-card">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">Nome</TableHead>
              <TableHead className="w-[18%]">Função</TableHead>
              <TableHead className="w-[12%]">Expertise</TableHead>
              <TableHead className="w-[12%]">Rating</TableHead>
              <TableHead className="w-[14%]">Diária Média</TableHead>
              <TableHead className="w-[12%]">Contatos</TableHead>
              <TableHead className="w-[12%] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => <Skeleton key={s} className="h-4 w-4" />)}
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum fornecedor encontrado
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/fornecedores/freelancers/${supplier.id}`)}
                >
                  <TableCell className="font-medium">
                    {supplier.full_name}
                    {!supplier.is_active && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>{supplier.primary_role}</span>
                      {supplier.secondary_role && (
                        <span className="text-xs text-muted-foreground">
                          {supplier.secondary_role}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ExpertiseBadge expertise={supplier.expertise} />
                  </TableCell>
                  <TableCell>
                    <StarRating rating={supplier.rating} readonly />
                  </TableCell>
                  <TableCell>{formatCurrencyValue(supplier.daily_rate)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {supplier.whatsapp && (
                        <a
                          href={formatWhatsApp(supplier.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-green-600 hover:text-green-700 dark:text-green-400"
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
                        setEditingSupplier(supplier);
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

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingSupplier(undefined);
        }}
        supplier={editingSupplier}
        onSave={handleSave}
      />
    </ResponsiveContainer>
  );
}
