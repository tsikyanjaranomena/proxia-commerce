import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CircleCheck, LoaderCircle, Smartphone, Timer, TriangleAlert } from 'lucide-react';
import { BRAND } from '../data/config.js';
import { formatAr } from '../utils/formatCurrency.js';
import { formatPhone } from '../utils/phone.js';
import { OperatorLogo } from './ui/OperatorLogo.jsx';
import { Sheet } from './ui/Sheet.jsx';

const VALIDATION_DELAY_S = 120;
const POLL_MS = 3000;

/**
 * Paiement Mobile Money piloté par le serveur.
 *
 *   initiate()                    → crée la demande de paiement, retourne { id, mode, … }
 *   check(paymentId)              → état courant du paiement
 *   simulate(paymentId, scenario) → mode simulateur uniquement
 *
 * mode « live » : le client valide sur son téléphone, on attend la confirmation de l'opérateur.
 * mode « simulator » : la notification push et l'écran USSD sont rejoués à l'écran.
 */
export function MobileMoneyPayment({ operator, phone, amount, initiate, check, simulate, onSuccess, onCancel }) {
  const [stage, setStage] = useState('sending'); // sending → push → ussd | waiting → processing → success | error
  const [attempt, setAttempt] = useState(1);
  const [payment, setPayment] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(VALIDATION_DELAY_S);

  const handlers = useRef({ initiate, check, onSuccess });
  useEffect(() => {
    handlers.current = { initiate, check, onSuccess };
  });

  const fail = useCallback((message) => {
    setError(message);
    setStage('error');
  }, []);

  // Envoi de la demande de paiement : une seule fois par tentative (y compris en StrictMode).
  const started = useRef(0);
  useEffect(() => {
    if (stage !== 'sending' || started.current === attempt) return;
    started.current = attempt;
    handlers.current
      .initiate()
      .then((p) => {
        setPayment(p);
        setCountdown(VALIDATION_DELAY_S);
        setStage(p.mode === 'simulator' ? 'push' : 'waiting');
      })
      .catch((err) => fail(err.message));
  }, [stage, attempt, fail]);

  // Mode réel : interroge le serveur jusqu'à la confirmation de l'opérateur.
  useEffect(() => {
    if (stage !== 'waiting' || !payment) return undefined;
    const timer = setInterval(async () => {
      try {
        const p = await handlers.current.check(payment.id);
        if (p.status === 'paid') {
          setPayment(p);
          setStage('success');
        } else if (p.status !== 'pending') {
          fail(p.failureReason || 'Le paiement a été refusé ou annulé.');
        }
      } catch {
        /* coupure réseau passagère : nouvel essai au prochain tour */
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [stage, payment, fail]);

  const awaitingUser = stage === 'push' || stage === 'ussd' || stage === 'waiting';
  useEffect(() => {
    if (!awaitingUser) return undefined;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [awaitingUser]);

  useEffect(() => {
    if (countdown > 0 || !awaitingUser) return;
    fail(
      stage === 'waiting'
        ? 'Délai dépassé. Si vous avez validé sur votre téléphone, la commande apparaîtra dans « Suivi » dès confirmation.'
        : 'Délai de validation expiré. Aucun montant n’a été débité.'
    );
  }, [countdown, awaitingUser, stage, fail]);

  useEffect(() => {
    if (stage !== 'success') return undefined;
    const timer = setTimeout(() => handlers.current.onSuccess(payment), 1600);
    return () => clearTimeout(timer);
  }, [stage, payment]);

  const submitUssd = async (e) => {
    e.preventDefault();
    if (pin.length !== 4 || !payment) return;
    setStage('processing');
    try {
      // Le code saisi ne quitte pas le navigateur : seul le scénario de test est transmis.
      const p = await simulate(payment.id, pin === '0000' ? 'insufficient_funds' : 'success');
      if (p.status === 'paid') {
        setPayment(p);
        setStage('success');
      } else {
        fail(p.failureReason || 'Le paiement a échoué.');
      }
    } catch (err) {
      fail(err.message);
    }
  };

  const retry = () => {
    setPin('');
    setError('');
    setAttempt((a) => a + 1);
    setStage('sending');
  };

  const left = Math.max(0, countdown);
  const mmss = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  const locked = stage === 'sending' || stage === 'processing' || stage === 'success';

  return (
    <>
      {/* Notification push simulée */}
      {stage === 'push' && (
        <button
          onClick={() => setStage('ussd')}
          className="animate-push fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[1400] mx-auto flex max-w-sm items-start gap-3 ink-card rounded-3xl bg-white p-3.5 text-left"
        >
          <OperatorLogo op={operator} className="h-10 w-10 text-[11px]" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase">{operator.name}</span> maintenant
            </span>
            <span className="block text-sm font-bold">Demande de paiement</span>
            <span className="block text-sm text-slate-700">
              {BRAND} demande {formatAr(amount)}. Touchez pour valider avec votre code secret.
            </span>
          </span>
        </button>
      )}

      <Sheet open title={`Paiement ${operator.name}`} onClose={locked ? undefined : onCancel}>
        <div className="space-y-4 p-5 pt-1">
          <div className={`flex items-center gap-3 rounded-2xl p-3 ${operator.soft}`}>
            <OperatorLogo op={operator} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{formatPhone(phone)}</p>
              <p className="text-xs text-slate-600">{operator.company} · USSD {operator.ussd}</p>
            </div>
            <p className="text-right font-extrabold">{formatAr(amount)}</p>
          </div>

          {stage === 'sending' && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <LoaderCircle className="h-10 w-10 animate-spin text-emerald-700" />
              <p className="font-semibold">Envoi de la demande de paiement…</p>
            </div>
          )}

          {stage === 'push' && (
            <div className="space-y-4 py-2 text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50">
                <Bell className="h-9 w-9 animate-bounce text-emerald-700" />
              </div>
              <div>
                <p className="text-lg font-bold">Consultez votre téléphone</p>
                <p className="text-sm text-slate-600">Une notification a été envoyée au {formatPhone(phone)}. Validez-la avec votre code secret {operator.name}.</p>
              </div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold tabular-nums">
                <Timer className="h-4 w-4" /> {mmss}
              </p>
              <button onClick={() => setStage('ussd')} className="h-12 w-full rounded-full bg-emerald-700 font-bold text-white">Ouvrir la notification</button>
              <p className="text-xs text-slate-500">
                Pas de notification ? Composez <b className="font-mono">{operator.ussd}</b> puis « Paiements en attente ».
              </p>
            </div>
          )}

          {stage === 'waiting' && (
            <div className="space-y-4 py-2 text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50">
                <Smartphone className="h-9 w-9 animate-pulse text-emerald-700" />
              </div>
              <div>
                <p className="text-lg font-bold">Validez sur votre téléphone</p>
                <p className="text-sm text-slate-600">
                  Une demande de {formatAr(amount)} a été envoyée au {formatPhone(phone)}. Saisissez votre code secret {operator.name} sur votre téléphone pour confirmer.
                </p>
              </div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold tabular-nums">
                <LoaderCircle className="h-4 w-4 animate-spin" /> En attente de confirmation · {mmss}
              </p>
              <p className="text-xs text-slate-500">
                Rien reçu ? Composez <b className="font-mono">{operator.ussd}</b> puis « Paiements en attente ».
              </p>
            </div>
          )}

          {stage === 'ussd' && (
            <form onSubmit={submitUssd} className="space-y-3">
              <div className="rounded-2xl bg-slate-900 p-4 font-mono text-sm leading-relaxed text-slate-100 shadow-inner">
                <p className="text-emerald-400">{operator.name.toUpperCase()} · {operator.ussd}</p>
                <p>Paiement marchand</p>
                <p>Marchand : {BRAND}</p>
                <p>Montant : {formatAr(amount)}</p>
                <p>Frais : 0 Ar</p>
                <p className="mt-2">Entrez votre code secret :</p>
                <input
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-center text-2xl tracking-[0.6em] text-white outline-none focus:border-emerald-400"
                  aria-label="Code secret Mobile Money"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={onCancel} className="h-12 rounded-full bg-slate-100 font-bold text-slate-700">Annuler</button>
                <button type="submit" disabled={pin.length !== 4} className="h-12 rounded-full bg-emerald-700 font-bold text-white disabled:opacity-40">Envoyer</button>
              </div>
              <p className="text-center text-xs text-slate-500">
                Paiement simulé, aucun argent n’est débité : n’importe quel code à 4 chiffres valide, <b>0000</b> simule un solde insuffisant. Expire dans {mmss}.
              </p>
            </form>
          )}

          {stage === 'processing' && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <LoaderCircle className="h-10 w-10 animate-spin text-emerald-700" />
              <p className="font-semibold">Validation de la transaction…</p>
              <p className="text-sm text-slate-500">Ne fermez pas l’application.</p>
            </div>
          )}

          {stage === 'success' && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-100">
                <CircleCheck className="h-11 w-11 text-emerald-700" />
              </div>
              <p className="text-lg font-bold">Paiement réussi</p>
              <p className="text-sm text-slate-600">{formatAr(amount)} réglés via {operator.name}.</p>
              {payment?.txRef && <p className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs">Réf. {payment.txRef}</p>}
            </div>
          )}

          {stage === 'error' && (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-red-100">
                <TriangleAlert className="h-10 w-10 text-red-600" />
              </div>
              <div>
                <p className="text-lg font-bold">Paiement non abouti</p>
                <p className="text-sm text-slate-600">{error}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={onCancel} className="h-12 rounded-full bg-slate-100 font-bold text-slate-700">Fermer</button>
                <button onClick={retry} className="h-12 rounded-full bg-emerald-700 font-bold text-white">Réessayer</button>
              </div>
            </div>
          )}
        </div>
      </Sheet>
    </>
  );
}
