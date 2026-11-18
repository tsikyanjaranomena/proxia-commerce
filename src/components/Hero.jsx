import { ArrowRight, Timer } from 'lucide-react';
import { Baobab, Maki, Ravenala, ZebuCart } from './brand/Maki.jsx';

/**
 * Première image de la boutique : un message clair, Maki, et la charrette à zébu
 * qui traverse la route de terre rouge, de gauche à droite.
 */
export function Hero({ onStart }) {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 pt-5 sm:px-6 lg:px-10 lg:pt-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-butter">
        <div className="relative z-10 grid items-center gap-6 px-6 pb-4 pt-10 sm:px-10 lg:grid-cols-[1.15fr_1fr] lg:px-16 lg:pb-6 lg:pt-16">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-brand shadow-sm">
              <Timer className="h-4 w-4" /> Livré en 30 min à Antananarivo
            </p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.02] text-ink sm:text-6xl xl:text-7xl">
              Tes pâtes arc-en-ciel, livrées <span className="text-brand">en un bond.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base font-semibold text-slate-600 sm:text-lg">
              Pâtes aux légumes, goûters et boissons pour les petits gourmands. Maki les apporte jusqu'à ta porte.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <button onClick={onStart} className="btn-3d group inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-base font-bold text-white hover:bg-brand-deep">
                Découvrir la boutique
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </button>
              <p className="text-sm font-bold text-slate-500">MVola · Orange Money · Airtel Money · espèces</p>
            </div>
          </div>

          {/* Maki */}
          <div className="relative flex h-56 items-end justify-center sm:h-72 lg:h-96">
            <div className="absolute bottom-0 h-48 w-48 rounded-full bg-white/70 sm:h-64 sm:w-64 lg:h-80 lg:w-80" aria-hidden />
            <p className="absolute right-[12%] top-2 z-10 hidden rounded-2xl rounded-bl-sm bg-white px-4 py-2 text-base font-bold text-ink shadow-sm sm:block lg:right-[8%] lg:top-6">
              Salama ! Moi c'est Maki
            </p>
            <span className="hover-flip relative block cursor-pointer">
              <Maki title="Maki, la mascotte livreuse de MadaExpress" className="hop h-48 w-40 sm:h-64 sm:w-56 lg:h-80 lg:w-64" />
            </span>
          </div>
        </div>

        {/* Route de terre rouge : la charrette à zébu passe de gauche à droite */}
        <div className="relative h-24" aria-hidden>
          <Ravenala className="ink-outline sway hover-shake absolute -top-[4.5rem] left-[4%] h-24 cursor-pointer text-brand lg:left-auto lg:right-[12%]" />
          <Baobab className="ink-outline sway hover-shake absolute -top-16 right-[5%] hidden h-20 cursor-pointer text-bark sm:block" style={{ animationDelay: '-2s' }} />
          <div className="absolute inset-x-0 bottom-0 top-6 bg-[#d9654a]" />
          <div className="absolute inset-x-0 bottom-7 h-1.5 [background:repeating-linear-gradient(90deg,rgba(255,255,255,.7)_0_30px,transparent_30px_60px)]" />
          <div className="cross absolute bottom-7 left-0 z-10 cursor-pointer" style={{ animationDelay: '-9s' }}>
            <ZebuCart className="origin-bottom-left scale-[0.7] sm:scale-[0.85]" />
          </div>
        </div>
      </div>
    </section>
  );
}
