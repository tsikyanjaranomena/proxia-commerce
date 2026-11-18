// Maki, la mascotte de MadaExpress : un maki catta (lémurien de Madagascar) livreur, casquette orange
// et colis dans les bras. Une seule source SVG, utilisée par le composant React <Maki /> et par le
// marqueur Leaflet du livreur (qui attend une chaîne HTML).

const FUR = '#9ba1a8';
const FUR_DARK = '#6d737b';
const CREAM = '#f6f2ea';
const INK = '#23282c';
const EYE = '#ffb21a';
const CAP = '#ff7a1a';
const CAP_DARK = '#e2600a';
const GREEN = '#0e7a4d';

const head = `
  <g class="maki-ears">
    <path d="M44 66 L28 34 L60 52 Z" fill="${FUR}"/><path d="M45 60 L35 41 L54 53 Z" fill="${INK}" opacity=".55"/>
    <path d="M106 66 L122 34 L90 52 Z" fill="${FUR}"/><path d="M105 60 L115 41 L96 53 Z" fill="${INK}" opacity=".55"/>
  </g>
  <ellipse cx="75" cy="82" rx="42" ry="37" fill="${FUR}"/>
  <path d="M75 62 C52 60 38 74 40 90 C42 106 58 116 75 118 C92 116 108 106 110 90 C112 74 98 60 75 62 Z" fill="${CREAM}"/>
  <ellipse cx="59" cy="86" rx="12.5" ry="14" transform="rotate(-18 59 86)" fill="${INK}"/>
  <ellipse cx="91" cy="86" rx="12.5" ry="14" transform="rotate(18 91 86)" fill="${INK}"/>
  <circle cx="60" cy="86" r="8.5" fill="${EYE}"/><circle cx="90" cy="86" r="8.5" fill="${EYE}"/>
  <circle cx="61" cy="87" r="4.6" fill="${INK}"/><circle cx="89" cy="87" r="4.6" fill="${INK}"/>
  <circle cx="63.2" cy="84.2" r="2" fill="#fff"/><circle cx="91.2" cy="84.2" r="2" fill="#fff"/>
  <path d="M66 99 C70 95 80 95 84 99 C83 107 78 112 75 112 C72 112 67 107 66 99 Z" fill="${INK}"/>
  <ellipse cx="75" cy="99.5" rx="4.5" ry="2.6" fill="#454b50"/>
  <path d="M70 106.5 Q75 110.5 80 106.5" fill="none" stroke="${CREAM}" stroke-width="1.8" stroke-linecap="round"/>
  <circle cx="49" cy="101" r="5" fill="#ff8fa3" opacity=".45"/><circle cx="101" cy="101" r="5" fill="#ff8fa3" opacity=".45"/>
  <path d="M41 64 C44 38 106 38 109 64 C96 58 54 58 41 64 Z" fill="${CAP}"/>
  <path d="M95 60 C110 56 128 58 131 65 C118 69 102 68 93 65 Z" fill="${CAP_DARK}"/>
  <circle cx="75" cy="50" r="7.5" fill="#fff"/>
  <path d="M76.5 44.5 L71.5 51 L75 51 L73.5 55.5 L78.5 49 L75 49 Z" fill="${GREEN}"/>`;

const body = `
  <path class="maki-tail" d="M108 168 C150 168 160 124 150 94 C142 66 118 62 115 82" fill="none" stroke="${CREAM}" stroke-width="15" stroke-linecap="round"/>
  <path class="maki-tail" d="M108 168 C150 168 160 124 150 94 C142 66 118 62 115 82" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="butt" stroke-dasharray="10 9"/>
  <ellipse cx="57" cy="190" rx="13" ry="7" fill="${FUR_DARK}"/><ellipse cx="93" cy="190" rx="13" ry="7" fill="${FUR_DARK}"/>
  <ellipse cx="75" cy="152" rx="37" ry="38" fill="${FUR}"/>
  <ellipse cx="75" cy="160" rx="23" ry="26" fill="${CREAM}"/>
  <rect x="50" y="140" width="50" height="36" rx="5" fill="#d39556"/>
  <rect x="50" y="140" width="50" height="9" rx="4" fill="#e7b27a"/>
  <rect x="71" y="140" width="8" height="36" fill="#f2d3a8" opacity=".8"/>
  <rect x="56" y="156" width="13" height="10" rx="2" fill="#fff"/><rect x="58.5" y="159" width="8" height="1.8" fill="${GREEN}"/><rect x="58.5" y="162" width="5" height="1.8" fill="${GREEN}"/>
  <circle cx="51" cy="153" r="8" fill="${FUR_DARK}"/><circle cx="99" cy="153" r="8" fill="${FUR_DARK}"/>`;

/** SVG de Maki. `headOnly` : seulement la tête (logo, marqueur de carte). */
export function makiSvg({ headOnly = false, title } = {}) {
  const viewBox = headOnly ? '26 30 108 92' : '20 30 145 170';
  const a11y = title ? `role="img" aria-label="${title}"` : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ${a11y} style="display:block;width:100%;height:100%;overflow:visible">${headOnly ? '' : body}${head}</svg>`;
}
