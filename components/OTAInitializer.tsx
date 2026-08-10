import { useEffect } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

export const OTAInitializer = () => {
  useEffect(() => {
    const initOTA = async () => {
      try {
        // Notify Capgo that the current web bundle loaded successfully
        await CapacitorUpdater.notifyAppReady();
      } catch (err) {
        console.log('OTA Native initialization skipped or running on web');
      }
    };

    initOTA();
  }, []);

  return null;
};
