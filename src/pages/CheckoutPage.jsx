import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Banknote, Bike, Building2, ChevronDown, CircleCheck, Info, LoaderCircle, LocateFixed, Lock, MapPin, Phone, Route as RouteIcon, Smartphone, Truck, User, Wallet } from 'lucide-react';
import { LocationPicker } from '../components/LocationPicker.jsx';
import { MobileMoneyPayment } from '../components/MobileMoneyPayment.jsx';
import { StaticMap } from '../components/StaticMap.jsx';
import { Field } from '../components/ui/Field.jsx';
import { OperatorLogo } from '../components/ui/OperatorLogo.jsx';
import { SectionCard } from '../components/ui/SectionCard.jsx';
import { inputCls } from '../components/ui/styles.js';
import { HQ, FREE_DELIVERY_THRESHOLD, MAX_DELIVERY_KM, OUT_OF_ZONE_MESSAGE, SERVICE_CITY } from '../data/config.js';
import { OPERATORS } from '../data/operators.js';
import { QUARTIERS } from '../data/quartiers.js';
import { formatAr } from '../utils/formatCurrency.js';
import { distanceFromHQ, deliveryFeeFor, zoneFor, nearestQuartier } from '../utils/geo.js';
import { normalizePhone, formatPhone, isValidPhone, detectOperator } from '../utils/phone.js';

/**
 * Le montant affiché ici est une estimation : le serveur recalcule prix et frais
 * à la création de la commande, avec les mêmes règles (dossier shared/).
 */
export function CheckoutPage({ cartLines, subtotal, profile, setProfile, requireAuth, orders, onOrderPlaced, navigate, toast }) {
  const [reception, setReception] = useState('delivery');
  const [quartierName, setQuartierName] = useState(profile.quartier || 'Analakely');
  const [destination, setDestination] = useState(() => {
    const q = QUARTIERS.find((x) => x.name === (profile.quartier || 'Analakely')) || QUARTIERS[0];
    return profile.destination || { lat: q.lat, lng: q.lng };
  });
  const [address, setAddress] = useState(profile.address || '');
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [method, setMethod] = useState('mobile');
  const [operatorId, setOperatorId] = useState('mvola');
  const [mmPhone, setMmPhone] = useState(profile.mmPhone || profile.phone || '');
  const [errors, setErrors] = useState({});
  const [locating, setLocating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Commande créée côté serveur et en attente de paiement Mobile Money.
  const pendingOrder = useRef(null);

  const operator = OPERATORS[operatorId];
  const detected = detectOperator(mmPhone);
  const km = distanceFromHQ(destination) / 1000;
  const outOfZone = reception === 'delivery' && km > MAX_DELIVERY_KM;
  const baseFee = reception === 'pickup' ? 0 : deliveryFeeFor(destination);
  const fee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : baseFee;
  const total = subtotal + fee;

  // Le numéro saisi détermine automatiquement l'opérateur
  useEffect(() => {
    if (detected && detected.id !== operatorId) setOperatorId(detected.id);
  }, [detected, operatorId]);

  if (cartLines.length === 0 && !paying) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-semibold">Votre panier est vide.</p>
        <button onClick={() => navigate('shop')} className="mt-4 rounded-full bg-emerald-700 px-6 py-3 font-bold text-white">Retour à la boutique</button>
      </div>
    );
  }

  const selectQuartier = (qName) => {
    const q = QUARTIERS.find((x) => x.name === qName);
    if (!q) return;
    setQuartierName(q.name);
    setDestination({ lat: q.lat, lng: q.lng });
  };

  const onPickPoint = (pt) => {
    setDestination(pt);
    setQuartierName(nearestQuartier(pt).name);
  };

  const locateMe = () => {
    if (!('geolocation' in navigator)) {
      toast('La géolocalisation n’est pas disponible sur cet appareil.', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (distanceFromHQ(pt) / 1000 > MAX_DELIVERY_KM) {
          toast(`Vous êtes hors d’${SERVICE_CITY} : nous ne livrons que dans cette ville. Placez le point de livraison sur la carte.`, 'error');
          return;
        }
        onPickPoint(pt);
        toast(`Position détectée : ${nearestQuartier(pt).name}`);
      },
      (err) => {
        setLocating(false);
        toast(err.code === 1 ? 'Autorisez l’accès à la localisation pour utiliser cette option.' : 'Position introuvable, réessayez.', 'error');
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 }
    );
  };

  const validate = () => {
    const e = {};
    if (name.trim().length < 2) e.name = 'Indiquez votre nom.';
    if (!isValidPhone(phone)) e.phone = 'Numéro invalide (ex. 034 12 345 67).';
    if (reception === 'delivery') {
      if (address.trim().length < 5) e.address = 'Précisez l’adresse ou un repère (lot, portail, couleur…).';
      if (outOfZone) e.zone = OUT_OF_ZONE_MESSAGE;
    }
    if (method === 'mobile') {
      if (!isValidPhone(mmPhone)) e.mmPhone = 'Numéro Mobile Money invalide.';
      else if (!operator.prefixes.includes(mmPhone.slice(0, 3))) e.mmPhone = `Ce numéro n’est pas un numéro ${operator.name} (${operator.prefixes.join(' / ')}).`;
    }
    setErrors(e);
    return e;
  };

  // Seuls les identifiants et quantités sont envoyés : les prix viennent de la base du serveur.
  const buildOrderPayload = () => ({
    items: cartLines.map(({ product, qty }) => ({ id: product.id, qty })),
    reception,
    ...(reception === 'delivery' && { destination, address: address.trim() }),
    customer: { name: name.trim(), phone },
    payment: method === 'mobile' ? { method: 'mobile', operator: operator.id, phone: mmPhone } : { method: 'cod' },
  });

  const placeOrder = async () => {
    if (method === 'mobile') {
      setPaying(true);
      return;
    }
    setSubmitting(true);
    try {
      const { order } = await orders.createOrder(buildOrderPayload());
      onOrderPlaced(order);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const submit = () => {
    const e = validate();
    const first = Object.values(e)[0];
    if (first) {
      toast(first, 'error');
      return;
    }
    setProfile({ ...profile, name: name.trim(), phone, address: address.trim(), quartier: quartierName, destination, mmPhone });
    requireAuth(placeOrder, { phone, name: name.trim() });
  };

  // Première tentative : crée la commande. Tentatives suivantes : relance le paiement sur la même commande.
  const initiatePayment = async () => {
    if (pendingOrder.current) {
      return orders.retryPayment(pendingOrder.current.id, { operator: operator.id, phone: mmPhone });
    }
    const { order, payment } = await orders.createOrder(buildOrderPayload());
    pendingOrder.current = order;
    return payment;
  };

  const cancelPayment = () => {
    const order = pendingOrder.current;
    pendingOrder.current = null;
    setPaying(false);
    // Abandon : la commande non payée est annulée et son stock libéré.
    if (order) orders.cancelOrder(order.id).catch(() => {});
  };

  const paymentSucceeded = (payment) => {
    const order = pendingOrder.current;
    pendingOrder.current = null;
    setPaying(false);
    onOrderPlaced({ ...order, payment });
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 py-4 pb-40 md:pb-8 lg:grid lg:grid-cols-[1fr_380px] lg:gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('cart')} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-slate-200" aria-label="Retour au panier">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-extrabold">Finaliser la commande</h1>
        </div>

        {/* 1. Coordonnées */}
        <SectionCard title="Vos coordonnées" icon={User}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom complet" error={errors.name}>
              <input className={inputCls(errors.name)} value={name} onChange={(e) => setName(e.target.value)} placeholder="Rasoa Andrianina" autoComplete="name" />
            </Field>
            <Field label="Téléphone de contact" error={errors.phone}>
              <input className={inputCls(errors.phone)} value={formatPhone(phone)} onChange={(e) => setPhone(normalizePhone(e.target.value))} placeholder="034 12 345 67" inputMode="tel" autoComplete="tel" />
            </Field>
          </div>
        </SectionCard>

        {/* 2. Réception */}
        <SectionCard title="Mode de réception" icon={Truck}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'delivery', icon: Bike, title: 'Livraison à domicile', sub: `${SERVICE_CITY} uniquement · tarif selon le quartier` },
              { id: 'pickup', icon: Building2, title: 'Click & Collect', sub: 'Retrait gratuit au siège' },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => setReception(o.id)}
                className={`flex flex-col items-start gap-2 rounded-2xl border-2 p-3 text-left transition sm:p-4 ${reception === o.id ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                aria-pressed={reception === o.id}
              >
                <o.icon className={`h-6 w-6 ${reception === o.id ? 'text-emerald-700' : 'text-slate-500'}`} />
                <span className="text-sm font-bold leading-tight">{o.title}</span>
                <span className="text-xs text-slate-500">{o.sub}</span>
              </button>
            ))}
          </div>

          {reception === 'delivery' ? (
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <select value={quartierName} onChange={(e) => selectQuartier(e.target.value)} className={`${inputCls(errors.zone)} appearance-none pl-11 pr-10`} aria-label="Quartier">
                    {QUARTIERS.map((q) => (
                      <option key={q.name} value={q.name}>
                        {q.name} — {formatAr(deliveryFeeFor(q))}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>
                <button onClick={locateMe} disabled={locating} className="flex h-[50px] shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-emerald-800 disabled:opacity-60" aria-label="Utiliser ma position GPS">
                  {locating ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
                  <span className="hidden sm:inline">Ma position</span>
                </button>
              </div>

              <LocationPicker value={destination} onChange={onPickPoint} />

              <div className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl p-3 text-sm ${outOfZone ? 'bg-red-50 text-red-800' : 'bg-slate-50 text-slate-700'}`}>
                <span className="flex items-center gap-1.5">
                  <RouteIcon className="h-4 w-4" /> {quartierName} · {zoneFor(destination)} · ≈ {(km * 1.3).toFixed(1).replace('.', ',')} km
                </span>
                <span className="font-bold">{outOfZone ? 'Hors zone' : fee === 0 ? 'Offerte' : formatAr(fee)}</span>
              </div>
              {outOfZone && <p className="text-sm font-semibold text-red-700" role="alert">{OUT_OF_ZONE_MESSAGE}</p>}

              <Field label="Adresse précise / repère" error={errors.address} hint="Ex. Lot IVG 45 Bis, portail bleu, en face de l’épicerie.">
                <textarea className={`${inputCls(errors.address)} min-h-[80px] resize-y`} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Lot, rue, repère…" />
              </Field>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <StaticMap point={HQ} label={`<b>${HQ.name}</b><br/>${HQ.address}`} />
              <div className="rounded-2xl bg-slate-50 p-3 text-sm">
                <p className="font-bold">{HQ.address}</p>
                {HQ.hours.map(([d, h]) => (
                  <p key={d} className="text-slate-600">{d} : {h}</p>
                ))}
                <p className="mt-1 font-semibold text-emerald-700">Commande prête en 30 min environ · Gratuit</p>
              </div>
            </div>
          )}
        </SectionCard>

        {/* 3. Paiement */}
        <SectionCard title="Paiement" icon={Wallet}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'mobile', icon: Smartphone, title: 'Mobile Money', sub: 'MVola · Orange · Airtel', tag: 'Recommandé' },
              { id: 'cod', icon: Banknote, title: reception === 'pickup' ? 'Espèces au comptoir' : 'À la livraison', sub: 'Espèces en Ariary' },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => setMethod(o.id)}
                className={`relative flex flex-col items-start gap-2 rounded-2xl border-2 p-3 text-left transition sm:p-4 ${method === o.id ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                aria-pressed={method === o.id}
              >
                {o.tag && <span className="absolute right-2 top-2 rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white">{o.tag}</span>}
                <o.icon className={`h-6 w-6 ${method === o.id ? 'text-emerald-700' : 'text-slate-500'}`} />
                <span className="text-sm font-bold leading-tight">{o.title}</span>
                <span className="text-xs text-slate-500">{o.sub}</span>
              </button>
            ))}
          </div>

          {method === 'mobile' ? (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {Object.values(OPERATORS).map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setOperatorId(op.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition ${operatorId === op.id ? `${op.soft} border-transparent ring-2 ${op.ring}` : 'border-slate-200 bg-white'}`}
                    aria-pressed={operatorId === op.id}
                  >
                    <OperatorLogo op={op} />
                    <span className="text-xs font-bold leading-tight">{op.name}</span>
                    <span className="text-[10px] text-slate-500">{op.prefixes.join(' / ')}</span>
                  </button>
                ))}
              </div>
              <Field
                label={`Numéro ${operator.name}`}
                error={errors.mmPhone}
                hint={detected ? `Opérateur détecté : ${detected.name}` : `Préfixes acceptés : ${operator.prefixes.join(', ')}`}
              >
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className={`${inputCls(errors.mmPhone)} pl-11 tracking-wide`}
                    value={formatPhone(mmPhone)}
                    onChange={(e) => setMmPhone(normalizePhone(e.target.value))}
                    placeholder={`${operator.prefixes[0]} 12 345 67`}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
              </Field>
              <p className="flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                Vous recevrez une demande de paiement sur votre téléphone. Sans notification, composez <b className="font-mono">{operator.ussd}</b> pour valider le paiement en attente.
              </p>
            </div>
          ) : (
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
              <Banknote className="mt-0.5 h-5 w-5 shrink-0" />
              Préparez <b className="mx-1">{formatAr(total)}</b> en espèces. Merci de faire l’appoint : nos livreurs ont peu de monnaie.
            </p>
          )}
        </SectionCard>
      </div>

      {/* Récapitulatif */}
      <aside className="mt-4 lg:mt-14">
        <div className="space-y-3 rounded-3xl bg-white p-5 ink-card-sm lg:sticky lg:top-24">
          <h3 className="font-bold">Récapitulatif</h3>
          <ul className="max-h-56 space-y-2 overflow-y-auto">
            {cartLines.map(({ product: p, qty }) => (
              <li key={p.id} className="flex items-center gap-2 text-sm">
                <span className="text-xl">{p.emoji}</span>
                <span className="min-w-0 flex-1 truncate">{qty} × {p.name}</span>
                <span className="font-semibold">{formatAr(p.price * qty)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1.5 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Sous-total</span><span>{formatAr(subtotal)}</span></div>
            <div className="flex justify-between">
              <span className="text-slate-500">{reception === 'pickup' ? 'Retrait au siège' : `Livraison (${quartierName})`}</span>
              <span className={fee === 0 ? 'font-semibold text-emerald-700' : ''}>{fee === 0 ? 'Gratuit' : formatAr(fee)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-extrabold"><span>Total</span><span>{formatAr(total)}</span></div>
          </div>
          <button onClick={submit} disabled={outOfZone || submitting} className="hidden h-13 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 py-3.5 font-bold text-white shadow active:scale-[.98] disabled:opacity-50 md:flex">
            {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : method === 'mobile' ? <Lock className="h-4 w-4" /> : <CircleCheck className="h-5 w-5" />}
            {method === 'mobile' ? `Payer ${formatAr(total)}` : 'Confirmer la commande'}
          </button>
        </div>
      </aside>

      {/* Barre d'action mobile */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-[850] border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Total</p>
            <p className="truncate text-lg font-extrabold">{formatAr(total)}</p>
          </div>
          <button onClick={submit} disabled={outOfZone || submitting} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-emerald-700 font-bold text-white shadow active:scale-[.98] disabled:opacity-50">
            {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : method === 'mobile' ? <Lock className="h-4 w-4" /> : <CircleCheck className="h-5 w-5" />}
            {method === 'mobile' ? 'Payer' : 'Confirmer'}
          </button>
        </div>
      </div>

      {paying && (
        <MobileMoneyPayment
          operator={operator}
          phone={mmPhone}
          amount={total}
          initiate={initiatePayment}
          check={orders.checkPayment}
          simulate={orders.simulatePayment}
          onCancel={cancelPayment}
          onSuccess={paymentSucceeded}
        />
      )}
    </div>
  );
}
