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
  );
}
