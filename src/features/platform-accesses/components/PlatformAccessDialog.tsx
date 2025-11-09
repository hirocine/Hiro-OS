import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PlatformIconPicker } from './PlatformIconPicker';
import type { PlatformAccess, PlatformAccessForm, PlatformCategory } from '../types';
import { CATEGORY_LABELS } from '../types';

const formSchema = z.object({
  platformName: z.string()
    .trim()
    .min(1, 'Nome da plataforma é obrigatório')
    .max(100, 'Nome muito longo'),
  platformIconUrl: z.string().optional(),
  platformUrl: z.string()
    .trim()
    .url('URL inválida')
    .max(500, 'URL muito longa'),
  username: z.string()
    .trim()
    .min(1, 'Usuário/email é obrigatório')
    .max(255, 'Usuário muito longo'),
  password: z.string()
    .min(1, 'Senha é obrigatória')
    .max(1000, 'Senha muito longa'),
  notes: z.string()
    .max(1000, 'Notas muito longas')
    .optional(),
  category: z.enum([
    'development',
    'infrastructure',
    'design',
    'communication',
    'analytics',
    'storage',
    'other',
  ]),
  isFavorite: z.boolean().optional(),
});

interface PlatformAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PlatformAccessForm) => Promise<void>;
  editingAccess?: PlatformAccess | null;
}

export function PlatformAccessDialog({
  open,
  onOpenChange,
  onSubmit,
  editingAccess,
}: PlatformAccessDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platformName: '',
      platformIconUrl: '',
      platformUrl: '',
      username: '',
      password: '',
      notes: '',
      category: 'other',
      isFavorite: false,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingAccess) {
      form.reset({
        platformName: editingAccess.platform_name,
        platformIconUrl: editingAccess.platform_icon_url || '',
        platformUrl: editingAccess.platform_url,
        username: editingAccess.username,
        password: '', // Don't populate password for security
        notes: editingAccess.notes || '',
        category: editingAccess.category,
        isFavorite: editingAccess.is_favorite,
      });
    } else {
      form.reset({
        platformName: '',
        platformIconUrl: '',
        platformUrl: '',
        username: '',
        password: '',
        notes: '',
        category: 'other',
        isFavorite: false,
      });
    }
  }, [editingAccess, form, open]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onSubmit(values as PlatformAccessForm);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAccess ? 'Editar Acesso' : 'Novo Acesso'}
          </DialogTitle>
          <DialogDescription>
            {editingAccess
              ? 'Atualize as informações do acesso à plataforma'
              : 'Adicione um novo acesso de plataforma ao sistema'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Platform Icon */}
            <FormField
              control={form.control}
              name="platformIconUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ícone da Plataforma</FormLabel>
                  <FormControl>
                    <PlatformIconPicker
                      selectedIconUrl={field.value}
                      onSelectIcon={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Platform Name */}
              <FormField
                control={form.control}
                name="platformName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Plataforma *</FormLabel>
                    <FormControl>
                      <Input placeholder="GitHub, AWS, Figma..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Platform URL */}
            <FormField
              control={form.control}
              name="platformUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Plataforma *</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://github.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Link direto para acessar a plataforma
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário/Email *</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Senha * {editingAccess && '(deixe em branco para manter)'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={editingAccess ? '••••••••' : 'Senha'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre este acesso..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Favorite */}
            <FormField
              control={form.control}
              name="isFavorite"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Marcar como Favorito</FormLabel>
                    <FormDescription>
                      Acessos favoritos aparecem primeiro na lista
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingAccess ? 'Salvar Alterações' : 'Adicionar Acesso'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
