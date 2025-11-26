import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
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

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Fornecedores"
        subtitle="Gerencie sua rede de fornecedores externos"
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Função Primária</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Expertise</TableHead>
              <TableHead>Diária</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
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
                  onClick={() => navigate(`/fornecedores/${supplier.id}`)}
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
                    <div className="flex gap-2">
                      {supplier.whatsapp && (
                        <a
                          href={formatWhatsApp(supplier.whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-green-600 hover:text-green-700 dark:text-green-400"
                        >
                          <MessageSquare className="h-4 w-4" />
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
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ExpertiseBadge expertise={supplier.expertise} />
                  </TableCell>
                  <TableCell>{formatCurrency(supplier.daily_rate)}</TableCell>
                  <TableCell>
                    <StarRating rating={supplier.rating} readonly />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSupplier(supplier);
                        setDialogOpen(true);
                      }}
                    >
                      Editar
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
    </div>
  );
}
