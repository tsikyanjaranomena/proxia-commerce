import { ChevronRight, LoaderCircle } from 'lucide-react';
import { formatDate } from '../utils/format.js';
import { Maki } from './brand/Maki.jsx';
import { formatAr } from '../utils/formatCurrency.js';
import { phaseMeta } from '../utils/orderTimeline.js';

export function OrdersList({ orders, loading, navigate }) {
  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <LoaderCircle className="h-8 w-8 animate-spin text-emerald-700" />
      </div>
    );
  }
  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Maki className="mx-auto h-44 w-40" />
        <h2 className="mt-4 text-2xl font-extrabold">Aucune commande pour l'instant</h2>
        <p className="mt-1 text-slate-500">Dès que tu commandes, tu pourras suivre Maki sur la carte jusqu'à ta porte.</p>
        <button onClick={() => navigate('shop')} className="btn-3d font-display mt-6 h-12 rounded-full bg-brand px-8 text-lg font-bold text-white">Commander maintenant</button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl space-y-3 px-4 py-4">
      <h1 className="text-2xl font-extrabold">Mes commandes</h1>
      {orders.map((o) => {
        const meta = phaseMeta(o);
        return (
          <button key={o.id} onClick={() => navigate('orders', o.id)} className="flex w-full items-center gap-3 rounded-3xl bg-white p-4 text-left ink-card-sm active:scale-[.99]">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-100 text-2xl">
              {o.reception === 'pickup' ? '🏬' : o.status === 'delivered' ? '📦' : '🛵'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="font-bold">{o.id}</p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.chip}`}>{meta.label}</span>
              </div>
              <p className="truncate text-sm text-slate-500">
                {o.items.reduce((a, i) => a + i.qty, 0)} article(s) · {o.reception === 'pickup' ? 'Retrait au siège' : o.quartier}
              </p>
              <p className="text-xs text-slate-400">{formatDate(o.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="font-extrabold">{formatAr(o.total)}</p>
              <ChevronRight className="ml-auto mt-1 h-5 w-5 text-slate-400" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
