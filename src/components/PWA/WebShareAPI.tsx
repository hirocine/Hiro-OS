import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebShareProps {
  title: string;
  text: string;
  url?: string;
  children?: React.ReactNode;
}

export function WebShare({ title, text, url, children }: WebShareProps) {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!navigator.share) {
      // Fallback para navegadores que não suportam Web Share API
      try {
        await navigator.clipboard.writeText(url || window.location.href);
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência.",
        });
      } catch (error) {
        toast({
          title: "Erro ao compartilhar",
          description: "Não foi possível compartilhar o conteúdo.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsSharing(true);
    try {
      await navigator.share({
        title,
        text,
        url: url || window.location.href,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: "Erro ao compartilhar",
          description: "Não foi possível compartilhar o conteúdo.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (children) {
    return (
      <div onClick={handleShare} style={{ cursor: 'pointer' }}>
        {children}
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={isSharing}
    >
      <Share2 className="h-4 w-4 mr-2" />
      Compartilhar
    </Button>
  );
}