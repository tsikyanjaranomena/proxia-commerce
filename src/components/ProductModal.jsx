import { useEffect, useState } from 'react';
import { Package, Truck, X } from 'lucide-react';
import { QtyStepper } from './ui/QtyStepper.jsx';
import { Sheet } from './ui/Sheet.jsx';
import { Stars } from './ui/Stars.jsx';
import { formatAr } from '../utils/formatCurrency.js';

export function ProductModal({ product, onClose, onAdd, onBuyNow }) {
  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [product?.id]);
  if (!product) return null;
  const p = product;
  return (
    <Sheet
      open
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          <QtyStepper value={qty} onChange={setQty} max={p.stock} />
          <button onClick={() => onAdd(p, qty)} className="h-12 flex-1 rounded-full border-2 border-emerald-700 text-sm font-bold text-emerald-800 active:scale-[.98]">
            Ajouter
          </button>
          <button onClick={() => onBuyNow(p, qty)} className="h-12 flex-1 rounded-full bg-emerald-700 text-sm font-bold text-white shadow active:scale-[.98]">
            Acheter
          </button>
        </div>
      }
    >
      <div className={`relative grid place-items-center overflow-hidden bg-gradient-to-br ${p.tint} ${p.image ? 'aspect-square max-h-[26rem] w-full' : 'h-56 sm:h-64'}`}>
        {p.image
          ? <img src={p.image} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
          : <span className="text-8xl" aria-hidden>{p.emoji}</span>}
        <button onClick={onClose} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow" aria-label="Fermer">
          <X className="h-5 w-5" />
        </button>
        {p.badge && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-800">{p.badge}</span>}
      </div>
      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{p.category}</p>
          <h2 className="mt-1 text-xl font-extrabold leading-tight">{p.name}</h2>
          {p.reviews > 0 && (
            <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-500">
              <Stars value={p.rating} /> <span className="font-semibold text-slate-700">{p.rating.toFixed(1)}</span> · {p.reviews} avis
            </div>
          )}
        </div>
        <div className="flex items-end gap-2">
          <p className="text-2xl font-extrabold">{formatAr(p.price)}</p>
          {p.oldPrice && <p className="pb-1 text-sm text-slate-400 line-through">{formatAr(p.oldPrice)}</p>}
        </div>
        <p className="text-sm leading-relaxed text-slate-600">{p.description}</p>

        <div>
          <h3 className="mb-2 text-sm font-bold">Caractéristiques</h3>
          <dl className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 text-sm">
            {Object.entries(p.specs).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[40%_60%] px-4 py-2.5 odd:bg-slate-50">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-emerald-900">
            <Truck className="h-5 w-5 shrink-0" /> Livraison 30 – 60 min
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-3 text-slate-700">
            <Package className="h-5 w-5 shrink-0" /> {p.stock} en stock
          </div>
        </div>
      </div>
    </Sheet>
  );
}
