import { InstallPrompt } from './InstallPrompt';
import { UpdateNotification } from './UpdateNotification';
import { OfflineIndicator } from './OfflineIndicator';
import { PushNotifications } from './PushNotifications';

export function PWAEnhancer() {
  return (
    <>
      <InstallPrompt />
      <UpdateNotification />
      <OfflineIndicator />
    </>
  );
}

export { PushNotifications };