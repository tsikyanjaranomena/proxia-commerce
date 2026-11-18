import { Baobab, Chameleon, Maki, Ravenala, Zebu } from './brand/Maki.jsx';
import { Sparkle } from './brand/Doodles.jsx';

// « Le savais-tu ? » : de petites anecdotes sur Madagascar, à lire avec les enfants.
const FACTS = [
  {
    title: "L'arbre du voyageur",
    text: "Le ravinala garde l'eau de pluie au creux de ses feuilles : de quoi désaltérer un voyageur !",
    art: <Ravenala className="ink-outline sway h-24 text-brand" />,
    tone: 'bg-mint',
  },
  {
    title: 'Le maki catta',
    text: 'Le matin, il se chauffe au soleil, bras grands ouverts. Les lémuriens ne vivent qu’à Madagascar.',
    art: <Maki headOnly className="h-20 w-24" />,
    tone: 'bg-butter',
  },
  {
    title: 'Les caméléons',
    text: 'Environ la moitié des caméléons du monde vivent à Madagascar. Certains sont plus petits qu’un ongle !',
    art: <Chameleon className="ink-outline h-14 text-lagoon" />,
    tone: 'bg-sky',
  },
  {
    title: 'Les baobabs',
    text: 'Six des huit espèces de baobabs ne poussent nulle part ailleurs. On les appelle « reniala », la mère de la forêt.',
    art: <Baobab className="ink-outline h-24 text-bark" />,
    tone: 'bg-peach',
  },
  {
    title: "L'île rouge",
    text: 'La terre de Madagascar est rouge comme une brique : on la surnomme « l’île rouge ».',
    art: (
      <svg viewBox="0 0 64 120" className="ink-outline h-24 text-[#d0563a]" fill="currentColor" aria-hidden="true">
        <path d="M47 3 C51 9 52 19 55 29 C58 43 55 57 51 70 C47 84 40 98 32 110 C27 117 18 119 14 112 C10 104 10 94 12 84 C14 72 12 62 16 52 C20 42 27 36 31 28 C35 19 41 9 47 3 Z" />
      </svg>
    ),
    tone: 'bg-blush',
  },
  {
    title: 'Le zébu',
    text: 'Sa grosse bosse est une réserve pour les jours difficiles. Il tire les charrettes dans les rizières.',
    art: <Zebu className="ink-outline walk h-16 text-[#f6ead2]" />,
    tone: 'bg-butter',
  },
];

export function MadaFacts() {
  return (
    <section aria-labelledby="mada-facts" className="pt-2">
      <div className="mb-5 text-center">
        <p className="font-hand text-2xl text-litchi">Fantatrao ve ?</p>
        <h2 id="mada-facts" className="relative inline-block text-[2.2rem] font-bold leading-none text-ink sm:text-5xl">
          Le savais-tu ?
          <Sparkle className="twinkle absolute -right-9 -top-5 h-8 w-8 text-sun" />
        </h2>
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 pt-1 reveal sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 2xl:grid-cols-6">
        {FACTS.map(({ title, text, art, tone }, i) => (
          <li key={title} className={`group ink-card tilt-hover flex w-64 cursor-default shrink-0 snap-center flex-col rounded-[1.75rem] ${tone} p-4 lg:w-auto ${i % 2 ? 'lg:rotate-1' : 'lg:-rotate-1'}`}>
            <div className="group-jump grid h-28 place-items-end justify-center transition duration-300 group-hover:scale-110">{art}</div>
            <h3 className="font-display mt-3 text-xl font-bold leading-tight text-ink">{title}</h3>
            <p className="mt-1 text-sm font-semibold leading-snug text-slate-700">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
