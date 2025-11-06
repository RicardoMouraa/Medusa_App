import { useCallback } from 'react';
import Toast from 'react-native-toast-message';

type ToastOptions = {
  type?: 'success' | 'error' | 'info';
  text1: string;
  text2?: string;
};

export const useToast = () => {
  const showToast = useCallback((options: ToastOptions) => {
    Toast.show({
      type: options.type ?? 'info',
      text1: options.text1,
      text2: options.text2,
      position: 'top',
      topOffset: 60,
      visibilityTime: 3500
    });
  }, []);

  return {
    showToast
  };
};
