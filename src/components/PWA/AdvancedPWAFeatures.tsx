import { useEffect } from 'react';
import { WebShare } from './WebShareAPI';
import { BackgroundSync } from './BackgroundSync';
import { PushNotifications } from './PushNotifications';

export function AdvancedPWAFeatures() {
  useEffect(() => {
    // Configurar badge API se disponível
    if ('setAppBadge' in navigator) {
      // Exemplo: definir badge quando há notificações não lidas
      const updateBadge = (count: number) => {
        if (count > 0) {
          (navigator as any).setAppBadge(count);
        } else {
          (navigator as any).clearAppBadge();
        }
      };

      // Expor função globalmente
      (window as any).updateAppBadge = updateBadge;
    }

    // Configurar vibração para feedback tátil
    if ('vibrate' in navigator) {
      const vibrate = (pattern: number | number[]) => {
        navigator.vibrate(pattern);
      };

      (window as any).vibrate = vibrate;
    }

    // Configurar API de informações de rede
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const handleConnectionChange = () => {
        console.log('Connection changed:', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          saveData: connection.saveData,
        });

        // Ajustar qualidade de imagens baseado na conexão
        const isSlowConnection = connection.effectiveType === 'slow-2g' || 
                                connection.effectiveType === '2g' || 
                                connection.saveData;
        
        document.documentElement.setAttribute('data-connection', 
          isSlowConnection ? 'slow' : 'fast'
        );
      };

      connection.addEventListener('change', handleConnectionChange);
      handleConnectionChange(); // Executar uma vez no início
    }

    // Configurar API de bateria para otimizações
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const handleBatteryChange = () => {
          const isLowBattery = battery.level < 0.2 && !battery.charging;
          document.documentElement.setAttribute('data-battery', 
            isLowBattery ? 'low' : 'normal'
          );
        };

        battery.addEventListener('chargingchange', handleBatteryChange);
        battery.addEventListener('levelchange', handleBatteryChange);
        handleBatteryChange();
      });
    }

    // Configurar wake lock para evitar que a tela apague durante operações importantes
    if ('wakeLock' in navigator) {
      const requestWakeLock = async () => {
        try {
          const wakeLock = await (navigator as any).wakeLock.request('screen');
          return wakeLock;
        } catch (error) {
          console.error('Wake lock failed:', error);
        }
      };

      (window as any).requestWakeLock = requestWakeLock;
    }
  }, []);

  return (
    <>
      <BackgroundSync />
    </>
  );
}

export { WebShare, PushNotifications };