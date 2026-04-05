import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { validateEmail, sanitizeInput } from '@/lib/validation';


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

  const { user, loading: authLoading, signIn, signUp, signInWithGoogle } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  logger.debug('Auth page current user state', {
    module: 'auth',
    data: { user: user?.email, authLoading }
  });

  useEffect(() => {
    if (!authLoading && user) {
      logger.debug('User authenticated, redirecting to dashboard', { module: 'auth' });
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
          toast({ title: 'Login realizado com sucesso!', description: 'Bem-vindo ao Hiro OS®.' });
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
          toast({ title: 'Conta criada com sucesso!', description: 'Aguarde aprovação do administrador para acessar.' });
          setMode('login');
        }
      }
    } catch {
      setError('Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    logger.debug('Iniciando processo de autenticação Google...', { module: 'auth' });
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        if (result.error.includes('requested path is invalid')) {
          setError('Erro de configuração OAuth. Verifique as URLs no Supabase e Google Cloud.');
        } else if (result.error.includes('unauthorized_client')) {
          setError('Cliente não autorizado. Verifique a configuração no Google Cloud Console.');
        } else {
          setError(`Erro de autenticação: ${result.error}`);
        }
      }
    } catch {
      setError('Erro inesperado ao conectar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError(null);
    setFormData({ email: '', password: '', full_name: '', position: '', department: '' });
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a0a' }}>

      {/* ── Painel esquerdo ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[60%] p-12 relative overflow-hidden"
        style={{ borderRight: '1px solid #1a1a1a' }}
      >
        <img
          src="/lovable-uploads/0023_DSC01650-Aprimorado-NR_HIRO_BACKSTAGE_290624.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          aria-hidden="true"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.85) 100%)' }} />
        <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Logo + nome */}
        <div className="flex items-center gap-3">
          <img
            src="/lovable-uploads/418c9547-19f7-4c12-8117-10a72835f155.png"
            alt="Hiro OS"
            className="h-10 w-10 rounded-xl"
          />
          <span className="text-white font-semibold text-lg">Hiro OS®</span>
        </div>


        {/* Rodapé */}
        <p className="text-white/20 text-xs">
          © {new Date().getFullYear()} Hiro Films. Todos os direitos reservados.
        </p>
        </div>
      </div>

      {/* ── Painel direito (formulário) ── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm space-y-8">

          {/* Logo mobile (só aparece em telas pequenas) */}
          <div className="flex items-center gap-3 lg:hidden">
            <img
              src="/lovable-uploads/418c9547-19f7-4c12-8117-10a72835f155.png"
              alt="Hiro OS"
              className="h-9 w-9 rounded-xl"
            />
            <span className="text-white font-semibold">Hiro OS®</span>
          </div>

          {/* Título do form */}
          <div className="space-y-1">
            <h1 className="text-white text-2xl font-bold">
              {mode === 'login' ? 'Bem-vindo' : 'Criar conta'}
            </h1>
            <p className="text-white/40 text-sm">
              {mode === 'login'
                ? 'Entre com suas credenciais para acessar'
                : 'Preencha os dados para criar sua conta'}
            </p>
          </div>

          {/* Alerta de erro */}
          {error && (
            <Alert variant="destructive" className="border-red-900/50 bg-red-950/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Nome Completo</Label>
                  <Input
                    value={formData.full_name}
                    onChange={e => setFormData(p => ({ ...p, full_name: sanitizeInput(e.target.value) }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-white/20"
                    required
                    maxLength={100}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs">Cargo</Label>
                    <Input
                      value={formData.position}
                      onChange={e => setFormData(p => ({ ...p, position: sanitizeInput(e.target.value) }))}
                      placeholder="Ex: Editor"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-white/20"
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs">Área</Label>
                    <Input
                      value={formData.department}
                      onChange={e => setFormData(p => ({ ...p, department: sanitizeInput(e.target.value) }))}
                      placeholder="Ex: Pós-produção"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-white/20"
                      maxLength={50}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => {
                  const email = sanitizeInput(e.target.value);
                  setFormData(p => ({ ...p, email }));
                  setEmailValid(validateEmail(email));
                }}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-white/20"
                required
                maxLength={100}
              />
              {formData.email && !emailValid && (
                <p className="text-xs text-red-400">Email inválido</p>
              )}
            </div>

            <div className="space-y-1.5">
              <PasswordInput
                id="password"
                label="Senha"
                showStrength={mode === 'signup'}
                showValidation={mode === 'signup'}
                requirements={mode === 'signup' ? {} : { minLength: 1 }}
                onChange={(password, isValid) => {
                  setFormData(p => ({ ...p, password }));
                  setPasswordValid(isValid);
                }}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-white/90 font-semibold h-11"
              disabled={loading || (mode === 'signup' && (!passwordValid || !emailValid))}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Criar Conta'}
            </Button>
          </form>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 text-white/30" style={{ background: '#0a0a0a' }}>ou</span>
            </div>
          </div>

          {/* Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 h-11"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            {loading
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            }
            Continuar com Google
          </Button>

          {/* Trocar modo */}
          <p className="text-center text-sm text-white/30">
            {mode === 'login' ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
            <button
              type="button"
              className="text-white/60 hover:text-white underline transition-colors"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); resetForm(); }}
            >
              {mode === 'login' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
