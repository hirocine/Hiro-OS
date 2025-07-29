import { Bell, Clock, AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProjects } from '@/hooks/useProjects';
import { useEquipment } from '@/hooks/useEquipment';
import { useState } from 'react';

export function NotificationPanel() {
  const { projects } = useProjects();
  const { equipment } = useEquipment();
  const [isOpen, setIsOpen] = useState(false);

  // Calculate notifications
  const today = new Date().toISOString().split('T')[0];
  
  const overdueProjects = projects.filter(
    project => 
      project.status === 'active' && 
      project.expectedEndDate < today &&
      project.step !== 'verified'
  );

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const equipmentNeedingMaintenance = equipment.filter(eq => {
    if (!eq.lastMaintenance) return false;
    const lastMaintenance = new Date(eq.lastMaintenance);
    return lastMaintenance < sixMonthsAgo && eq.status === 'available';
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const equipmentInUseTooLong = equipment.filter(eq => {
    if (!eq.lastLoanDate || !eq.currentLoanId) return false;
    const lastLoanDate = new Date(eq.lastLoanDate);
    return lastLoanDate < thirtyDaysAgo;
  });

  const notifications = [
    ...(overdueProjects.length > 0 ? [{
      id: 'overdue-projects',
      type: 'warning' as const,
      icon: AlertTriangle,
      title: `${overdueProjects.length} projeto(s) em atraso`,
      description: 'Projetos que passaram da data esperada de entrega',
      time: 'Agora'
    }] : []),
    ...(equipmentNeedingMaintenance.length > 0 ? [{
      id: 'maintenance-needed',
      type: 'info' as const,
      icon: Info,
      title: `${equipmentNeedingMaintenance.length} equipamento(s) precisam de manutenção`,
      description: 'Não recebem manutenção há mais de 6 meses',
      time: 'Agora'
    }] : []),
    ...(equipmentInUseTooLong.length > 0 ? [{
      id: 'long-loans',
      type: 'warning' as const,
      icon: Clock,
      title: `${equipmentInUseTooLong.length} equipamento(s) em uso há muito tempo`,
      description: 'Em uso há mais de 30 dias',
      time: 'Agora'
    }] : [])
  ];

  const totalNotifications = notifications.length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {totalNotifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {totalNotifications}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Notificações</CardTitle>
            {totalNotifications > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalNotifications}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Nenhuma notificação
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div
                      key={notification.id}
                      className="flex items-start gap-3 p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <div className={`p-1 rounded-full ${
                        notification.type === 'warning' 
                          ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' 
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}