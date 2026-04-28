import { useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, User, UserCircle, MoreVertical, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { type MarketingPersona, useMarketingPersonas } from '@/hooks/useMarketingPersonas';
import { MarketingPersonaDialog } from '@/components/Marketing/MarketingPersonaDialog';
import { MarketingPersonaDetailsDialog } from '@/components/Marketing/MarketingPersonaDetailsDialog';

export function PersonaContent() {
  const { personas, loading, deletePersona } = useMarketingPersonas();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingPersona | null>(null);
  const [viewing, setViewing] = useState<MarketingPersona | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (p: MarketingPersona) => {
    setEditing(p);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <UserCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg">Persona / ICP</CardTitle>
              <CardDescription>Quem é o cliente ideal da Hiro Films</CardDescription>
            </div>
          </div>
          <Button onClick={openNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Persona
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : personas.length === 0 ? (
            <button
              type="button"
              onClick={openNew}
              className="group w-full text-left rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-background transition-all p-6"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">Criar primeira persona</h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Defina o cliente ideal da Hiro Films: segmento, dores, gatilhos e canais.
                  </p>
                </div>
              </div>
            </button>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personas.map((p) => (
                <Card key={p.id} className="group bg-background hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 flex-shrink-0">
                        <AvatarImage src={p.avatar_url || undefined} alt={p.name} />
                        <AvatarFallback>
                          {p.name ? p.name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">{p.name}</h3>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {p.segment && (
                                <Badge variant="outline" className="text-xs">
                                  {p.segment}
                                </Badge>
                              )}
                              {p.company_size && (
                                <Badge variant="outline" className="text-xs">
                                  {p.company_size}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(p)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteId(p.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {p.description && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-3">
                            {p.description}
                          </p>
                        )}

                        <Button
                          variant="link"
                          size="sm"
                          className="px-0 mt-2"
                          onClick={() => setViewing(p)}
                        >
                          Ver detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MarketingPersonaDialog open={dialogOpen} onOpenChange={setDialogOpen} persona={editing} />
      <MarketingPersonaDetailsDialog
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        persona={viewing}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir persona?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteId) await deletePersona(deleteId);
                setDeleteId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
