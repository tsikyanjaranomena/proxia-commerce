import { NAV_ITEMS } from './Header.jsx';

export function BottomNav({ view, navigate, cartCount, activeCount }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[900] border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <div className="grid grid-cols-4">
        {NAV_ITEMS.map(({ view: v, label, icon: Icon }) => {
          const active = view === v || (v === 'cart' && view === 'checkout');
          const count = v === 'cart' ? cartCount : v === 'orders' ? activeCount : 0;
          return (
            <button key={v} onClick={() => navigate(v)} className={`group relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold ${active ? 'text-brand' : 'text-slate-500'}`}>
              <span className={`relative grid h-8 w-14 place-items-center rounded-full transition ${active ? 'bg-emerald-50' : ''}`}>
                <Icon className="group-jelly h-5 w-5" />
                {count > 0 && <span className="absolute -top-1 right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-litchi px-1 text-[10px] font-bold text-white">{count}</span>}
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
