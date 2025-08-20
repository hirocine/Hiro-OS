import { toast } from 'sonner';

// Hook simples apenas para helpers de toast (as notificações do sistema agora são gerenciadas pelo useNotificationsSystem)
export function useNotifications() {
  return {
    // Notification helpers
    notifySuccess: (message: string, description?: string) => {
      toast.success(message, { description });
    },
    notifyError: (message: string, description?: string) => {
      toast.error(message, { description });
    },
    notifyWarning: (message: string, description?: string) => {
      toast.warning(message, { description });
    },
    notifyInfo: (message: string, description?: string) => {
      toast.info(message, { description });
    },
  };
}