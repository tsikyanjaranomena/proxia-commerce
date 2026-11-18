import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Ban, Banknote, BatteryMedium, Bike, CircleCheck, Clock, Copy, KeyRound, LoaderCircle, MapPin, MessageCircle, Navigation, Package, Phone, Receipt, Route as RouteIcon, ShieldCheck, Star, TriangleAlert, Wallet } from 'lucide-react';
import { MapTracking } from '../components/MapTracking.jsx';
import { MobileMoneyPayment } from '../components/MobileMoneyPayment.jsx';
import { StaticMap } from '../components/StaticMap.jsx';
import { ManeuverIcon } from '../components/tracking/ManeuverIcon.jsx';
import { PinVerifier } from '../components/tracking/PinVerifier.jsx';
import { Timeline } from '../components/tracking/Timeline.jsx';
import { OperatorLogo } from '../components/ui/OperatorLogo.jsx';
import { SectionCard } from '../components/ui/SectionCard.jsx';
import { HQ, TRAFFIC_FACTOR, SIM_SPEEDUP } from '../data/config.js';
import { OPERATORS } from '../data/operators.js';
import { formatDist, formatTime, formatDate } from '../utils/format.js';
import { formatAr } from '../utils/formatCurrency.js';
import { buildGeo, nextManeuver, instructionFr } from '../utils/navigation.js';
import { isInProgress, orderProgress, phaseMeta } from '../utils/orderTimeline.js';
import { formatPhone } from '../utils/phone.js';

/**
 * Suivi d'une commande. L'état et l'avancement du livreur viennent du serveur
 * (WebSocket) ; `orders` est l'objet retourné par useOrders.
 */
export function TrackingPage({ order, orders, navigate, toast }) {
  const geo = useMemo(() => buildGeo(order.route), [order.route]);
  const [showSteps, setShowSteps] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const phase = order.status;
  const inProgress = isInProgress(order);
  const isPickup = order.reception === 'pickup';
  const progress = orderProgress(order);
  const traveled = geo ? progress * geo.total : 0;
  const remainingM = geo ? Math.max(0, geo.total - traveled) : 0;
  const maneuver = geo && phase === 'enroute' ? nextManeuver(geo, traveled) : null;
  const etaMin = geo ? Math.max(1, Math.ceil(((1 - progress) * geo.duration * TRAFFIC_FACTOR) / 60)) : null;
  const battery = order.rider ? Math.max(5, Math.round(order.rider.battery - progress * 7)) : 0;
  const op = order.payment?.operator ? OPERATORS[order.payment.operator] : null;
  const meta = phaseMeta(order);

  // L'itinéraire (volumineux) n'est pas inclus dans la liste : on le charge avec le détail.
  const { loadOrder } = orders;
  useEffect(() => {
    if (order.hasRoute && !order.route) loadOrder(order.id).catch(() => {});
  }, [order.id, order.hasRoute, order.route, loadOrder]);

  const steps = isPickup
    ? [
        { id: 'confirmed', label: 'Confirmée' },
        { id: 'preparing', label: 'Préparation' },
        { id: 'ready', label: 'Prête' },
        { id: 'delivered', label: 'Retirée' },
      ]
    : [
        { id: 'confirmed', label: 'Confirmée' },
        { id: 'preparing', label: 'Préparation' },
        { id: 'enroute', label: 'En route' },
        { id: 'arrived', label: 'Arrivé' },
        { id: 'delivered', label: 'Livrée' },
      ];

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(order.pin);
      toast('Code PIN copié');
    } catch {
      toast(`Votre code : ${order.pin}`, 'info');
    }
  };

  // Mode démo : le client valide lui-même la remise. Le serveur vérifie le code.
  const confirmDelivery = async (pin) => {
    await orders.confirmDelivery(order.id, pin);
    toast(isPickup ? 'Commande retirée. Merci et à bientôt !' : 'Livraison confirmée. Misaotra betsaka ! 🙏');
  };

  const cancel = async () => {
    setCancelling(true);
    try {
      await orders.cancelOrder(order.id);
      toast('Commande annulée.', 'info');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 py-4">
      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => navigate('orders')} className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-sm ring-1 ring-slate-200" aria-label="Retour aux commandes">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold">Commande {order.id}</h1>
          <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.chip}`}>{meta.label}</span>
      </div>

      <div className="mb-4 rounded-3xl bg-white p-4 ink-card-sm">
        <Timeline steps={steps} current={phase} />
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-5">
        {/* Carte */}
        <div className="relative">
          {isPickup ? (
            <StaticMap point={HQ} label={`<b>${HQ.name}</b><br/>${HQ.address}`} className="h-[40dvh] min-h-[280px] md:h-[480px]" />
          ) : (
            <>
              <MapTracking order={order} geo={geo} />
              {!geo && inProgress && (
                <div className="absolute inset-x-3 bottom-3 z-[500] flex items-center gap-2 rounded-2xl bg-white/95 p-3 text-sm font-semibold shadow-lg">
                  <LoaderCircle className="h-5 w-5 animate-spin text-blue-600" /> Calcul de l’itinéraire dans les rues de Tana…
                </div>
              )}
              {geo?.approximate && (
                <div className="absolute inset-x-3 bottom-3 z-[500] flex items-start gap-2 rounded-2xl bg-amber-50/95 p-3 text-xs text-amber-900 shadow-lg">
                  <TriangleAlert className="h-4 w-4 shrink-0" /> Serveur de routage injoignable : tracé approximatif affiché.
                </div>
              )}
              {/* Guidage turn-by-turn */}
              {maneuver && (
                <div className="absolute left-3 right-[4.25rem] top-16 z-[500] flex items-center gap-3 rounded-2xl bg-blue-700 p-3 text-white shadow-xl">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15">
                    <ManeuverIcon step={maneuver.step} className="h-7 w-7" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xl font-extrabold leading-none">{formatDist(maneuver.distance)}</p>
                    <p className="mt-1 truncate text-sm text-blue-100">{instructionFr(maneuver.step)}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Panneau d'infos */}
        <div className="mt-4 space-y-4 lg:mt-0">
          {phase === 'pending_payment' && (
            <div className="space-y-3 rounded-3xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <div className="flex items-start gap-3">
                <Wallet className="mt-0.5 h-7 w-7 shrink-0 text-amber-700" />
                <div>
                  <p className="font-extrabold text-amber-950">Paiement en attente</p>
                  <p className="text-sm text-amber-900">
                    Réglez {formatAr(order.total)} par Mobile Money pour lancer la préparation. Sans paiement, la commande est annulée automatiquement après 15 minutes.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={cancel} disabled={cancelling} className="h-11 rounded-full bg-white text-sm font-bold text-slate-700 ring-1 ring-slate-200 disabled:opacity-50">
                  Annuler la commande
                </button>
                <button onClick={() => setPaying(true)} disabled={!op} className="h-11 rounded-full bg-emerald-700 text-sm font-bold text-white disabled:opacity-50">
                  Payer maintenant
                </button>
              </div>
            </div>
          )}

          {phase === 'cancelled' && (
            <div className="flex items-center gap-3 rounded-3xl bg-slate-200 p-4 text-slate-700">
              <Ban className="h-8 w-8 shrink-0" />
              <div>
                <p className="font-extrabold">Commande annulée</p>
                <p className="text-sm">Aucun montant n’a été encaissé. Les articles ont été remis en stock.</p>
              </div>
            </div>
          )}

          {/* ETA */}
          {!isPickup && inProgress && (
            <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-700 p-4 text-white shadow">
              {phase === 'enroute' && geo ? (
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Arrivée estimée</p>
                    <p className="text-3xl font-extrabold">{etaMin} min</p>
                    <p className="text-sm text-blue-100">vers {formatTime(Date.now() + etaMin * 60_000)} · {formatDist(remainingM)} restants</p>
                  </div>
                  <div className="text-right text-xs text-blue-200">
                    <p>{Math.round(progress * 100)} %</p>
                    <div className="mt-1 h-2 w-24 overflow-hidden rounded-full bg-white/20">
                      <div className="h-full rounded-full bg-white" style={{ width: `${progress * 100}%` }} />
                    </div>
                  </div>
                </div>
              ) : phase === 'arrived' ? (
                <div className="flex items-center gap-3">
                  <MapPin className="h-8 w-8 shrink-0" />
                  <div>
                    <p className="text-lg font-extrabold">Votre livreur est arrivé !</p>
                    <p className="text-sm text-blue-100">Récupérez votre colis et communiquez-lui votre code PIN.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 shrink-0" />
                  <div>
                    <p className="text-lg font-extrabold">Préparation de votre commande</p>
                    <p className="text-sm text-blue-100">
                      {geo ? `Départ imminent du livreur · trajet ≈ ${Math.ceil((geo.duration * TRAFFIC_FACTOR) / 60)} min (${formatDist(geo.total)})` : 'Calcul de l’itinéraire…'}
                    </p>
                  </div>
                </div>
              )}
              <p className="mt-3 border-t border-white/15 pt-2 text-[11px] text-blue-200">
                {order.trackingMode === 'live'
                  ? 'Position GPS réelle du livreur. Itinéraire OSRM / OpenStreetMap.'
                  : `Mode démo : livreur simulé, trajet joué ×${SIM_SPEEDUP} plus vite. Itinéraire OSRM / OpenStreetMap.`}
              </p>
            </div>
          )}

          {phase === 'delivered' && (
            <div className="flex items-center gap-3 rounded-3xl bg-emerald-600 p-4 text-white shadow">
              <CircleCheck className="h-10 w-10 shrink-0" />
              <div>
                <p className="text-lg font-extrabold">{isPickup ? 'Commande retirée' : 'Commande livrée'}</p>
                <p className="text-sm text-emerald-50">Le {formatDate(order.deliveredAt || Date.now())}. Merci pour votre confiance !</p>
              </div>
            </div>
          )}

          {/* Code PIN */}
          {inProgress && (
            <SectionCard title={isPickup ? 'Code de retrait' : 'Code PIN de livraison'} icon={KeyRound}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  {order.pin.split('').map((d, i) => (
                    <span key={i} className="grid h-14 w-12 place-items-center rounded-2xl bg-slate-900 text-2xl font-extrabold text-white">{d}</span>
                  ))}
                </div>
                <button onClick={copyPin} className="grid h-11 w-11 place-items-center rounded-full bg-slate-100" aria-label="Copier le code">
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                {isPickup
                  ? 'Présentez ce code au comptoir du siège pour récupérer votre commande.'
                  : 'Ne donnez ce code au livreur qu’une fois le colis vérifié et en main. Ne le communiquez jamais par téléphone.'}
              </p>
              {order.demo && (phase === 'arrived' || phase === 'ready') && (
                <div className="mt-4 rounded-2xl border border-dashed border-violet-300 bg-violet-50 p-3">
                  <PinVerifier
                    onSubmit={confirmDelivery}
                    label={isPickup ? 'Mode démo : saisissez le code à la place de l’agent du comptoir.' : 'Mode démo : saisissez le code à la place du livreur (ou validez depuis l’espace livreur).'}
                  />
                </div>
              )}
            </SectionCard>
          )}

          {/* Livreur */}
          {!isPickup && order.rider && (inProgress || phase === 'delivered') && (
            <SectionCard title="Votre livreur" icon={Bike}>
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-blue-100 text-lg font-extrabold text-blue-800">
                  {order.rider.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{order.rider.name}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {order.rider.rating} · {order.rider.trips} livraisons
                  </p>
                  <p className="text-xs text-slate-500">{order.rider.moto} · <span className="font-mono font-semibold text-slate-700">{order.rider.plate}</span></p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-2xl bg-slate-50 p-2">
                  <BatteryMedium className={`mx-auto h-5 w-5 ${battery < 20 ? 'text-red-600' : 'text-emerald-700'}`} />
                  <p className="mt-0.5 font-bold">{battery} %</p>
                  <p className="text-slate-500">Batterie</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2">
                  <RouteIcon className="mx-auto h-5 w-5 text-blue-700" />
                  <p className="mt-0.5 font-bold">{geo ? formatDist(remainingM) : '—'}</p>
                  <p className="text-slate-500">Restant</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-2">
                  <Clock className="mx-auto h-5 w-5 text-amber-600" />
                  <p className="mt-0.5 font-bold">{phase === 'enroute' && etaMin ? `${etaMin} min` : phase === 'arrived' || phase === 'delivered' ? 'Arrivé' : '—'}</p>
                  <p className="text-slate-500">ETA</p>
                </div>
              </div>
              {phase !== 'delivered' && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a href={`tel:${order.rider.phone}`} className="flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 text-sm font-bold text-white">
                    <Phone className="h-4 w-4" /> Appeler
                  </a>
                  <a href={`sms:${order.rider.phone}`} className="flex h-11 items-center justify-center gap-2 rounded-full bg-slate-100 text-sm font-bold text-slate-800">
                    <MessageCircle className="h-4 w-4" /> SMS
                  </a>
                </div>
              )}
              <p className="mt-2 text-center text-xs text-slate-400">{formatPhone(order.rider.phone)}</p>
            </SectionCard>
          )}

          {/* Itinéraire détaillé */}
          {!isPickup && geo && !geo.approximate && (
            <SectionCard
              title={`Itinéraire (${geo.steps.length} étapes)`}
              icon={Navigation}
              action={
                <button onClick={() => setShowSteps((s) => !s)} className="text-sm font-semibold text-emerald-700">
                  {showSteps ? 'Masquer' : 'Afficher'}
                </button>
              }
            >
              {showSteps ? (
                <ol className="max-h-72 space-y-1 overflow-y-auto">
                  {geo.steps.map((s, i) => {
                    const passed = traveled > s.startDist + 5 && phase !== 'preparing' && phase !== 'confirmed';
                    const current = maneuver?.index === i;
                    return (
                      <li key={i} className={`flex items-center gap-3 rounded-xl p-2 text-sm ${current ? 'bg-blue-50 font-semibold text-blue-900' : passed ? 'text-slate-400' : ''}`}>
                        <ManeuverIcon step={s} className="h-5 w-5 shrink-0" />
                        <span className="min-w-0 flex-1">{instructionFr(s)}</span>
                        {s.distance > 0 && <span className="shrink-0 text-xs text-slate-500">{formatDist(s.distance)}</span>}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="text-sm text-slate-500">
                  {formatDist(geo.total)} depuis le siège d’Ankorondrano jusqu’à {order.quartier}, en suivant le réseau routier.
                </p>
              )}
            </SectionCard>
          )}

          {/* Détails commande */}
          <SectionCard title="Détails de la commande" icon={Receipt}>
            <ul className="space-y-1.5 text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-2">
                  <span>{i.emoji}</span>
                  <span className="min-w-0 flex-1 truncate">{i.qty} × {i.name}</span>
                  <span className="font-medium">{formatAr(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Livraison</span><span>{order.fee === 0 ? 'Gratuit' : formatAr(order.fee)}</span></div>
              <div className="flex justify-between font-extrabold"><span>Total</span><span>{formatAr(order.total)}</span></div>
            </div>
            <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 p-3 text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <span>{isPickup ? HQ.address : `${order.quartier} — ${order.address}`}</span>
              </p>
              <p className="flex items-center gap-2">
                {op ? <OperatorLogo op={op} className="h-6 w-6 text-[9px]" /> : <Banknote className="h-4 w-4 text-slate-500" />}
                {order.payment?.method === 'mobile' ? (
                  order.payment.status === 'paid' ? (
                    <span>Payé via {op?.name} · <span className="font-mono text-xs">{order.payment.txRef}</span></span>
                  ) : (
                    <span>{op?.name} · {phase === 'cancelled' ? 'non payé' : 'paiement en attente'}</span>
                  )
                ) : order.payment?.status === 'paid' ? (
                  <span>Payé en espèces</span>
                ) : (
                  <span>À payer en espèces : <b>{formatAr(order.total)}</b></span>
                )}
              </p>
            </div>
            <button onClick={() => navigate('support', order.id)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-700">
              <TriangleAlert className="h-4 w-4" /> Signaler un problème
            </button>
          </SectionCard>
        </div>
      </div>

      {paying && op && (
        <MobileMoneyPayment
          operator={op}
          phone={order.payment.phone}
          amount={order.total}
          initiate={() => orders.retryPayment(order.id, { operator: op.id, phone: order.payment.phone })}
          check={orders.checkPayment}
          simulate={orders.simulatePayment}
          onCancel={() => setPaying(false)}
          onSuccess={() => {
            setPaying(false);
            toast('Paiement reçu, commande confirmée !');
          }}
        />
      )}
    </div>
  );
}
