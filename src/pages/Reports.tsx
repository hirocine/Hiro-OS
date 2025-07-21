import { BarChart3, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Reports() {
  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Análises e insights sobre o inventário de equipamentos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Utilização por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Câmeras</span>
                <span className="text-sm text-muted-foreground">75%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Equipamentos de Áudio</span>
                <span className="text-sm text-muted-foreground">60%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Iluminação</span>
                <span className="text-sm text-muted-foreground">45%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendências do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-card rounded-lg">
                <div>
                  <p className="font-medium">Novos Equipamentos</p>
                  <p className="text-sm text-muted-foreground">Adicionados este mês</p>
                </div>
                <span className="text-2xl font-bold text-primary">+12</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gradient-card rounded-lg">
                <div>
                  <p className="font-medium">Taxa de Utilização</p>
                  <p className="text-sm text-muted-foreground">Média mensal</p>
                </div>
                <span className="text-2xl font-bold text-success">68%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas e Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-warning bg-warning/10 p-4 rounded-r-lg">
              <h4 className="font-medium">Manutenção Preventiva</h4>
              <p className="text-sm text-muted-foreground mt-1">
                3 equipamentos precisam de manutenção preventiva nos próximos 30 dias
              </p>
            </div>
            
            <div className="border-l-4 border-destructive bg-destructive/10 p-4 rounded-r-lg">
              <h4 className="font-medium">Equipamentos em Reparo</h4>
              <p className="text-sm text-muted-foreground mt-1">
                1 equipamento está há mais de 15 dias em manutenção
              </p>
            </div>
            
            <div className="border-l-4 border-success bg-success/10 p-4 rounded-r-lg">
              <h4 className="font-medium">Equipamentos Disponíveis</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Todos os equipamentos críticos estão disponíveis para uso
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}