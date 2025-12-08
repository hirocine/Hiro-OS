import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ListTodo, User, Lock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskDialog } from './TaskDialog';

export function QuickActionsCard() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const actions = [
    {
      label: 'Todas as Tarefas',
      icon: ListTodo,
      to: '/tarefas/todas',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Minhas Tarefas',
      icon: User,
      to: '/tarefas/minhas',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Tarefas Privadas',
      icon: Lock,
      to: '/tarefas/privadas',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {actions.map(action => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${action.bg}`}>
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
            
            <Button 
              className="w-full mt-3" 
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Tarefa
            </Button>
          </div>
        </CardContent>
      </Card>

      <TaskDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
