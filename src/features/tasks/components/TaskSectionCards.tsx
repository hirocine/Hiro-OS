import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Lock, LayoutGrid, LucideIcon } from 'lucide-react';

interface TaskSection {
  id: string;
  label: string;
  icon: LucideIcon;
  to: string;
  iconColor: string;
}

const TASK_SECTIONS: TaskSection[] = [
  {
    id: 'team',
    label: 'Tarefas de Time',
    icon: Users,
    to: '/tarefas/todas',
    iconColor: 'text-primary',
  },
  {
    id: 'private',
    label: 'Tarefas Privadas',
    icon: Lock,
    to: '/tarefas/privadas',
    iconColor: 'text-purple-500',
  },
];

export function TaskSectionCards() {
  return (
    <Card>
      <CardHeader className="pb-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 shadow-sm">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Seções</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-4">
          {TASK_SECTIONS.map((section) => (
            <Link key={section.id} to={section.to}>
              <Card className="w-[200px] hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/20">
                <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                  <section.icon 
                    className={`w-8 h-8 ${section.iconColor} mb-3 group-hover:scale-110 transition-transform`} 
                  />
                  <span className="font-medium text-sm">{section.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
