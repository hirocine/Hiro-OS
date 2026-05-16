import { useState, useEffect } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';

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

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch helper closes over the listed deps; missing deps are stable refs/setters
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
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <Loader2 className="animate-spin" size={28} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Meu Perfil.</h1>
            <p className="ph-sub">Gerencie suas informações e preferências.</p>
          </div>
          <div className="ph-actions">
            <button className="btn primary" onClick={handleSubmit} disabled={saving} type="button">
              {saving && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />}
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

      <div className="grid gap-6 lg:grid-cols-3" style={{ marginTop: 24 }}>
        {/* Avatar Section */}
        <div
          className="lg:col-span-1"
          style={{
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-surface))',
            padding: '24px 18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <AvatarUploadArea
            currentAvatarUrl={avatarData.url}
            userInitials={avatarData.initials}
            onFileSelect={handleFileSelect}
            onRemoveAvatar={profile?.avatar_url ? handleRemoveAvatar : undefined}
            uploading={uploading}
            size="lg"
          />

          {isGoogleUser && hasGoogleAvatar && !profile?.avatar_url && (
            <button
              type="button"
              className="btn"
              onClick={handleUseGoogleAvatar}
              disabled={saving}
            >
              {saving && <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />}
              <span>Usar Foto do Google</span>
            </button>
          )}

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontWeight: 500, fontSize: 18, color: 'hsl(var(--ds-fg-1))', fontFamily: '"HN Display", sans-serif' }}>
              {avatarData.displayName || 'Nome não definido'}
            </p>
            <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>{user?.email}</p>
            {avatarData.isGoogleUser && (
              <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>Conta Google</p>
            )}
          </div>
        </div>

        {/* Personal Info + Password Section */}
        <div
          className="lg:col-span-2"
          style={{
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-surface))',
          }}
        >
          <div style={{ padding: '14px 18px', borderBottom: '1px solid hsl(var(--ds-line-1))', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>
              Informações Pessoais
            </span>
          </div>
          <div style={{ padding: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="display_name" style={fieldLabel}>Nome Completo</label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Seu nome completo"
                  style={validationErrors.display_name ? { borderColor: 'hsl(var(--ds-danger))' } : undefined}
                />
                {validationErrors.display_name && (
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-danger))', marginTop: 4 }}>{validationErrors.display_name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="position" style={fieldLabel}>Cargo</label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Ex: Editor, Cinegrafista"
                    style={validationErrors.position ? { borderColor: 'hsl(var(--ds-danger))' } : undefined}
                  />
                  {validationErrors.position && (
                    <p style={{ fontSize: 13, color: 'hsl(var(--ds-danger))', marginTop: 4 }}>{validationErrors.position}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="department" style={fieldLabel}>Área</label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Ex: Pós-produção, Captação"
                    style={validationErrors.department ? { borderColor: 'hsl(var(--ds-danger))' } : undefined}
                  />
                  {validationErrors.department && (
                    <p style={{ fontSize: 13, color: 'hsl(var(--ds-danger))', marginTop: 4 }}>{validationErrors.department}</p>
                  )}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'hsl(var(--ds-line-1))', margin: '24px 0' }} />

            {/* Password Section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 8, background: 'hsl(var(--ds-line-2) / 0.3)' }}>
                  <KeyRound size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}>Senha</p>
                  <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>Receba um email para redefinir</p>
                </div>
              </div>
              <button
                type="button"
                className="btn"
                onClick={handlePasswordReset}
                disabled={loadingPasswordReset}
              >
                {loadingPasswordReset && <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />}
                <span>Redefinir Senha</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Cropper Dialog */}
      <AvatarCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={selectedImageSrc}
        onCropComplete={handleCropComplete}
        loading={uploading}
      />
      </div>
    </div>
  );
}
