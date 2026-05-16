import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { logger } from '@/lib/logger';
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

// Schema para criação (senha obrigatória)
const createSchema = z.object({
  platformName: z.string()
    .trim()
    .min(1, 'Nome da plataforma é obrigatório')
    .max(100, 'Nome muito longo'),
  platformIconUrl: z.string().optional(),
  platformUrl: z.string()
    .trim()
    .optional()
    .refine((val) => !val || val === '' || z.string().url().safeParse(val).success, {
      message: 'URL inválida',
    })
    .transform((val) => val || ''),
  username: z.string()
    .trim()
    .max(255, 'Usuário muito longo')
    .optional()
    .or(z.literal('')),
  password: z.string()
    .min(1, 'Senha é obrigatória')
    .max(1000, 'Senha muito longa'),
  notes: z.string()
    .max(1000, 'Notas muito longas')
    .optional(),
  category: z.enum([
    'cloud',
    'ai',
    'references',
    'social_media',
    'site',
    'software',
    'music',
    'stock',
    'other',
  ]),
  isFavorite: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// Schema para edição (senha opcional)
const editSchema = z.object({
  platformName: z.string()
    .trim()
    .min(1, 'Nome da plataforma é obrigatório')
    .max(100, 'Nome muito longo'),
  platformIconUrl: z.string().optional(),
  platformUrl: z.string()
    .trim()
    .optional()
    .refine((val) => !val || val === '' || z.string().url().safeParse(val).success, {
      message: 'URL inválida',
    })
    .transform((val) => val || ''),
  username: z.string()
    .trim()
    .max(255, 'Usuário muito longo')
    .optional()
    .or(z.literal('')),
  password: z.string()
    .max(1000, 'Senha muito longa')
    .optional(),
  notes: z.string()
    .max(1000, 'Notas muito longas')
    .optional(),
  category: z.enum([
    'cloud',
    'ai',
    'references',
    'social_media',
    'site',
    'software',
    'music',
    'stock',
    'other',
  ]),
  isFavorite: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

interface PlatformAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PlatformAccessForm) => Promise<void>;
  editingAccess?: PlatformAccess | null;
  getPassword?: (id: string) => Promise<string>;
}

export function PlatformAccessDialog({
  open,
  onOpenChange,
  onSubmit,
  editingAccess,
  getPassword,
}: PlatformAccessDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<PlatformCategory>(
    editingAccess?.category || 'other'
  );
  const [decryptedPassword, setDecryptedPassword] = useState<string>('');

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(editingAccess ? editSchema : createSchema),
    defaultValues: {
      platformName: '',
      platformIconUrl: '',
      platformUrl: '',
      username: '',
      password: '',
      notes: '',
      category: 'other',
      isFavorite: false,
      isActive: true,
    },
  });

  // Populate form when editing
  useEffect(() => {
    const loadPassword = async () => {
      if (editingAccess && getPassword) {
        try {
          const password = await getPassword(editingAccess.id);
          setDecryptedPassword(password);
          setSelectedCategory(editingAccess.category);
          form.reset({
            platformName: editingAccess.platform_name,
            platformIconUrl: editingAccess.platform_icon_url || '',
            platformUrl: editingAccess.platform_url || '',
            username: editingAccess.username,
            password: password,
            notes: editingAccess.notes || '',
            category: editingAccess.category,
            isFavorite: editingAccess.is_favorite,
            isActive: editingAccess.is_active,
          });
        } catch (error) {
          logger.error('Error loading password', {
            module: 'platform-accesses',
            action: 'load_password',
            error
          });
        }
      } else if (editingAccess) {
        setSelectedCategory(editingAccess.category);
        form.reset({
          platformName: editingAccess.platform_name,
          platformIconUrl: editingAccess.platform_icon_url || '',
          platformUrl: editingAccess.platform_url || '',
          username: editingAccess.username,
          password: '',
          notes: editingAccess.notes || '',
          category: editingAccess.category,
          isFavorite: editingAccess.is_favorite,
          isActive: editingAccess.is_active,
        });
      } else {
        setSelectedCategory('other');
        setDecryptedPassword('');
        form.reset({
          platformName: '',
          platformIconUrl: '',
          platformUrl: '',
          username: '',
          password: '',
          notes: '',
          category: 'other',
          isFavorite: false,
          isActive: true,
        });
      }
    };

    loadPassword();
  }, [editingAccess, form, open, getPassword]);

  const handleSubmit = async (values: z.infer<typeof createSchema>) => {
    try {
      const submitData = { ...values };
      
      // Se estiver editando e a senha estiver vazia, não enviar o campo
      if (editingAccess && !submitData.password) {
        delete submitData.password;
      }
      
      await onSubmit(submitData as PlatformAccessForm);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      logger.error('Error submitting platform access form', {
        module: 'platform-accesses',
        action: 'submit_form',
        error
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto ds-shell">
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
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCategory(value as PlatformCategory);
                      }} 
                      value={field.value}
                    >
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
                  <FormLabel>URL da Plataforma</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://github.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Link direto para acessar a plataforma (opcional)
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
                    <FormLabel>
                      Usuário/Email {selectedCategory !== 'software' && '*'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={
                          selectedCategory === 'software' 
                            ? 'Opcional para software' 
                            : 'usuario@exemplo.com'
                        } 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {selectedCategory === 'software' 
                        ? 'Deixe em branco se o software só usa chave de licença'
                        : 'Email ou nome de usuário para login'
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password / License Key */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {selectedCategory === 'software' ? 'License Key' : 'Senha'} 
                      {!editingAccess && ' *'} 
                      {editingAccess && ' (deixe em branco para manter)'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={
                          selectedCategory === 'software'
                            ? editingAccess ? 'Digite para alterar a chave...' : 'XXXX-XXXX-XXXX-XXXX'
                            : editingAccess ? 'Digite para alterar...' : 'Digite a senha'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {selectedCategory === 'software' 
                        ? 'Chave de licença ou ativação do software'
                        : 'Senha de acesso à plataforma'
                      }
                    </FormDescription>
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
                <FormItem className="flex items-center justify-between border border-[hsl(var(--ds-line-1))] p-4">
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

            {/* Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between border border-[hsl(var(--ds-line-1))] p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Status</FormLabel>
                    <FormDescription>
                      {field.value ? 'Acesso está ativo' : 'Acesso está inativo'}
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
              <button
                type="button"
                className="btn"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="btn primary">
                {editingAccess ? 'Salvar Alterações' : 'Adicionar Acesso'}
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
