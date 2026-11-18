import { useState } from 'react';
import { LoaderCircle, MessageSquareText, Phone } from 'lucide-react';
import { formatPhone, isValidPhone, normalizePhone } from '../utils/phone.js';
import { Field } from './ui/Field.jsx';
import { Sheet } from './ui/Sheet.jsx';
import { inputCls } from './ui/styles.js';

/** Connexion en deux étapes : numéro de téléphone, puis code reçu par SMS. */
export function AuthSheet({ auth, initialPhone = '', name = '', onClose, onSuccess }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const sendCode = async (e) => {
    e?.preventDefault();
    if (!isValidPhone(phone)) {
      setError('Numéro invalide (ex. 034 12 345 67).');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await auth.requestOtp(phone);
      setDevCode(res.devCode || '');
      setCode('');
      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setBusy(true);
    setError('');
    try {
      const user = await auth.verifyOtp(phone, code, name);
      onSuccess(user);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Sheet open title="Connexion" onClose={onClose}>
      <div className="space-y-4 p-5 pt-1">
        {step === 'phone' ? (
          <form onSubmit={sendCode} className="space-y-4">
            <p className="text-sm text-slate-600">
              Entrez votre numéro : nous vous envoyons un code par SMS pour sécuriser vos commandes et leur suivi.
            </p>
            <Field label="Numéro de téléphone" error={error}>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  className={`${inputCls(error)} pl-11 tracking-wide`}
                  value={formatPhone(phone)}
                  onChange={(e) => { setPhone(normalizePhone(e.target.value)); setError(''); }}
                  placeholder="034 12 345 67"
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
            </Field>
            <button type="submit" disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 font-bold text-white disabled:opacity-60">
              {busy && <LoaderCircle className="h-5 w-5 animate-spin" />} Recevoir le code
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <p className="flex items-start gap-2 text-sm text-slate-600">
              <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              Code à 6 chiffres envoyé au {formatPhone(phone)}. Il est valable 5 minutes.
            </p>
            {devCode && (
              <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
                Mode démo, aucun SMS n’est envoyé. Votre code : <b className="font-mono tracking-widest">{devCode}</b>
              </p>
            )}
            <Field label="Code de vérification" error={error}>
              <input
                autoFocus
                className={`${inputCls(error)} text-center text-2xl font-bold tracking-[0.4em]`}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                placeholder="••••••"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
              />
            </Field>
            <button type="submit" disabled={busy || code.length !== 6} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 font-bold text-white disabled:opacity-40">
              {busy && <LoaderCircle className="h-5 w-5 animate-spin" />} Valider
            </button>
            <div className="flex justify-between text-sm font-semibold text-emerald-700">
              <button type="button" onClick={() => { setStep('phone'); setError(''); }}>Changer de numéro</button>
              <button type="button" onClick={sendCode} disabled={busy}>Renvoyer le code</button>
            </div>
          </form>
        )}
      </div>
    </Sheet>
  );
}
