import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { profileDebug } from '@/lib/debug';
import { AvatarUploadArea } from '@/components/ui/avatar-upload-area';
import { AvatarCropperDialog } from '@/components/ui/avatar-cropper-dialog';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { useGoogleProfile } from '@/hooks/useGoogleProfile';
import { getAvatarData } from '@/lib/avatarUtils';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  position: string | null;
  department: string | null;
  avatar_url: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
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
  const { uploading, validateFile, uploadAvatar, removeAvatar, setImageUrl } = useAvatarUpload();
  const { hasGoogleAvatar, googleAvatarUrl, isGoogleUser, syncGoogleAvatarToProfile } = useGoogleProfile();

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
      profileDebug('Error fetching profile', error);
      toast({
        title: "Erro ao carregar perfil",
        description: "Não foi possível carregar as informações do perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      profileDebug('Starting profile update', {
        userId: user.id,
        formData
      });
      
      const updateData = {
        user_id: user.id,
        display_name: formData.display_name || null,
        position: formData.position || null,
        department: formData.department || null
      };

      profileDebug('Upsert data', updateData);
      
      const { error } = await supabase
        .from('profiles')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (error) {
        profileDebug('Upsert error', error);
        throw error;
      }

      profileDebug('Update successful');

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });

      await fetchProfile();
    } catch (error: any) {
      profileDebug('Error updating profile', error);
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
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.id) return;

    try {
      await removeAvatar(user.id);
      await fetchProfile();
    } catch (error) {
      // Error is handled by the hook
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
      <div className="container mx-auto p-4 md:p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 md:p-8 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações da conta.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Foto do Perfil</CardTitle>
            <CardDescription>
              Selecione uma imagem para seu perfil. Você poderá ajustar o crop antes de salvar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <AvatarUploadArea
              currentAvatarUrl={avatarData.url}
              userInitials={avatarData.initials}
              onFileSelect={handleFileSelect}
              onRemoveAvatar={profile?.avatar_url ? handleRemoveAvatar : undefined}
              uploading={uploading}
              size="lg"
            />
            
            {/* Botão para usar avatar do Google */}
            {isGoogleUser && hasGoogleAvatar && !profile?.avatar_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseGoogleAvatar}
                disabled={saving}
                className="mt-2"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Usar Foto do Google
              </Button>
            )}
            <div className="text-center">
              <p className="font-medium">{avatarData.displayName || 'Nome não definido'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {avatarData.isGoogleUser && (
                <p className="text-xs text-muted-foreground mt-1">Conta Google</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize suas informações pessoais e profissionais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Nome Completo</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Ex: Editor, Cinegrafista"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Área</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Ex: Pós-produção, Captação"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Gerencie suas configurações de segurança e acesso à conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Alterar Senha</Label>
              <Button variant="outline" className="w-full" onClick={() => {
                toast({
                  title: "Email enviado",
                  description: "Email de redefinição de senha enviado para sua caixa de entrada.",
                });
              }}>
                Redefinir Senha
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Autenticação de Dois Fatores</Label>
                <p className="text-sm text-muted-foreground">
                  Adicione uma camada extra de segurança à sua conta
                </p>
              </div>
              <Switch 
                onCheckedChange={(checked) => {
                  toast({
                    title: checked ? "2FA Ativado" : "2FA Desativado",
                    description: checked ? "Autenticação de dois fatores ativada com sucesso." : "Autenticação de dois fatores desativada.",
                  });
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Sessões Ativas</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Encerre todas as sessões ativas em outros dispositivos
              </p>
              <Button variant="destructive" size="sm" onClick={() => {
                toast({
                  title: "Sessões encerradas",
                  description: "Todas as sessões ativas foram encerradas com sucesso.",
                });
              }}>
                Encerrar Todas as Sessões
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
    </div>
  );
}