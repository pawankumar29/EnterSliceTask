import { useCallback, useEffect, useRef, useState } from 'react';

export const useAsync = (loader, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const controllerRef = useRef(null);

  const run = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError('');
    try {
      setData(await loader(controller.signal));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message);
    } finally {
      if (controllerRef.current === controller) {
        setLoading(false);
        controllerRef.current = null;
      }
    }
  }, deps);

  useEffect(() => {
    run();
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [run]);

  return { data, loading, error, refresh: run };
};
