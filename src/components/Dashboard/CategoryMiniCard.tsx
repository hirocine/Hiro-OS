import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface CategoryMiniCardProps {
  title: string;
  value: number;
  icon?: LucideIcon;
}

export function CategoryMiniCard({ title, value, icon: Icon }: CategoryMiniCardProps) {
  return (
    <Card className="p-3 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground truncate">{title}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </Card>
  );
}
