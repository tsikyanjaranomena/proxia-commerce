import { Plus, Star } from 'lucide-react';
import { formatAr } from '../utils/formatCurrency.js';

/** Carte produit. `inCart` : quantité déjà dans le panier (affichée sur le bouton d'ajout). */
export function ProductCard({ product: p, inCart = 0, showCategory = true, onOpen, onAdd }) {
  const soldOut = p.stock <= 0;
  const maxed = inCart >= p.stock;
  return (
    <article className="tilt-hover group ink-card-sm flex flex-col overflow-hidden rounded-3xl bg-white">
      <button onClick={onOpen} className="p-2 pb-0 text-left" aria-label={`Voir ${p.name}`}>
        <div className={`relative grid aspect-square place-items-center overflow-hidden rounded-[1.25rem] bg-gradient-to-br ${p.tint}`}>
          {p.image
            ? <img src={p.image} alt="" loading="lazy" className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105 ${soldOut ? 'opacity-50 grayscale' : ''}`} />
            : <span className={`group-jump inline-block text-6xl transition duration-300 group-hover:scale-110 sm:text-7xl ${soldOut ? 'opacity-50 grayscale' : ''}`} aria-hidden>{p.emoji}</span>}
          {p.badge && !soldOut && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-ink shadow-sm">{p.badge}</span>
          )}
          {soldOut ? (
            <span className="absolute inset-x-2.5 bottom-2.5 rounded-full bg-ink/80 py-1 text-center text-[11px] font-bold text-white">Rupture de stock</span>
          ) : (
            p.stock <= 10 && <span className="absolute bottom-2.5 left-2.5 rounded-full bg-litchi px-2.5 py-0.5 text-[11px] font-bold text-white">Plus que {p.stock}</span>
          )}
        </div>
        <div className="px-2 pt-3">
          {showCategory && <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{p.category}</p>}
          <h3 className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-tight text-ink">{p.name}</h3>
          {p.reviews > 0 && (
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <Star className="h-3.5 w-3.5 fill-sun text-sun" />
              <span className="font-bold text-slate-700">{p.rating.toFixed(1)}</span>
              <span>({p.reviews})</span>
            </div>
          )}
        </div>
      </button>
      <div className="mt-auto flex items-end justify-between gap-1 px-4 pb-4 pt-2">
        <div className="min-w-0">
          {p.oldPrice && <p className="text-[11px] text-slate-400 line-through">{formatAr(p.oldPrice)}</p>}
          <p className="font-display truncate text-lg font-semibold leading-tight text-ink">{formatAr(p.price)}</p>
        </div>
        <button
          onClick={onAdd}
          disabled={soldOut || maxed}
          className="hover-jelly relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-deep disabled:bg-slate-200 disabled:text-slate-400"
          aria-label={inCart > 0 ? `Ajouter encore ${p.name} (${inCart} dans le panier)` : `Ajouter ${p.name} au panier`}
        >
          <Plus className="h-5 w-5 transition duration-300 group-hover:rotate-90" strokeWidth={2.5} />
          {inCart > 0 && (
            <span key={inCart} className="bounce-in absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-sun px-1 text-[11px] font-bold text-ink ring-2 ring-white">{inCart}</span>
          )}
        </button>
      </div>
    </article>
  );
}
