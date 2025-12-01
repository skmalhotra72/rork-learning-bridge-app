import { useState, useEffect, useCallback, useMemo, useRef, type DependencyList } from 'react';

// Debounce hook for search/input
export const useDebounce = <T,>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for scroll events
export const useThrottle = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 1000
): ((...args: Parameters<T>) => void) => {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  );
};

// Memoize expensive calculations
export const useMemoizedValue = <T,>(
  calculate: () => T,
  dependencies: DependencyList
): T => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => calculate(), dependencies);
};

// Previous value hook
export const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
};

// Stable callback that doesn't change reference
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T
): T => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
};

// Batch state updates
export const useBatchedState = <T,>(
  initialState: T
): [T, (updates: Partial<T>) => void] => {
  const [state, setState] = useState<T>(initialState);
  
  const batchUpdate = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);
  
  return [state, batchUpdate];
};

// Performance measurement
export const measurePerformance = (name: string, fn: () => void): void => {
  const start = Date.now();
  fn();
  const end = Date.now();
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
};

// Async performance measurement
export const measureAsyncPerformance = async (
  name: string,
  fn: () => Promise<void>
): Promise<void> => {
  const start = Date.now();
  await fn();
  const end = Date.now();
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
};
