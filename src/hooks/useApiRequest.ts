import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { ApiError } from '@/types/api';

type UseApiRequestOptions<T> = {
  immediate?: boolean;
  transform?: (data: T) => T;
  refreshInterval?: number;
};

type ApiRequestResult<T> = {
  data: T | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
};

export const useApiRequest = <T>(
  request: () => Promise<T>,
  dependencies: React.DependencyList = [],
  options?: UseApiRequestOptions<T>
): ApiRequestResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(options?.immediate ?? true));
  const [error, setError] = useState<ApiError | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await request();
      setData(options?.transform ? options.transform(response) : response);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  }, [request, options?.transform]);

  useEffect(() => {
    if (options?.immediate === false) return;
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!options?.refreshInterval) return;
    const interval = setInterval(() => {
      if (appStateRef.current === 'active') {
        void fetchData();
      }
    }, options.refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, options?.refreshInterval]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    setData
  };
};
