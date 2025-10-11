import { useState, useEffect } from 'react';
import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle 
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Package, User, Clock, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { equipmentDebug } from '@/lib/debug';

interface EquipmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string | null;
}

interface EquipmentDetails {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  patrimony_number?: string;
  serial_number?: string;
  description?: string;
  status: string;
  image?: string;
  purchase_date?: string;
  value?: number;
  depreciated_value?: number;
  last_maintenance?: string;
  receive_date?: string;
  store?: string;
  invoice?: string;
  current_borrower?: string;
  item_type: string;
}

interface LoanHistory {
  id: string;
  borrower_name: string;
  loan_date: string;
  expected_return_date: string;
  actual_return_date?: string;
  status: string;
  project?: string;
  department?: string;
  return_condition?: string;
  return_notes?: string;
}

export function EquipmentDetailsDialog({ open, onOpenChange, equipmentId }: EquipmentDetailsDialogProps) {
  const [equipment, setEquipment] = useState<EquipmentDetails | null>(null);
  const [loanHistory, setLoanHistory] = useState<LoanHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && equipmentId) {
      fetchEquipmentDetails();
      fetchLoanHistory();
    }
  }, [open, equipmentId]);

  const fetchEquipmentDetails = async () => {
    if (!equipmentId) return;
    
    setLoading(true);
    try {
      equipmentDebug('Fetching equipment details', { equipmentId });
      
      const { data, error } = await supabase
        .from('equipments')
        .select('*')
        .eq('id', equipmentId)
        .single();

      if (error) throw error;
      
      equipmentDebug('Equipment details fetched successfully', data);
      setEquipment(data);
    } catch (error) {
      equipmentDebug('Error fetching equipment details', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanHistory = async () => {
    if (!equipmentId) return;
    
    try {
      equipmentDebug('Fetching loan history', { equipmentId });
      
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('loan_date', { ascending: false });

      if (error) throw error;
      
      equipmentDebug('Loan history fetched successfully', { count: data?.length });
      setLoanHistory(data || []);
    } catch (error) {
      equipmentDebug('Error fetching loan history', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
    case 'maintenance':
      return <Wrench className="h-4 w-4 text-orange-500" />;
      case 'on_loan':
        return <User className="h-4 w-4 text-primary" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      available: 'Disponível',
      on_loan: 'Emprestado',
      maintenance: 'Manutenção',
      damaged: 'Danificado',
      lost: 'Perdido'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getLoanStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'overdue':
        return 'destructive';
      case 'returned':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!equipment && !loading) {
    return null;
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="w-full max-w-4xl max-h-[90vh]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {equipment?.name || 'Carregando...'}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : equipment ? (
          <ScrollArea className="max-h-[calc(90vh-8rem)]">
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Informações Gerais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {equipment.image && (
                      <div className="flex justify-center">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={equipment.image} alt={equipment.name} />
                          <AvatarFallback>
                            <Package className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      {getStatusIcon(equipment.status)}
                      <Badge variant={equipment.status === 'available' ? 'default' : 'secondary'}>
                        {getStatusLabel(equipment.status)}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Marca:</span> {equipment.brand}
                      </div>
                      <div>
                        <span className="font-medium">Categoria:</span> {equipment.category}
                      </div>
                      {equipment.subcategory && (
                        <div>
                          <span className="font-medium">Subcategoria:</span> {equipment.subcategory}
                        </div>
                      )}
                      {equipment.patrimony_number && (
                        <div>
                          <span className="font-medium">Patrimônio:</span> #{equipment.patrimony_number}
                        </div>
                      )}
                      {equipment.serial_number && (
                        <div>
                          <span className="font-medium">Série:</span> {equipment.serial_number}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Detalhes Técnicos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {equipment.description && (
                      <div>
                        <span className="font-medium text-sm">Descrição:</span>
                        <p className="text-sm text-muted-foreground mt-1">{equipment.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {equipment.purchase_date && (
                        <div>
                          <span className="font-medium">Data de Compra:</span>
                          <p className="text-muted-foreground">
                            {new Date(equipment.purchase_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}

                      {equipment.receive_date && (
                        <div>
                          <span className="font-medium">Data de Recebimento:</span>
                          <p className="text-muted-foreground">
                            {new Date(equipment.receive_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}

                      {equipment.value && (
                        <div>
                          <span className="font-medium">Valor de Compra:</span>
                          <p className="text-muted-foreground">{formatCurrency(equipment.value)}</p>
                        </div>
                      )}

                      {equipment.depreciated_value && (
                        <div>
                          <span className="font-medium">Valor Depreciado:</span>
                          <p className="text-muted-foreground">{formatCurrency(equipment.depreciated_value)}</p>
                        </div>
                      )}

                      {equipment.store && (
                        <div>
                          <span className="font-medium">Loja:</span>
                          <p className="text-muted-foreground">{equipment.store}</p>
                        </div>
                      )}

                      {equipment.invoice && (
                        <div>
                          <span className="font-medium">Nota Fiscal:</span>
                          <p className="text-muted-foreground">{equipment.invoice}</p>
                        </div>
                      )}

                      {equipment.last_maintenance && (
                        <div>
                          <span className="font-medium">Última Manutenção:</span>
                          <p className="text-muted-foreground">
                            {new Date(equipment.last_maintenance).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Histórico de Empréstimos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Histórico de Empréstimos
                  </CardTitle>
                  <CardDescription>
                    {loanHistory.length === 0 
                      ? 'Nenhum empréstimo registrado para este equipamento'
                      : `${loanHistory.length} empréstimo(s) registrado(s)`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loanHistory.length > 0 ? (
                    <div className="space-y-4">
                      {loanHistory.map((loan) => (
                        <div key={loan.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{loan.borrower_name}</span>
                              <Badge variant={getLoanStatusVariant(loan.status)}>
                                {loan.status === 'active' && 'Ativo'}
                                {loan.status === 'overdue' && 'Atrasado'}
                                {loan.status === 'returned' && 'Devolvido'}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(loan.loan_date), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="font-medium">Data Empréstimo:</span>
                              <p className="text-muted-foreground">
                                {new Date(loan.loan_date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium">Previsão Retorno:</span>
                              <p className="text-muted-foreground">
                                {new Date(loan.expected_return_date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            {loan.actual_return_date && (
                              <div>
                                <span className="font-medium">Data Retorno:</span>
                                <p className="text-muted-foreground">
                                  {new Date(loan.actual_return_date).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            )}
                            {loan.project && (
                              <div>
                                <span className="font-medium">Projeto:</span>
                                <p className="text-muted-foreground">{loan.project}</p>
                              </div>
                            )}
                          </div>

                          {loan.return_condition && (
                            <div className="text-sm">
                              <span className="font-medium">Condição de Retorno:</span>
                              <Badge variant="outline" className="ml-2">
                                {loan.return_condition}
                              </Badge>
                            </div>
                          )}

                          {loan.return_notes && (
                            <div className="text-sm">
                              <span className="font-medium">Observações:</span>
                              <p className="text-muted-foreground mt-1">{loan.return_notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Este equipamento ainda não foi emprestado</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>Equipamento não encontrado</p>
          </div>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}