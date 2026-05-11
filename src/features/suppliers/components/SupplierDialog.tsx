import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useSupplierRoles } from '../hooks/useSupplierRoles';
import { StarRating } from './StarRating';
import { EXPERTISE_LABELS, type Supplier, type ExpertiseLevel } from '../types';

const supplierSchema = z.object({
  full_name: z.string().min(1, 'Nome é obrigatório'),
  primary_role: z.string().min(1, 'Função primária é obrigatória'),
  secondary_role: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  portfolio_url: z.string().url('URL inválida').optional().or(z.literal('')),
  expertise: z.enum(['altissima', 'alta', 'media', 'baixa', 'muito_baixa']),
  daily_rate: z.number().optional(),
  rating: z.number().min(1).max(5).optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier;
  onSave: (data: SupplierFormData) => Promise<void>;
}

export function SupplierDialog({
  open,
  onOpenChange,
  supplier,
  onSave,
}: SupplierDialogProps) {
  const { roles, createRole } = useSupplierRoles();
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      full_name: '',
      primary_role: '',
      secondary_role: '',
      whatsapp: '',
      instagram: '',
      portfolio_url: '',
      expertise: 'media',
      daily_rate: undefined,
      rating: undefined,
    },
  });

  useEffect(() => {
    if (supplier) {
      form.reset({
        full_name: supplier.full_name,
        primary_role: supplier.primary_role,
        secondary_role: supplier.secondary_role || '',
        whatsapp: supplier.whatsapp || '',
        instagram: supplier.instagram || '',
        portfolio_url: supplier.portfolio_url || '',
        expertise: supplier.expertise,
        daily_rate: supplier.daily_rate,
        rating: supplier.rating,
      });
    } else {
      form.reset({
        full_name: '',
        primary_role: '',
        secondary_role: '',
        whatsapp: '',
        instagram: '',
        portfolio_url: '',
        expertise: 'media',
        daily_rate: undefined,
        rating: undefined,
      });
    }
  }, [supplier, form]);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;

    const { error } = await createRole(newRoleName.trim());
    if (error) {
      toast.error('Erro ao criar função');
      return;
    }

    toast.success('Função criada com sucesso');
    setNewRoleName('');
    setIsCreatingRole(false);
  };

  const handleSubmit = async (data: SupplierFormData) => {
    try {
      setSubmitting(true);
      await onSave(data);
      toast.success(supplier ? 'Fornecedor atualizado' : 'Fornecedor criado');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar fornecedor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {supplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome completo do fornecedor" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primary_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função Primária</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                        <button
                          type="button"
                          className="btn"
                          style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
                          onClick={() => setIsCreatingRole(true)}
                        >
                          + Adicionar Nova Função
                        </button>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondary_role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função Secundária (Opcional)</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.name}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isCreatingRole && (
              <div className="flex gap-2">
                <Input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Nome da nova função"
                />
                <button type="button" className="btn primary" onClick={handleCreateRole}>
                  Criar
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setIsCreatingRole(false);
                    setNewRoleName('');
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp (Opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+55 11 99999-9999" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram (Opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="@usuario" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="portfolio_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio URL (Opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expertise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Expertise</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as ExpertiseLevel)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(EXPERTISE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="daily_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Médio de Diária (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        placeholder="R$ 0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <StarRating
                      rating={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="btn primary" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
