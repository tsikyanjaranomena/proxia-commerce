import { LifeBuoy, ShoppingBag, ShoppingCart, Store, Truck } from 'lucide-react';
import { Maki } from './brand/Maki.jsx';

export const NAV_ITEMS = [
  { view: 'shop', label: 'Boutique', icon: Store },
  { view: 'cart', label: 'Panier', icon: ShoppingCart },
  { view: 'orders', label: 'Suivi', icon: Truck },
  { view: 'support', label: 'Support', icon: LifeBuoy },
];

export function Header({ view, navigate, cartCount, activeCount }) {
  return (
    <header className="sticky top-0 z-[900] border-b border-slate-200/80 bg-white/90 pt-[env(safe-area-inset-top)] text-ink backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <button onClick={() => navigate('shop')} className="group flex items-center gap-2.5" aria-label="Accueil">
          <span className="group-jump grid h-10 w-10 place-items-center rounded-full bg-butter p-1">
            <Maki headOnly className="h-full w-full" />
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight">
            Mada<span className="text-brand">Express</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ view: v, label, icon: Icon }) => {
            const active = view === v || (v === 'cart' && view === 'checkout');
            const count = v === 'cart' ? cartCount : v === 'orders' ? activeCount : 0;
            return (
              <button
                key={v}
                onClick={() => navigate(v)}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-bold transition ${active ? 'bg-emerald-50 text-brand' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'}`}
              >
                <Icon className="group-jelly h-[18px] w-[18px]" />
                {label}
                {count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-litchi px-1 text-[11px] font-bold text-white">{count}</span>}
              </button>
            );
          })}
        </nav>

        <button onClick={() => navigate('cart')} className="hover-jelly relative grid h-10 w-10 place-items-center rounded-full bg-slate-100 md:hidden" aria-label={`Panier (${cartCount})`}>
          <ShoppingBag className="h-5 w-5" />
          {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-litchi px-1 text-[11px] font-bold text-white ring-2 ring-white">{cartCount}</span>}
        </button>
      </div>
    </header>
  );
}
