import { useCallback, useEffect, useRef, useState } from 'react';
import { Banknote, Bike, CircleCheck, LoaderCircle, LocateFixed, LogOut, MapPin, Navigation, Package, Phone } from 'lucide-react';
import { PinVerifier } from '../components/tracking/PinVerifier.jsx';
import { Field } from '../components/ui/Field.jsx';
import { inputCls } from '../components/ui/styles.js';
import { usePersistentState } from '../hooks/usePersistentState.js';
import { api } from '../services/api.js';
import { formatAr } from '../utils/formatCurrency.js';
import { formatPhone, isValidPhone, normalizePhone } from '../utils/phone.js';

const REFRESH_MS = 8000;
const GPS_MIN_INTERVAL_MS = 3000;

const STATUS_LABEL = { preparing: 'À récupérer au siège', enroute: 'En route', arrived: 'Arrivé chez le client' };

function RiderLogin({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!isValidPhone(phone)) return setError('Numéro invalide.');
    setBusy(true);
    setError('');
    try {
      onLogin(await api('/rider/login', { method: 'POST', body: { phone, code } }));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
    return undefined;
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 px-4 py-10">
      <div className="text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-blue-50">
          <Bike className="h-9 w-9 text-blue-700" />
        </div>
        <h1 className="mt-3 text-2xl font-extrabold">Espace livreur</h1>
        <p className="text-sm text-slate-500">Connectez-vous pour voir vos courses.</p>
      </div>
      <Field label="Numéro de téléphone">
        <input className={inputCls()} value={formatPhone(phone)} onChange={(e) => setPhone(normalizePhone(e.target.value))} inputMode="tel" placeholder="034 00 123 45" autoComplete="username" />
      </Field>
      <Field label="Code d’accès" error={error}>
        <input className={inputCls(error)} type="password" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="current-password" />
      </Field>
      <button type="submit" disabled={busy || !code} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-700 font-bold text-white disabled:opacity-50">
        {busy && <LoaderCircle className="h-5 w-5 animate-spin" />} Se connecter
      </button>
    </form>
  );
}

function RiderOrderCard({ order, sharing, onToggleGps, onArrived, onDeliver }) {
  return (
    <article className="space-y-3 rounded-3xl bg-white p-4 ink-card-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-extrabold">{order.id}</p>
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">{STATUS_LABEL[order.status] || order.status}</span>
      </div>

      <div className="space-y-1.5 text-sm">
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <span><b>{order.quartier}</b> — {order.address}</span>
        </p>
        <p className="flex items-center gap-2">
          <Package className="h-4 w-4 shrink-0 text-slate-500" /> {order.itemCount} article(s) · {order.customer.name}
        </p>
        <p className={`flex items-center gap-2 font-semibold ${order.cashToCollect ? 'text-amber-700' : 'text-emerald-700'}`}>
          <Banknote className="h-4 w-4 shrink-0" />
          {order.cashToCollect ? `À encaisser en espèces : ${formatAr(order.cashToCollect)}` : 'Déjà payé (Mobile Money)'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <a href={`tel:${order.customer.phone}`} className="flex h-11 items-center justify-center gap-2 rounded-full bg-slate-100 text-sm font-bold text-slate-800">
          <Phone className="h-4 w-4" /> Appeler
        </a>
        <a
          href={`https://www.openstreetmap.org/directions?to=${order.destination.lat}%2C${order.destination.lng}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-slate-100 text-sm font-bold text-slate-800"
        >
          <Navigation className="h-4 w-4" /> Itinéraire
        </a>
      </div>

      {order.status !== 'arrived' && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onToggleGps}
            className={`flex h-11 items-center justify-center gap-2 rounded-full text-sm font-bold ${sharing ? 'bg-blue-700 text-white' : 'border-2 border-blue-700 text-blue-800'}`}
          >
            <LocateFixed className={`h-4 w-4 ${sharing ? 'animate-pulse' : ''}`} /> {sharing ? 'GPS partagé' : 'Partager mon GPS'}
          </button>
          <button onClick={onArrived} className="flex h-11 items-center justify-center gap-2 rounded-full border-2 border-slate-300 text-sm font-bold text-slate-800">
            <CircleCheck className="h-4 w-4" /> Je suis arrivé
          </button>
        </div>
      )}

      {order.status !== 'preparing' && (
        <div className="rounded-2xl border border-dashed border-violet-300 bg-violet-50 p-3">
          <PinVerifier onSubmit={onDeliver} label="Remise du colis : saisissez le code PIN donné par le client." />
        </div>
      )}
    </article>
  );
}

/** Espace livreur : courses assignées, partage de la position GPS réelle, validation de la remise par PIN. */
export function RiderPage({ toast }) {
  const [session, setSession] = usePersistentState('rider', null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharingId, setSharingId] = useState(null);
  const token = session?.token;

  const call = useCallback((path, body) => api(`/rider${path}`, { method: body ? 'POST' : 'GET', body, token }), [token]);

  const refresh = useCallback(async () => {
    try {
      setOrders((await call('/orders')).orders);
    } catch (err) {
      if (err.status === 401 || err.status === 403) setSession(null);
    } finally {
      setLoading(false);
    }
  }, [call, setSession]);

  useEffect(() => {
    if (!token) return undefined;
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [token, refresh]);

  // Partage de la position réelle : remplace le trajet simulé pour la commande choisie.
  const lastSent = useRef(0);
  useEffect(() => {
    if (!sharingId || !token) return undefined;
    if (!('geolocation' in navigator)) {
      toast('La géolocalisation n’est pas disponible sur cet appareil.', 'error');
      setSharingId(null);
      return undefined;
    }
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSent.current < GPS_MIN_INTERVAL_MS) return;
        lastSent.current = now;
        call(`/orders/${sharingId}/position`, { lat: pos.coords.latitude, lng: pos.coords.longitude })
          .then((res) => {
            if (res.status === 'arrived') {
              setSharingId(null);
              refresh();
            }
          })
          .catch(() => {});
      },
      (err) => {
        toast(err.code === 1 ? 'Autorisez l’accès à la localisation pour partager votre position.' : 'Signal GPS introuvable.', 'error');
        setSharingId(null);
      },
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [sharingId, token, call, refresh, toast]);

  if (!token) return <RiderLogin onLogin={setSession} />;

  const arrived = async (id) => {
    try {
      await call(`/orders/${id}/arrived`, {});
      if (sharingId === id) setSharingId(null);
      await refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const deliver = async (id, pin) => {
    await call(`/orders/${id}/deliver`, { pin });
    toast(`Commande ${id} livrée. Bien joué !`);
    await refresh();
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold">Mes courses</h1>
          <p className="truncate text-sm text-slate-500">{session.rider.name} · {session.rider.plate}</p>
        </div>
        <button onClick={() => { setSharingId(null); setSession(null); }} className="flex h-10 items-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-700">
          <LogOut className="h-4 w-4" /> Quitter
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-blue-700" /></div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Bike className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-semibold">Aucune course en cours</p>
          <p className="text-sm text-slate-500">Les nouvelles commandes apparaissent ici automatiquement.</p>
        </div>
      ) : (
        orders.map((o) => (
          <RiderOrderCard
            key={o.id}
            order={o}
            sharing={sharingId === o.id}
            onToggleGps={() => setSharingId((cur) => (cur === o.id ? null : o.id))}
            onArrived={() => arrived(o.id)}
            onDeliver={(pin) => deliver(o.id, pin)}
          />
        ))
      )}
    </div>
  );
}
