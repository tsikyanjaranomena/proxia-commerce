import { useEffect, useState } from 'react';
import { storage } from '../utils/storage.js';

export function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => storage.get(key, initial));
  useEffect(() => storage.set(key, value), [key, value]);
  return [value, setValue];
}
