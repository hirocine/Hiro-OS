import { useMemo } from 'react';
import { Task } from '../types';

interface FilteredStats {
  active: number;
  overdue: number;
  urgent: number;
}

export function useFilteredTaskStats(tasks: Task[]): FilteredStats {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseLocalDate = (dateStr: string): Date => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const activeTasks = tasks.filter(
      t => t.status !== 'concluida' && t.status !== 'arquivada'
    );

    const active = activeTasks.length;

    const overdue = activeTasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = parseLocalDate(t.due_date);
      return dueDate < today;
    }).length;

    const urgent = activeTasks.filter(t => t.priority === 'urgente').length;

    return { active, overdue, urgent };
  }, [tasks]);
}
