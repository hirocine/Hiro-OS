import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Lock, LucideIcon } from 'lucide-react';

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
    <div className="grid grid-cols-2 gap-4">
      {TASK_SECTIONS.map((section) => (
        <Link key={section.id} to={section.to}>
          <Card className="h-full hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/20">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[140px]">
              <section.icon 
                className={`w-10 h-10 ${section.iconColor} mb-4 group-hover:scale-110 transition-transform`} 
              />
              
              <div className="flex items-center gap-2">
                <section.icon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{section.label}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
