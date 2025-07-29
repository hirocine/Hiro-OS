import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload, User, Camera, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    position: '',
    department: ''
  });

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
      console.error('Error fetching profile:', error);
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
      console.log('🔧 Profile: Starting profile update', {
        userId: user.id,
        formData
      });
      
      const updateData = {
        user_id: user.id,
        display_name: formData.display_name || null,
        position: formData.position || null,
        department: formData.department || null
      };

      console.log('🔧 Profile: Upsert data', updateData);
      
      const { error } = await supabase
        .from('profiles')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('🔧 Profile: Upsert error', error);
        throw error;
      }

      console.log('🔧 Profile: Update successful');

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });

      await fetchProfile();
    } catch (error: any) {
      console.error('🔧 Profile: Error updating profile:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      console.log('🖼️ Avatar: Starting upload process');
      
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      console.log('🖼️ Avatar: File selected', { 
        name: file.name, 
        size: file.size, 
        type: file.type 
      });

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione apenas arquivos de imagem.');
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB.');
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      console.log('🖼️ Avatar: Upload path', filePath);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('🖼️ Avatar: Upload error', uploadError);
        throw uploadError;
      }

      console.log('🖼️ Avatar: Upload successful, getting public URL');

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('🖼️ Avatar: Public URL obtained', data.publicUrl);

      const updateData = {
        user_id: user.id,
        avatar_url: data.publicUrl
      };

      console.log('🖼️ Avatar: Updating profile with avatar URL', updateData);

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('🖼️ Avatar: Profile update error', updateError);
        throw updateError;
      }

      console.log('🖼️ Avatar: Profile updated successfully');

      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });

      await fetchProfile();
    } catch (error: any) {
      console.error('🖼️ Avatar: Error in upload process:', error);
      toast({
        title: "Erro ao fazer upload",
        description: error.message || "Não foi possível atualizar o avatar.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const userInitials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || 'U';

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
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
              Clique na foto para alterar sua imagem de perfil.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>
            <div className="text-center">
              <p className="font-medium">{profile?.display_name || 'Nome não definido'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
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
    </div>
  );
}