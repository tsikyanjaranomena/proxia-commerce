import { useCallback, useState } from 'react';

export function useToasts(duration = 3200) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message, type = 'success') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-2), { id, message, type }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss, duration]
  );

  return { toasts, toast, dismiss };
}
