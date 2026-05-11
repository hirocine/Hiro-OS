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
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { StarRating } from '@/features/suppliers/components/StarRating';
import type { Company } from '../types';

const companySchema = z.object({
  company_name: z.string().min(1, 'Nome da empresa é obrigatório'),
  area: z.string().min(1, 'Área é obrigatória'),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  portfolio_url: z.string().url('URL inválida').optional().or(z.literal('')),
  rating: z.number().min(1).max(5).optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company;
  onSave: (data: CompanyFormData) => Promise<void>;
}

export function CompanyDialog({
  open,
  onOpenChange,
  company,
  onSave,
}: CompanyDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_name: '',
      area: '',
      whatsapp: '',
      instagram: '',
      portfolio_url: '',
      rating: undefined,
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        company_name: company.company_name,
        area: company.area,
        whatsapp: company.whatsapp || '',
        instagram: company.instagram || '',
        portfolio_url: company.portfolio_url || '',
        rating: company.rating,
      });
    } else {
      form.reset({
        company_name: '',
        area: '',
        whatsapp: '',
        instagram: '',
        portfolio_url: '',
        rating: undefined,
      });
    }
  }, [company, form]);

  const handleSubmit = async (data: CompanyFormData) => {
    try {
      setSubmitting(true);
      await onSave(data);
      toast.success(company ? 'Empresa atualizada' : 'Empresa criada');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar empresa');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {company ? 'Editar Empresa' : 'Nova Empresa'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome da empresa" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área de Atuação</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Locação de Equipamentos, Pós-Produção" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <Input {...field} placeholder="@empresa" />
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
                  <FormLabel>Website / Portfolio (Opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
