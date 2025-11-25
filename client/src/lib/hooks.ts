import { useRef, useEffect, useCallback } from "react";

/**
 * usePreviousDifferent hook for React
 * It returns the past value which was different from the current one.
 *
 * @param currentValue The value whose previously different value is to be tracked
 * @returns The previous value
 * @see https://rooks.vercel.app/docs/hooks/usePreviousDifferent
 */
function usePreviousDifferent<T>(currentValue: T): T | null {
  const previousRef = useRef<T | null>(null);
  const previousRef2 = useRef<T | null>(null);

  useEffect(() => {
    previousRef2.current = previousRef.current;
    previousRef.current = currentValue;
  }, [currentValue]);

  return currentValue === previousRef.current ? previousRef2.current : previousRef.current;
}

/**
 * useDebounce hook for React
 * Returns a memoized debounced callback that won't cause infinite loops in useEffect
 * This replicates the behavior of rooks' useDebounce hook
 *
 * @param callback The callback function to debounce
 * @param delay The debounce delay in milliseconds
 * @returns A memoized debounced version of the callback
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  ) as T;
}

export { usePreviousDifferent, useDebounce };
