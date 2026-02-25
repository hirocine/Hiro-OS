import { differenceInDays } from 'date-fns';
import { Clock } from 'lucide-react';

interface Props {
  validityDate: string;
}

export function UrgencyBar({ validityDate }: Props) {
  const daysLeft = differenceInDays(new Date(validityDate), new Date());
  const expired = daysLeft < 0;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 py-2.5 px-4 text-center text-sm font-medium ${expired ? 'bg-red-600/90' : 'bg-amber-500/90'} text-white backdrop-blur-sm`}>
      <div className="flex items-center justify-center gap-2">
        <Clock className="h-4 w-4" />
        {expired
          ? 'Esta proposta expirou.'
          : daysLeft === 0
            ? 'Esta proposta expira hoje!'
            : `Esta proposta expira em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}.`
        }
      </div>
    </div>
  );
}
