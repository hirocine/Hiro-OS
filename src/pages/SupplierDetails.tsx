import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, ExternalLink, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers';
import { useSupplierNotes } from '@/features/suppliers/hooks/useSupplierNotes';
import { SupplierDialog } from '@/features/suppliers/components/SupplierDialog';
import { ExpertiseBadge } from '@/features/suppliers/components/ExpertiseBadge';
import { StarRating } from '@/features/suppliers/components/StarRating';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Supplier } from '@/features/suppliers/types';

export default function SupplierDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { suppliers, loading, updateSupplier, deleteSupplier } = useSuppliers();
  const { notes, loading: notesLoading, createNote, deleteNote } = useSupplierNotes(id);

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    const found = suppliers.find((s) => s.id === id);
    if (found) setSupplier(found);
  }, [suppliers, id]);

  const handleSave = async (data: any) => {
    if (!supplier) return;
    await updateSupplier(supplier.id, data);
    setSupplier({ ...supplier, ...data });
  };

  const handleDelete = async () => {
    if (!supplier) return;
    await deleteSupplier(supplier.id);
    toast.success('Fornecedor excluído com sucesso');
    navigate('/fornecedores');
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

  const formatCurrency = (value?: number) => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 md:p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Fornecedor não encontrado</p>
          <Button onClick={() => navigate('/fornecedores')} className="mt-4">
            Voltar para Fornecedores
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/fornecedores')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{supplier.full_name}</h1>
            {!supplier.is_active && (
              <Badge variant="outline" className="mt-2">
                Inativo
              </Badge>
            )}
          </div>
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
              <p className="text-sm text-muted-foreground">Função Primária</p>
              <p className="font-medium">{supplier.primary_role}</p>
            </div>
            {supplier.secondary_role && (
              <div>
                <p className="text-sm text-muted-foreground">Função Secundária</p>
                <p className="font-medium">{supplier.secondary_role}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Expertise</p>
              <ExpertiseBadge expertise={supplier.expertise} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rating</p>
              <StarRating rating={supplier.rating} readonly />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Médio de Diária</p>
              <p className="font-medium">{formatCurrency(supplier.daily_rate)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato e Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {supplier.whatsapp && (
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <a
                  href={formatWhatsApp(supplier.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 dark:text-green-400 font-medium"
                >
                  <MessageSquare className="h-4 w-4" />
                  {supplier.whatsapp}
                </a>
              </div>
            )}
            {supplier.instagram && (
              <div>
                <p className="text-sm text-muted-foreground">Instagram</p>
                <a
                  href={formatInstagram(supplier.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  {supplier.instagram}
                </a>
              </div>
            )}
            {supplier.portfolio_url && (
              <div>
                <p className="text-sm text-muted-foreground">Portfolio</p>
                <a
                  href={supplier.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver Portfolio
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
              placeholder="Adicionar nova nota sobre o fornecedor..."
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

      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={supplier}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor {supplier.full_name}? Esta ação não
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
    </div>
  );
}
