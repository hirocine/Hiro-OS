import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Edit, Trash2, Plus, ExternalLink } from 'lucide-react';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { useAuthContext } from '@/contexts/AuthContext';
import { WhatsAppIcon, InstagramIcon } from '@/components/icons/SocialIcons';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompanies } from '@/features/supplier-companies/hooks/useCompanies';
import { useCompanyNotes } from '@/features/supplier-companies/hooks/useCompanyNotes';
import { CompanyDialog } from '@/features/supplier-companies/components/CompanyDialog';
import { StarRating } from '@/features/suppliers/components/StarRating';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Company } from '@/features/supplier-companies/types';

export default function CompanyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canAccessSuppliers, roleLoading } = useAuthContext();
  const { companies, loading, updateCompany, deleteCompany } = useCompanies();
  const { notes, loading: notesLoading, createNote, deleteNote } = useCompanyNotes(id);

  const [company, setCompany] = useState<Company | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    const found = companies.find((c) => c.id === id);
    if (found) setCompany(found);
  }, [companies, id]);

  const handleSave = async (data: any) => {
    if (!company) return;
    await updateCompany(company.id, data);
    setCompany({ ...company, ...data });
  };

  const handleDelete = async () => {
    if (!company) return;
    await deleteCompany(company.id);
    toast.success('Empresa excluída com sucesso');
    navigate('/fornecedores/empresas');
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;

    setAddingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user?.id)
        .single();

      await createNote(id, newNote.trim(), profile?.display_name || user?.email);
      setNewNote('');
      toast.success('Nota adicionada com sucesso');
    } catch (error) {
      toast.error('Erro ao adicionar nota');
    } finally {
      setAddingNote(false);
    }
  };

  const formatWhatsApp = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    return `https://wa.me/${cleaned}`;
  };

  const formatInstagram = (username: string) => {
    const cleaned = username.replace('@', '');
    return `https://instagram.com/${cleaned}`;
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!canAccessSuppliers) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </ResponsiveContainer>
    );
  }

  if (!company) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Empresa não encontrada</p>
          <Button onClick={() => navigate('/fornecedores/empresas')} className="mt-4">
            Voltar para Empresas
          </Button>
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="7xl">
      <BreadcrumbNav
        items={[
          { label: 'Fornecedores', href: '/fornecedores/empresas' },
          { label: 'Empresas', href: '/fornecedores/empresas' },
          { label: company.company_name }
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{company.company_name}</h1>
          {!company.is_active && (
            <Badge variant="outline" className="mt-2">
              Inativa
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Área de Atuação</p>
              <p className="font-medium">{company.area}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rating</p>
              <StarRating rating={company.rating} readonly />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato e Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {company.whatsapp && (
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <a
                  href={formatWhatsApp(company.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 dark:text-green-400 font-medium"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {company.whatsapp}
                </a>
              </div>
            )}
            {company.instagram && (
              <div>
                <p className="text-sm text-muted-foreground">Instagram</p>
                <a
                  href={formatInstagram(company.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 font-medium"
                >
                  <InstagramIcon className="h-4 w-4" />
                  {company.instagram}
                </a>
              </div>
            )}
            {company.portfolio_url && (
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <a
                  href={company.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver Website
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notas Internas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Adicionar nova nota sobre a empresa..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || addingNote}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Nota
            </Button>
          </div>

          <Separator />

          {notesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma nota registrada
            </p>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {note.created_by_name || 'Usuário'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        deleteNote(note.id);
                        toast.success('Nota excluída');
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CompanyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={company}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa {company.company_name}? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ResponsiveContainer>
  );
}
