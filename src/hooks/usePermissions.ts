import { useState, useCallback } from 'react';
import { PermissionStatus } from '../types';
import { requestAllPermissions, requestCameraPermission, requestLocationPermission, requestNotificationPermission } from '../utils';

interface UsePermissionsReturn {
  permissions: PermissionStatus;
  isRequesting: boolean;
  requestAll: () => Promise<PermissionStatus>;
  requestCamera: () => Promise<boolean>;
  requestLocation: () => Promise<boolean>;
  requestNotifications: () => Promise<boolean>;
}

export const usePermissions = (): UsePermissionsReturn => {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: false,
    location: false,
    notifications: false,
  });
  const [isRequesting, setIsRequesting] = useState(false);

  const requestAll = useCallback(async (): Promise<PermissionStatus> => {
    setIsRequesting(true);
    try {
      const result = await requestAllPermissions();
      setPermissions(result);
      return result;
    } finally {
      setIsRequesting(false);
    }
  }, []);

  const requestCamera = useCallback(async (): Promise<boolean> => {
    const granted = await requestCameraPermission();
    setPermissions(prev => ({ ...prev, camera: granted }));
    return granted;
  }, []);

  const requestLocation = useCallback(async (): Promise<boolean> => {
    const granted = await requestLocationPermission();
    setPermissions(prev => ({ ...prev, location: granted }));
    return granted;
  }, []);

  const requestNotifications = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermission();
    setPermissions(prev => ({ ...prev, notifications: granted }));
    return granted;
  }, []);

  return {
    permissions,
    isRequesting,
    requestAll,
    requestCamera,
    requestLocation,
    requestNotifications,
  };
};
