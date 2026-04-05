import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { Loader2, KeyRound } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { AvatarUploadArea } from '@/components/ui/avatar-upload-area';
import { AvatarCropperDialog } from '@/components/ui/avatar-cropper-dialog';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { useGoogleProfile } from '@/hooks/useGoogleProfile';
import { getAvatarData } from '@/lib/avatarUtils';
import { useQueryClient } from '@tanstack/react-query';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  position: string | null;
  department: string | null;
  avatar_url: string | null;
}

const profileSchema = z.object({
  display_name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  position: z.string().max(100, 'Cargo muito longo').optional(),
  department: z.string().max(100, 'Departamento muito longo').optional(),
});

export default function Profile() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    position: '',
    department: ''
  });

  // Avatar cropping state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [loadingPasswordReset, setLoadingPasswordReset] = useState(false);
  const { uploading, validateFile, uploadAvatar, removeAvatar } = useAvatarUpload();
  const { hasGoogleAvatar, isGoogleUser, syncGoogleAvatarToProfile } = useGoogleProfile();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFormData({
          display_name: data.display_name || '',
          position: data.position || '',
          department: data.department || ''
        });
      }
    } catch (error) {
      logger.error('Error fetching profile', { 
        module: 'profile',
        error 
      });
      toast({
        title: "Erro ao carregar perfil",
        description: "Não foi possível carregar as informações do perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validate form data
    try {
      profileSchema.parse(formData);
      setValidationErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: 'Erro de validação',
          description: 'Por favor, corrija os erros no formulário.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setSaving(true);
      logger.debug('Starting profile update', {
        module: 'profile',
        data: { userId: user.id, formData }
      });
      
      const updateData = {
        user_id: user.id,
        display_name: formData.display_name || null,
        position: formData.position || null,
        department: formData.department || null
      };

      logger.debug('Upsert data', { 
        module: 'profile',
        data: updateData 
      });
      
      const { error } = await supabase
        .from('profiles')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (error) {
        logger.error('Upsert error', { 
          module: 'profile',
          error 
        });
        throw error;
      }

      logger.debug('Update successful', { module: 'profile' });

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });

      await fetchProfile();
      // Invalidate sidebar profile cache
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile', user.id] });
    } catch (error: any) {
      logger.error('Error updating profile', { 
        module: 'profile',
        error 
      });
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (file: File) => {
    try {
      validateFile(file);
      const imageUrl = URL.createObjectURL(file);
      setSelectedImageSrc(imageUrl);
      setCropperOpen(true);
    } catch (error: any) {
      toast({
        title: "Arquivo inválido",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCropComplete = async (croppedImageData: { file: Blob; url: string }) => {
    if (!user?.id) return;

    try {
      await uploadAvatar(user.id, croppedImageData, {
        quality: 0.9,
        maxWidth: 512,
        maxHeight: 512
      });
      
      setCropperOpen(false);
      setSelectedImageSrc('');
      await fetchProfile();
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile', user.id] });
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id) return;

    try {
      await removeAvatar(user.id);
      await fetchProfile();
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile', user.id] });
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    
    setLoadingPasswordReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir a senha.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao enviar email',
        description: 'Não foi possível enviar o email de redefinição.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPasswordReset(false);
    }
  };

  const handleUseGoogleAvatar = async () => {
    if (!hasGoogleAvatar) return;

    try {
      setSaving(true);
      const result = await syncGoogleAvatarToProfile();
      
      if (result.success) {
        toast({
          title: "Avatar do Google importado",
          description: "Sua foto do Google foi definida como avatar do perfil.",
        });
        await fetchProfile();
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile', user?.id] });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao importar avatar",
        description: error.message || "Não foi possível importar a foto do Google.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const avatarData = getAvatarData(user, profile?.avatar_url, profile?.display_name);

  if (loading) {
    return (
      <ResponsiveContainer className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="4xl" className="animate-fade-in">
      <PageHeader
        title="Meu Perfil"
        subtitle="Gerencie suas informações e preferências"
        actions={
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Avatar Section */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center space-y-4">
            <AvatarUploadArea
              currentAvatarUrl={avatarData.url}
              userInitials={avatarData.initials}
              onFileSelect={handleFileSelect}
              onRemoveAvatar={profile?.avatar_url ? handleRemoveAvatar : undefined}
              uploading={uploading}
              size="lg"
            />
            
            {isGoogleUser && hasGoogleAvatar && !profile?.avatar_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseGoogleAvatar}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Usar Foto do Google
              </Button>
            )}
            
            <div className="text-center space-y-1">
              <p className="font-medium text-lg">{avatarData.displayName || 'Nome não definido'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {avatarData.isGoogleUser && (
                <p className="text-xs text-muted-foreground">Conta Google</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Personal Info + Password Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Nome Completo</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Seu nome completo"
                  className={validationErrors.display_name ? 'border-destructive' : ''}
                />
                {validationErrors.display_name && (
                  <p className="text-sm text-destructive">{validationErrors.display_name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Ex: Editor, Cinegrafista"
                    className={validationErrors.position ? 'border-destructive' : ''}
                  />
                  {validationErrors.position && (
                    <p className="text-sm text-destructive">{validationErrors.position}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Área</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Ex: Pós-produção, Captação"
                    className={validationErrors.department ? 'border-destructive' : ''}
                  />
                  {validationErrors.department && (
                    <p className="text-sm text-destructive">{validationErrors.department}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Password Section - Simplified */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Senha</p>
                  <p className="text-xs text-muted-foreground">Receba um email para redefinir</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePasswordReset}
                disabled={loadingPasswordReset}
              >
                {loadingPasswordReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Redefinir Senha
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Avatar Cropper Dialog */}
      <AvatarCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={selectedImageSrc}
        onCropComplete={handleCropComplete}
        loading={uploading}
      />
    </ResponsiveContainer>
  );
}