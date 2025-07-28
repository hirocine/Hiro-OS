import { toast } from 'sonner';
import { CheckCircle, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';

export interface ToastProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export const enhancedToast = {
  success: ({ title, description, action, duration = 4000 }: ToastProps) => {
    toast.success(title, {
      description,
      icon: <CheckCircle className="h-4 w-4" />,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
      className: 'border-green-200 bg-green-50',
    });
  },

  error: ({ title, description, action, duration = 6000 }: ToastProps) => {
    toast.error(title, {
      description,
      icon: <AlertCircle className="h-4 w-4" />,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
      className: 'border-red-200 bg-red-50',
    });
  },

  warning: ({ title, description, action, duration = 5000 }: ToastProps) => {
    toast.warning(title, {
      description,
      icon: <AlertTriangle className="h-4 w-4" />,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
      className: 'border-orange-200 bg-orange-50',
    });
  },

  info: ({ title, description, action, duration = 4000 }: ToastProps) => {
    toast.info(title, {
      description,
      icon: <Info className="h-4 w-4" />,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
      className: 'border-blue-200 bg-blue-50',
    });
  },

  loading: ({ title, description }: Pick<ToastProps, 'title' | 'description'>) => {
    return toast.loading(title, {
      description,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: (data: T) => string;
      error: (error: Error) => string;
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  },
};