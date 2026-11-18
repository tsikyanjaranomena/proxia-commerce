import { useMemo, useRef, useState } from 'react';
import { ChevronRight, LayoutGrid, MapPin, Search, SlidersHorizontal, Store, Timer, TriangleAlert, Wallet, X } from 'lucide-react';
import { Hero } from '../components/Hero.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { Maki } from '../components/brand/Maki.jsx';
import { ALL_CATEGORIES, SORTS, categoryIcon } from '../data/products.js';
import { normalizeText } from '../utils/format.js';

const PREVIEW_COUNT = 5; // produits montrés par rayon sur l'accueil
const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5';

const PERKS = [
  { icon: Timer, title: 'Livré en 30 – 60 min', text: 'À Antananarivo uniquement', tone: 'bg-mint text-brand' },
  { icon: Wallet, title: 'Mobile Money ou espèces', text: 'MVola, Orange, Airtel', tone: 'bg-peach text-sunset' },
  { icon: MapPin, title: 'Suis Maki en direct', text: 'Sa position sur la carte', tone: 'bg-sky text-lagoon' },
  { icon: Store, title: 'Retrait gratuit', text: 'Au siège, à Ankorondrano', tone: 'bg-blush text-litchi' },
];

// Teinte douce de l'icône de chaque rayon (vert ravinala, papaye, lagon, litchi).
const RAYON_TONES = ['bg-mint text-brand', 'bg-peach text-sunset', 'bg-sky text-lagoon', 'bg-blush text-litchi'];

// Montant saisi → nombre d'ariary, ou null si le champ est vide.
const toAmount = (text) => (text === '' ? null : Number(text));

function SkeletonGrid() {
  return (
    <div className={GRID} aria-busy="true" aria-label="Chargement du catalogue">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="ink-card-sm animate-pulse overflow-hidden rounded-3xl bg-white p-2">
          <div className="aspect-square rounded-[1.25rem] bg-slate-100" />
          <div className="space-y-2 p-2 pt-3">
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-5 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, title, text, action }) {
  return (
    <div className="ink-card-sm rounded-3xl bg-white px-6 py-12 text-center">
      {icon}
      <p className="font-display mt-3 text-xl font-semibold">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
      {action}
    </div>
  );
}

export function StorePage({ products, cartLines = [], loading, error, onRetry, onOpenProduct, onAdd }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const resultsRef = useRef(null);

  // Rayons déduits du catalogue, dans l'ordre d'apparition des produits.
  const categories = useMemo(() => {
    const counts = new Map();
    products.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    return [...counts].map(([name, count]) => ({ name, count }));
  }, [products]);

  const inCart = useMemo(() => Object.fromEntries(cartLines.map((l) => [l.product.id, l.qty])), [cartLines]);

  const results = useMemo(() => {
    const q = normalizeText(query.trim());
    const min = toAmount(minPrice);
    const max = toAmount(maxPrice);
    const list = products.filter((p) => {
      if (category !== ALL_CATEGORIES && p.category !== category) return false;
      if (min !== null && p.price < min) return false;
      if (max !== null && p.price > max) return false;
      if (!q) return true;
      return normalizeText([p.name, p.category, p.description, ...(p.tags || [])].join(' ')).includes(q);
    });
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, query, category, minPrice, maxPrice, sort]);

  const hasPriceFilter = minPrice !== '' || maxPrice !== '';
  const invertedRange = minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice);
  const activeFilters = hasPriceFilter + (sort !== 'relevance');
  // Accueil : aucun critère actif → on présente la boutique rayon par rayon.
  const browsing = !query.trim() && category === ALL_CATEGORIES && activeFilters === 0;

  const resetPrice = () => { setMinPrice(''); setMaxPrice(''); };
  const resetAll = () => { setQuery(''); setCategory(ALL_CATEGORIES); resetPrice(); setSort('relevance'); };
  const onPrice = (set) => (e) => set(e.target.value.replace(/\D/g, '').slice(0, 9));
  const pickCategory = (name) => {
    setCategory(name);
    resultsRef.current?.scrollIntoView({ block: 'start' });
  };

  const card = (p, showCategory) => (
    <ProductCard key={p.id} product={p} inCart={inCart[p.id] || 0} showCategory={showCategory} onOpen={() => onOpenProduct(p)} onAdd={() => onAdd(p, 1)} />
  );

  return (
    <>
      <Hero onStart={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />

      <div className="mx-auto w-full max-w-[1600px] px-4 pb-8 sm:px-6 lg:px-10">
        {/* Engagements */}
        <ul className="ink-card-sm mt-5 grid grid-cols-2 gap-y-4 rounded-3xl bg-white p-4 sm:p-5 lg:grid-cols-4 lg:divide-x lg:divide-slate-100">
          {PERKS.map(({ icon: Icon, title, text, tone }) => (
            <li key={title} className="group flex items-center gap-3 lg:px-5 lg:first:pl-0">
              <span className={`group-jelly grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-tight text-ink">{title}</span>
                <span className="block text-xs text-slate-500">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        <div ref={resultsRef} className="scroll-mt-16" />

        {/* Recherche, filtres, rayons */}
        <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-[800] -mx-4 mt-6 bg-sand/95 px-4 pb-3 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
          <div className="flex gap-2.5">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un produit…"
                className="w-full rounded-full border border-slate-200 bg-white py-3 pl-12 pr-10 text-base outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                enterKeyHint="search"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100" aria-label="Effacer">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`relative grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full border transition ${showFilters ? 'border-emerald-300 bg-emerald-50 text-brand' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
              aria-label="Filtres et tri"
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="h-5 w-5" />
              {activeFilters > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">{activeFilters}</span>}
            </button>
          </div>

          {showFilters && (
            <div className="animate-fade ink-card mt-2.5 space-y-4 rounded-3xl bg-white p-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Trier par</p>
                <div className="no-scrollbar flex gap-2 overflow-x-auto">
                  {SORTS.map((s) => (
                    <button key={s.id} onClick={() => setSort(s.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${sort === s.id ? 'bg-ink text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Prix (Ar)</p>
                <div className="flex items-center gap-2">
                  {[['Min', minPrice, setMinPrice, 'Prix minimum'], ['Max', maxPrice, setMaxPrice, 'Prix maximum']].map(([label, value, set, aria], i) => (
                    <div key={label} className="contents">
                      {i === 1 && <span className="text-slate-400" aria-hidden>–</span>}
                      <input
                        type="text"
                        inputMode="numeric"
                        value={value}
                        onChange={onPrice(set)}
                        placeholder={label}
                        aria-label={aria}
                        aria-invalid={invertedRange}
                        className={`h-11 w-full min-w-0 flex-1 rounded-xl border bg-white px-3 text-base outline-none focus:ring-4 ${invertedRange ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:border-emerald-400 focus:ring-emerald-100'}`}
                      />
                    </div>
                  ))}
                </div>
                {invertedRange && <p className="mt-1.5 text-xs font-bold text-litchi">Le prix minimum dépasse le prix maximum.</p>}
              </div>
              {activeFilters > 0 && (
                <button onClick={() => { resetPrice(); setSort('relevance'); }} className="text-sm font-bold text-brand hover:underline">
                  Réinitialiser
                </button>
              )}
            </div>
          )}

          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
            {[{ name: ALL_CATEGORIES, count: products.length }, ...categories].map(({ name, count }) => {
              const Icon = name === ALL_CATEGORIES ? LayoutGrid : categoryIcon(name);
              const active = category === name;
              return (
                <button
                  key={name}
                  onClick={() => setCategory(name)}
                  aria-pressed={active}
                  className={`group flex shrink-0 items-center gap-1.5 rounded-full py-2 pl-3 pr-3.5 text-sm font-bold transition ${active ? 'bg-ink text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300'}`}
                >
                  <Icon className="group-jelly h-4 w-4" />
                  {name}
                  <span className={`text-xs ${active ? 'text-white/60' : 'text-slate-400'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <SkeletonGrid />
          ) : error && products.length === 0 ? (
            <EmptyState
              icon={<TriangleAlert className="mx-auto h-10 w-10 text-litchi" />}
              title="Impossible de charger le catalogue"
              text={error}
              action={<button onClick={onRetry} className="btn-3d mt-5 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white">Réessayer</button>}
            />
          ) : browsing ? (
            <div className="space-y-12 pt-4">
              {categories.map(({ name, count }, i) => {
                const Icon = categoryIcon(name);
                return (
                  <section key={name} aria-label={name}>
                    <div className="mb-4 flex items-center gap-3">
                      <span className={`hover-jelly grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${RAYON_TONES[i % RAYON_TONES.length]}`}><Icon className="h-5 w-5" /></span>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-2xl leading-tight text-ink sm:text-3xl">{name}</h2>
                        <p className="text-sm text-slate-500">{count} produit{count > 1 ? 's' : ''}</p>
                      </div>
                      {count > PREVIEW_COUNT && (
                        <button onClick={() => pickCategory(name)} className="group flex shrink-0 items-center gap-0.5 rounded-full px-3 py-2 text-sm font-bold text-brand transition hover:bg-emerald-50">
                          Tout voir <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </button>
                      )}
                    </div>
                    <div className={GRID}>
                      {products.filter((p) => p.category === name).slice(0, PREVIEW_COUNT).map((p) => card(p, false))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-500">
                {results.length} produit{results.length > 1 ? 's' : ''}
                {category !== ALL_CATEGORIES && <> en <span className="font-bold text-slate-700">{category}</span></>}
                {query && <> pour « <span className="font-bold text-slate-700">{query}</span> »</>}
              </p>
              {results.length === 0 ? (
                <EmptyState
                  icon={<Maki headOnly className="mx-auto block h-16 w-20" />}
                  title="Aucun produit trouvé"
                  text="Maki a cherché partout… Essaie un autre mot ou élargis les filtres."
                  action={<button onClick={resetAll} className="btn-3d mt-5 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white">Tout afficher</button>}
                />
              ) : (
                <div className={GRID}>{results.map((p) => card(p, category === ALL_CATEGORIES))}</div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
