// Petits dessins à l'encre du « Carnet de Maki » : vagues, flèches, étoiles, soleil, tampons.
// Tous décoratifs (aria-hidden) ; la couleur suit currentColor sauf mention contraire.

const INK = '#1c1a17';

/** Bord ondulé pour raccorder deux aplats de couleur. `flip` le retourne (bord du bas). */
export function Wave({ className = '', flip = false }) {
  return (
    <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className={`block w-full ${flip ? 'rotate-180' : ''} ${className}`} aria-hidden="true">
      <path d="M0 40 L0 22 C100 2 200 2 300 20 S500 38 600 20 S800 2 900 20 S1100 38 1200 18 L1200 40 Z" fill="currentColor" />
      <path d="M0 22 C100 2 200 2 300 20 S500 38 600 20 S800 2 900 20 S1100 38 1200 18" fill="none" stroke={INK} strokeWidth="3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Flèche dessinée à main levée (pointe en bas à droite par défaut). */
export function Arrow({ className = '', style }) {
  return (
    <svg viewBox="0 0 90 70" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 10 C30 4 58 14 66 40 C68 48 68 54 66 60" />
      <path d="M54 50 L66 62 L78 48" />
    </svg>
  );
}

/** Étoile gribouillée. */
export function Star({ className = '', style }) {
  return (
    <svg viewBox="0 0 40 40" className={className} style={style} aria-hidden="true">
      <path d="M20 3 L24.5 15 L37 15.5 L27 23.5 L30.5 36 L20 28.5 L9.5 36 L13 23.5 L3 15.5 L15.5 15 Z" fill="currentColor" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

/** Petit éclat « ça brille » (trois traits). */
export function Sparkle({ className = '', style }) {
  return (
    <svg viewBox="0 0 40 40" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
      <path d="M20 4 L20 14 M6 14 L13 19 M34 14 L27 19" />
    </svg>
  );
}

/** Ressort / gribouillis en boucles. */
export function Squiggle({ className = '', style }) {
  return (
    <svg viewBox="0 0 120 30" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" aria-hidden="true">
      <path d="M4 18 C14 2 24 2 22 16 C20 28 34 28 38 14 C42 2 54 2 52 16 C50 28 64 28 68 14 C72 2 84 2 82 16 C80 28 94 28 98 14 C102 4 112 6 116 12" />
    </svg>
  );
}

/** Soleil à rayons, rempli de mangue. */
export function Sun({ className = '', style }) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true">
      {rays.map((a) => (
        <path key={a} d="M50 6 L50 18" transform={`rotate(${a} 50 50)`} stroke={INK} strokeWidth="4" strokeLinecap="round" />
      ))}
      <circle cx="50" cy="50" r="24" fill="#ffc93c" stroke={INK} strokeWidth="3.5" />
      <path d="M41 47 Q42 44 44 47 M56 47 Q57 44 59 47 M42 56 Q50 63 58 56" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Cœur dessiné. */
export function Heart({ className = '', style }) {
  return (
    <svg viewBox="0 0 40 36" className={className} style={style} aria-hidden="true">
      <path d="M20 33 C8 24 3 17 4 11 C5 4 14 2 20 10 C26 2 35 4 36 11 C37 17 32 24 20 33 Z" fill="currentColor" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Tampon rond avec texte en cercle, comme un cachet sur un colis.
 * `top` et `bottom` sont écrits le long du cercle ; `children` au centre.
 */
export function Stamp({ top, bottom, children, className = '', color = '#ee3e4f' }) {
  const id = `stamp-${top}-${bottom}`.replace(/[^a-z0-9-]/gi, '');
  return (
    <div className={`grid aspect-square place-items-center rounded-full ${className}`} style={{ color }} aria-hidden="true">
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
        <defs>
          <path id={`${id}-t`} d="M20 60 A40 40 0 0 1 100 60" />
          <path id={`${id}-b`} d="M11 60 A49 49 0 0 0 109 60" />
        </defs>
        <circle cx="60" cy="60" r="56" fill="#fdf3e1" stroke="currentColor" strokeWidth="3.5" />
        <circle cx="60" cy="60" r="51.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
        <text fill="currentColor" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="13" letterSpacing="1.5">
          <textPath href={`#${id}-t`} startOffset="50%" textAnchor="middle">{top}</textPath>
        </text>
        <text fill="currentColor" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="13" letterSpacing="1.5">
          <textPath href={`#${id}-b`} startOffset="50%" textAnchor="middle">{bottom}</textPath>
        </text>
      </svg>
      <span className="relative">{children}</span>
    </div>
  );
}

/** Ruban-étiquette (cartouche) avec texte, comme une bannière de fête. */
export function Ribbon({ children, className = '', color = '#ee3e4f' }) {
  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <svg viewBox="0 0 300 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <path d="M22 14 L0 14 L12 32 L0 50 L34 50 Z" fill={color} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d="M278 14 L300 14 L288 32 L300 50 L266 50 Z" fill={color} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d="M22 6 L278 6 L278 44 L22 44 Z" fill={color} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="relative -mt-[0.35em] px-[1.6em] py-[0.5em]">{children}</span>
    </span>
  );
}

/** Avion en papier. */
export function PaperPlane({ className = '', style }) {
  return (
    <svg viewBox="0 0 64 48" className={className} style={style} aria-hidden="true">
      <path d="M2 22 L62 2 L40 46 L30 30 Z" fill="#fff" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M62 2 L30 30 L28 42 L36 34" fill="#e8f4fb" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

/** Bord en zigzag (dents de scie) pour finir un aplat. */
export function Zigzag({ className = '' }) {
  return (
    <svg viewBox="0 0 120 12" preserveAspectRatio="none" className={`block w-full ${className}`} aria-hidden="true">
      <path d="M0 0 L0 6 L5 12 L10 6 L15 12 L20 6 L25 12 L30 6 L35 12 L40 6 L45 12 L50 6 L55 12 L60 6 L65 12 L70 6 L75 12 L80 6 L85 12 L90 6 L95 12 L100 6 L105 12 L110 6 L115 12 L120 6 L120 0 Z" fill="currentColor" />
      <path d="M0 6 L5 12 L10 6 L15 12 L20 6 L25 12 L30 6 L35 12 L40 6 L45 12 L50 6 L55 12 L60 6 L65 12 L70 6 L75 12 L80 6 L85 12 L90 6 L95 12 L100 6 L105 12 L110 6 L115 12 L120 6" fill="none" stroke={INK} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
