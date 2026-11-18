import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { inputCls } from '../ui/styles.js';

/** Saisie du code PIN ; `onSubmit(pin)` est asynchrone et rejette avec le message du serveur si le code est faux. */
export function PinVerifier({ onSubmit, label }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (value.length !== 4 || busy) return;
    setBusy(true);
    try {
      await onSubmit(value);
    } catch (err) {
      setError(err.message);
      setValue('');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-sm text-slate-600">{label}</p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => { setValue(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
          inputMode="numeric"
          maxLength={4}
          placeholder="• • • •"
          className={`${inputCls(error)} text-center text-xl font-bold tracking-[0.5em]`}
          aria-label="Code PIN"
        />
        <button type="submit" disabled={value.length !== 4 || busy} className="flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-700 px-5 font-bold text-white disabled:opacity-40">
          {busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Valider
        </button>
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </form>
  );
}
