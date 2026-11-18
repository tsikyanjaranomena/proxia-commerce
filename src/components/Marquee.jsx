import { Baobab, Ravenala } from './brand/Maki.jsx';
import { Star } from './brand/Doodles.jsx';

const DEFAULT_ITEMS = [
  'Nouveau : les pâtes arc-en-ciel',
  'Livré en 30 min à Tana',
  'Salama !',
  'MVola · Orange Money · Airtel Money',
  'Mazotoa homana !',
  'Retrait gratuit à Ankorondrano',
];

// Séparateurs qui alternent : étoile, ravinala, baobab.
const SEPARATORS = [
  <Star key="s" className="h-7 w-7 shrink-0 text-sun" />,
  <Ravenala key="r" className="ink-outline h-9 shrink-0 text-emerald-300" />,
  <Star key="s2" className="h-7 w-7 shrink-0 text-white" />,
  <Baobab key="b" className="ink-outline h-9 shrink-0 text-[#c8874b]" />,
];

/**
 * Bandeau qui défile en continu (de gauche à droite par défaut, `reverse` pour l'autre sens).
 * Le contenu est rendu deux fois pour boucler sans saut ; il se met en pause au survol.
 */
export function Marquee({ items = DEFAULT_ITEMS, reverse = false, className = 'bg-litchi text-white', speed = '38s' }) {
  const run = (copy) => (
    <ul className="flex shrink-0 items-center" aria-hidden={copy > 0 || undefined}>
      {/* Liste répétée deux fois par passage : assez large pour couvrir les très grands écrans */}
      {[...items, ...items].map((text, i) => (
        <li key={i} className="flex items-center">
          <span className="font-display whitespace-nowrap px-6 text-2xl font-bold uppercase tracking-wide sm:text-3xl">{text}</span>
          {SEPARATORS[i % SEPARATORS.length]}
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`marquee relative overflow-hidden border-y-[2.5px] border-ink py-3 ${className}`}>
      <div className={`marquee-track ${reverse ? 'is-reverse' : ''}`} style={{ '--marquee-speed': speed }}>
        {run(0)}
        {run(1)}
      </div>
    </div>
  );
}
