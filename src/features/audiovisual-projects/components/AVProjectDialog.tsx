import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { AVProject } from '../types';
import { useCreateAVProject, useUpdateAVProject } from '../hooks/useAVProjects';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  company: z.string().optional(),
  description: z.string().optional(),
  deadline: z.date().optional(),
  responsible_user_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AVProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: AVProject | null;
}

export function AVProjectDialog({ open, onOpenChange, project }: AVProjectDialogProps) {
  const { user } = useAuthContext();
  const { users } = useUsers();
  const createProject = useCreateAVProject();
  const updateProject = useUpdateAVProject();
  
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const deadline = watch('deadline');
  const responsibleUserId = watch('responsible_user_id');

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        company: project.company || '',
        description: project.description || '',
        deadline: project.deadline ? new Date(project.deadline) : undefined,
        responsible_user_id: project.responsible_user_id || undefined,
      });
      setLogoUrl(project.logo_url);
    } else {
      reset({
        name: '',
        company: '',
        description: '',
        deadline: undefined,
        responsible_user_id: undefined,
      });
      setLogoUrl(null);
    }
  }, [project, reset, open]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `av-project-logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    const responsibleUser = users?.find((u) => u.id === data.responsible_user_id);

    const payload = {
      name: data.name,
      company: data.company || null,
      description: data.description || null,
      deadline: data.deadline ? format(data.deadline, 'yyyy-MM-dd') : null,
      logo_url: logoUrl,
      responsible_user_id: data.responsible_user_id || null,
      responsible_user_name: responsibleUser?.display_name || null,
    };

    if (project) {
      await updateProject.mutateAsync({ id: project.id, ...payload });
    } else {
      await createProject.mutateAsync({
        ...payload,
        created_by: user?.id,
        created_by_name: user?.user_metadata?.full_name || user?.email,
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Logo Upload */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-none">
              {logoUrl ? (
                <AvatarImage src={logoUrl} className="object-cover" />
              ) : null}
              <AvatarFallback className="rounded-none bg-[hsl(var(--ds-line-2)/0.4)] text-[hsl(var(--ds-fg-3))]">
                <Upload className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="logo" className="text-sm font-medium">Logo do Projeto</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isUploading}
                className="mt-1 text-xs"
              />
            </div>
            {logoUrl && (
              <button
                type="button"
                className="btn"
                onClick={() => setLogoUrl(null)}
                style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
                aria-label="Remover logo"
              >
                <X size={13} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input id="name" {...register('name')} placeholder="Ex: Vídeo Institucional" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" {...register('company')} placeholder="Nome da empresa cliente" />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Breve descrição do projeto"
              rows={2}
            />
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label>Prazo de Entrega</Label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="btn"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <CalendarIcon size={13} strokeWidth={1.5} />
                  <span style={{ fontVariantNumeric: 'tabular-nums', color: !deadline ? 'hsl(var(--ds-fg-3))' : undefined }}>
                    {deadline ? format(deadline, 'dd/MM/yyyy') : 'Selecionar data'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={(date) => setValue('deadline', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Responsible */}
          <div className="space-y-1.5">
            <Label>Responsável</Label>
            <Select
              value={responsibleUserId || ''}
              onValueChange={(value) => setValue('responsible_user_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar responsável" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.display_name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn" onClick={() => onOpenChange(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={createProject.isPending || updateProject.isPending}>
              {project ? 'Salvar' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
