import { makiSvg } from './maki.js';

/**
 * La mascotte. Le SVG est un contenu statique du projet (aucune donnée utilisateur),
 * d'où l'injection directe, partagée avec le marqueur de carte.
 */
export function Maki({ headOnly = false, title, className = '' }) {
  return <span className={`inline-block ${className}`} dangerouslySetInnerHTML={{ __html: makiSvg({ headOnly, title }) }} />;
}

/** Silhouette de baobab (couleur = currentColor). */
export function Baobab({ className = '', style }) {
  return (
    <svg viewBox="0 0 80 110" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d="M30 110 C33 88 30 62 33 44 L47 44 C50 62 47 88 50 110 Z" />
      <path d="M34 46 C28 34 20 30 10 30 M38 45 C36 30 30 22 24 14 M42 45 C44 30 50 22 56 14 M46 46 C52 34 60 30 70 30" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
      <ellipse cx="10" cy="28" rx="11" ry="6" /><ellipse cx="24" cy="13" rx="10" ry="6" />
      <ellipse cx="56" cy="13" rx="10" ry="6" /><ellipse cx="70" cy="28" rx="11" ry="6" /><ellipse cx="40" cy="20" rx="9" ry="6" />
    </svg>
  );
}

// Feuilles du ravinala : un éventail plat de longues feuilles en pagaie, de -78° à +78°.
const RAVENALA_ANGLES = [-78, -62, -46, -31, -16, 0, 16, 31, 46, 62, 78];

/** Arbre du voyageur (ravinala), emblème de Madagascar (couleur = currentColor). */
export function Ravenala({ className = '', style }) {
  return (
    <svg viewBox="0 0 120 130" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d="M56 130 C57 110 57 90 57 66 L63 66 C63 90 63 110 64 130 Z" />
      {RAVENALA_ANGLES.map((a) => (
        <g key={a} transform={`rotate(${a} 60 64)`}>
          <path d="M59 64 L59 34 L61 34 L61 64 Z" />
          <path d="M60 36 C52 30 51 10 60 2 C69 10 68 30 60 36 Z" />
        </g>
      ))}
      <path d="M48 70 C52 62 68 62 72 70 C66 66 54 66 48 70 Z" />
    </svg>
  );
}

/** Zébu, le bœuf à bosse malgache (couleur = currentColor). */
export function Zebu({ className = '', style }) {
  return (
    <svg viewBox="0 0 120 80" className={className} style={style} fill="currentColor" aria-hidden="true">
      {/* corps, bosse, fanon */}
      <path d="M20 30 C26 24 38 24 44 22 C46 12 56 10 60 20 C70 22 86 22 92 26 C96 30 96 44 92 50 L28 52 C22 48 18 38 20 30 Z" />
      <path d="M86 30 C90 36 92 48 88 58 C84 50 82 40 86 30 Z" />
      {/* pattes */}
      <path d="M30 48 L28 76 L34 76 L37 50 Z M44 50 L44 76 L50 76 L50 50 Z M74 50 L76 76 L82 76 L80 50 Z M86 48 L90 76 L96 76 L92 46 Z" />
      {/* tête et cornes en lyre */}
      <path d="M90 26 C96 22 104 24 108 30 L112 42 C110 46 104 46 102 42 L96 36 Z" />
      <path d="M98 26 C94 16 96 6 102 2 C100 10 101 18 104 24 Z M104 26 C110 18 116 14 120 14 C114 18 110 24 108 30 Z" />
      {/* queue */}
      <path d="M21 32 C14 38 12 50 14 60 L18 60 C16 50 18 40 24 34 Z" />
    </svg>
  );
}

/** Caméléon à la queue enroulée (couleur = currentColor). */
export function Chameleon({ className = '', style }) {
  return (
    <svg viewBox="0 0 120 70" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d="M92 30 C88 16 70 10 54 12 C38 14 30 22 28 32 C26 42 34 48 46 48 L84 46 C96 44 104 40 112 34 L118 30 C112 24 102 24 92 30 Z" />
      <path d="M30 34 C18 34 8 42 10 54 C12 64 26 64 28 56 C30 50 24 46 20 50 C18 53 21 56 23 54" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M44 46 L38 62 L46 62 L52 46 Z M76 46 L72 62 L80 62 L84 46 Z" />
      <path d="M50 13 L56 6 L60 12 L66 6 L70 13 L76 8 L78 15 Z" />
      <circle cx="102" cy="30" r="4" fill="#fff" />
      <circle cx="103" cy="30" r="2" />
    </svg>
  );
}

/** Pirogue à voile (lakana) des Vezo, sur le lagon (couleur = currentColor). */
export function Lakana({ className = '', style }) {
  return (
    <svg viewBox="0 0 100 90" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d="M48 6 L48 66 L52 66 L52 6 Z" />
      <path d="M50 8 C66 20 78 40 84 62 L54 62 Z" />
      <path d="M46 14 C36 28 28 44 24 60 L46 60 Z" opacity="0.8" />
      <path d="M8 68 L92 68 C88 78 78 82 50 82 C22 82 12 78 8 68 Z" />
      <path d="M14 74 L4 74 L4 77 L14 77 Z" />
    </svg>
  );
}

/** Roue de charrette à rayons (tourne avec la classe « wheel-spin »). */
function Wheel({ cx, cy }) {
  return (
    <g className="wheel-spin">
      <circle cx={cx} cy={cy} r="17" fill="#b07a45" stroke="#1c1a17" strokeWidth="3" />
      <circle cx={cx} cy={cy} r="11" fill="none" stroke="#1c1a17" strokeWidth="2" />
      {[0, 45, 90, 135].map((a) => (
        <path key={a} d={`M${cx - 17} ${cy} L${cx + 17} ${cy}`} transform={`rotate(${a} ${cx} ${cy})`} stroke="#1c1a17" strokeWidth="2.5" />
      ))}
      <circle cx={cx} cy={cy} r="4" fill="#1c1a17" />
    </g>
  );
}

/**
 * Charrette à zébu (sarety) conduite par Maki, qui roule vers la droite : la livraison à la malgache.
 * Les roues tournent ; à animer avec un déplacement horizontal.
 */
export function ZebuCart({ className = '' }) {
  return (
    <span className={`relative inline-flex items-end ${className}`} aria-hidden="true">
      <span className="relative block w-[150px]">
        <span className="absolute bottom-[58px] left-[46px] block h-[58px] w-[64px]"><Maki headOnly className="h-full w-full" /></span>
        <svg viewBox="0 0 150 90" className="relative block w-full overflow-visible">
          {/* colis dans la charrette */}
          <rect x="14" y="20" width="30" height="24" rx="3" fill="#d9a46a" stroke="#1c1a17" strokeWidth="2.5" />
          <path d="M29 20 L29 44" stroke="#1c1a17" strokeWidth="2" />
          {/* caisse en bois */}
          <path d="M6 40 L118 40 L112 66 L12 66 Z" fill="#c8874b" stroke="#1c1a17" strokeWidth="3" strokeLinejoin="round" />
          <path d="M12 52 L115 52" stroke="#1c1a17" strokeWidth="2" />
          {/* timon vers le zébu */}
          <path d="M112 56 L150 50" stroke="#1c1a17" strokeWidth="4" strokeLinecap="round" />
          <Wheel cx={36} cy={70} />
          <Wheel cx={88} cy={70} />
        </svg>
      </span>
      <Zebu className="ink-outline walk -ml-1 mb-1 block h-[64px] text-[#f6ead2]" />
    </span>
  );
}
