import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { authDebug } from '@/lib/debug';
import { validateEmail, sanitizeInput } from '@/lib/security';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    position: '',
    department: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [passwordValid, setPasswordValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);

  const { user, loading: authLoading, signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  authDebug('Auth page current user state', { user: user?.email, authLoading });

  // Redirect if already authenticated (but wait for loading to finish)
  useEffect(() => {
    if (!authLoading && user) {
      authDebug('User authenticated, redirecting to dashboard');
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Don't render auth form if user is authenticated or still loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return null; // Will redirect via useEffect
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Enhanced client-side validation
    if (!validateEmail(formData.email)) {
      setError('Por favor, insira um email válido');
      setLoading(false);
      return;
    }

    if (mode === 'signup' && !passwordValid) {
      setError('Por favor, crie uma senha que atenda aos requisitos de segurança');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        const result = await signIn(formData.email, formData.password);
        if (!result.success) {
          setError(result.error);
        } else {
          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo ao sistema de inventário.",
          });
        }
      } else {
        const { error } = await signUp(formData.email, formData.password, {
          full_name: sanitizeInput(formData.full_name),
          position: sanitizeInput(formData.position),
          department: sanitizeInput(formData.department)
        });
        if (error) {
          setError(error.message);
        } else {
          toast({
            title: "Conta criada com sucesso!",
            description: "Verifique seu email para confirmar a conta.",
          });
          setMode('login');
        }
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    authDebug('Iniciando processo de autenticação Google...');
    setLoading(true);
    setError(null);

      try {
        authDebug('Chamando signInWithGoogle...');
        const result = await signInWithGoogle();
        
        if (!result.success) {
          authDebug('Erro retornado do signInWithGoogle', { 
            message: result.error
          });
          
          // Mensagens de erro mais específicas
          if (result.error.includes('requested path is invalid')) {
            setError('Erro de configuração OAuth. Verifique se as URLs estão corretas no Supabase e Google Cloud.');
          } else if (result.error.includes('unauthorized_client')) {
            setError('Cliente não autorizado. Verifique a configuração no Google Cloud Console.');
          } else {
            setError(`Erro de autenticação: ${result.error}`);
          }
        } else {
          authDebug('signInWithGoogle executado sem erro, aguardando redirecionamento...');
        }
      } catch (err) {
      authDebug('Erro capturado no handleGoogleAuth', err);
      setError('Erro inesperado ao conectar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo e título da empresa */}
        <div className="text-center space-y-4">
          <img 
            src="/lovable-uploads/418c9547-19f7-4c12-8117-10a72835f155.png" 
            alt="Logo da empresa" 
            className="h-16 w-auto mx-auto"
          />
          <h1 className="text-xl font-semibold text-foreground">
            Sistema de Inventário - Produtora Audiovisual
          </h1>
        </div>

        <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {mode === 'login' ? 'Entrar' : 'Criar Conta'}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'login' 
              ? 'Acesse o sistema de inventário' 
              : 'Crie sua conta para começar'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                  <div className="space-y-2">
                   <Label htmlFor="full_name">Nome Completo</Label>
                   <Input
                     id="full_name"
                     value={formData.full_name}
                     onChange={(e) => setFormData(prev => ({ ...prev, full_name: sanitizeInput(e.target.value) }))}
                     required
                     maxLength={100}
                   />
                 </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="position">Cargo</Label>
                     <Input
                       id="position"
                       value={formData.position}
                       onChange={(e) => setFormData(prev => ({ ...prev, position: sanitizeInput(e.target.value) }))}
                       placeholder="Ex: Editor"
                       maxLength={50}
                     />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Área</Label>
                     <Input
                       id="department"
                       value={formData.department}
                       onChange={(e) => setFormData(prev => ({ ...prev, department: sanitizeInput(e.target.value) }))}
                       placeholder="Ex: Pós-produção"
                       maxLength={50}
                     />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  const email = sanitizeInput(e.target.value);
                  setFormData(prev => ({ ...prev, email }));
                  setEmailValid(validateEmail(email));
                }}
                required
                maxLength={100}
                className={emailValid || !formData.email ? '' : 'border-destructive focus-visible:ring-destructive'}
              />
              {formData.email && !emailValid && (
                <p className="text-sm text-destructive">Por favor, insira um email válido</p>
              )}
            </div>
            <PasswordInput
              id="password"
              label="Senha"
              showStrength={mode === 'signup'}
              requirements={mode === 'signup' ? {} : { minLength: 1 }} // Relaxed for login
              onChange={(password, isValid) => {
                setFormData(prev => ({ ...prev, password }));
                setPasswordValid(isValid);
              }}
              required
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (mode === 'signup' && (!passwordValid || !emailValid))}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continuar com Google
          </Button>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary underline"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
                setFormData({
                  email: '',
                  password: '',
                  full_name: '',
                  position: '',
                  department: ''
                });
              }}
            >
              {mode === 'login' 
                ? 'Não tem uma conta? Criar conta' 
                : 'Já tem uma conta? Entrar'}
            </button>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}