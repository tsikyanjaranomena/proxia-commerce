import { ChevronRight, ShieldCheck, Trash2 } from 'lucide-react';
import { QtyStepper } from '../components/ui/QtyStepper.jsx';
import { Maki } from '../components/brand/Maki.jsx';
import { FREE_DELIVERY_THRESHOLD } from '../data/config.js';
import { clamp } from '../utils/format.js';
import { formatAr } from '../utils/formatCurrency.js';

export function CartPage({ cartLines, subtotal, setQty, removeItem, navigate }) {
  if (cartLines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Maki className="hop mx-auto h-44 w-40" />
        <h2 className="mt-4 text-2xl font-extrabold">Ton panier est tout vide !</h2>
        <p className="mt-1 text-slate-500">Maki attend ta commande ! Choisis tes pâtes et tes goûters, il te les apporte en un bond.</p>
        <button onClick={() => navigate('shop')} className="btn-3d font-display mt-6 h-12 rounded-full bg-brand px-8 text-lg font-bold text-white">
          Remplir mon panier
        </button>
      </div>
    );
  }
  const remaining = FREE_DELIVERY_THRESHOLD - subtotal;
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 py-4 lg:grid lg:grid-cols-[1fr_360px] lg:gap-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-extrabold">Mon panier</h1>
        <div className="rounded-2xl bg-white p-4 ink-card-sm">
          {remaining > 0 ? (
            <p className="text-sm">
              Plus que <span className="font-bold text-emerald-700">{formatAr(remaining)}</span> pour la livraison offerte 🎉
            </p>
          ) : (
            <p className="text-sm font-semibold text-emerald-700">Livraison offerte sur cette commande 🎉</p>
          )}
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${clamp((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 0, 100)}%` }} />
          </div>
        </div>
        {cartLines.map(({ product: p, qty }) => (
          <div key={p.id} className="flex gap-3 rounded-3xl bg-white p-3 ink-card-sm">
            <div className={`grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br text-4xl ${p.tint}`}>
              {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : p.emoji}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold leading-tight">{p.name}</p>
                <button onClick={() => removeItem(p.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Retirer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500">{formatAr(p.price)} / unité</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <QtyStepper size="sm" value={qty} onChange={(v) => setQty(p.id, v)} min={0} max={p.stock} />
                <p className="font-extrabold">{formatAr(p.price * qty)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <aside className="mt-4 lg:mt-12">
        <div className="space-y-3 rounded-3xl bg-white p-5 ink-card-sm lg:sticky lg:top-24">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Sous-total</span>
            <span className="font-semibold">{formatAr(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Livraison</span>
            <span className="text-slate-500">Calculée selon le quartier</span>
          </div>
          <button onClick={() => navigate('checkout')} className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 py-3.5 font-bold text-white shadow active:scale-[.98]">
            Passer la commande <ChevronRight className="h-5 w-5" />
          </button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4" /> MVola · Orange Money · Airtel Money · Espèces
          </p>
        </div>
      </aside>
    </div>
  );
}
