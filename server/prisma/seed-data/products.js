// Catalogue de la boutique. Les rayons affichés sont déduits du champ `category` de chaque produit,
// dans l'ordre de ce fichier : ajouter un produit d'une nouvelle catégorie suffit à créer le rayon.
//
// Alimentation : pâtes aux légumes « Mama » (Vita Malagasy), sachets de 275 g.
// Les prix et les stocks sont des valeurs provisoires à remplacer par les vrais.
// Les photos sont dans public/products/.

const FLAVORS = {
  haricot: {
    slug: 'haricot-vert-poivron', label: 'Haricot vert & Poivron', color: 'Vert', tint: 'from-lime-100 to-green-200',
    text: 'Des pâtes vertes au haricot vert et au poivron, au goût végétal et légèrement poivré.',
    tags: ['vert', 'haricot', 'poivron'],
  },
  potiron: {
    slug: 'potiron-carotte', label: 'Potiron & Carotte', color: 'Jaune orangé', tint: 'from-amber-100 to-orange-200',
    text: 'Des pâtes dorées au potiron et à la carotte, douces et légèrement sucrées : les enfants les adorent.',
    tags: ['orange', 'jaune', 'potiron', 'carotte', 'citrouille'],
  },
  chou: {
    slug: 'chou-rouge', label: 'Chou rouge', color: 'Violet', tint: 'from-purple-100 to-fuchsia-200',
    text: 'Des pâtes violettes au chou rouge, à la saveur douce et à la couleur qui change des pâtes ordinaires.',
    tags: ['violet', 'chou', 'chou rouge'],
  },
  betterave: {
    slug: 'betterave-tomate', label: 'Betterave & Tomate', color: 'Rose-rouge', tint: 'from-rose-100 to-pink-200',
    text: 'Des pâtes rose-rouge à la betterave et à la tomate, à la fois douces et légèrement acidulées.',
    tags: ['rouge', 'rose', 'betterave', 'tomate'],
  },
  ail: {
    slug: 'ail-chou-fleur', label: 'Ail & Chou-fleur', color: 'Blanc crème', tint: 'from-stone-100 to-amber-100',
    text: 'Des pâtes claires à l’ail et au chou-fleur, parfumées, parfaites avec une simple noix de beurre.',
    tags: ['blanc', 'ail', 'chou-fleur', 'chou fleur'],
  },
  multi: {
    slug: 'multi-legumes', label: 'Multi-légumes', color: 'Multicolore', tint: 'from-yellow-100 to-rose-200',
    text: 'Toutes les couleurs dans le même sachet : un mélange de pâtes aux différents légumes de la gamme.',
    tags: ['multicolore', 'mélange', 'assortiment', 'tricolore'],
  },
};

const SHAPES = {
  macaroni: { category: 'Macaroni', label: 'Coquille de macaroni', hint: 'Petits tubes coudés qui retiennent bien la sauce, parfaits aussi en gratin.', tags: ['coude', 'coquille'] },
  fusilli: { category: 'Fusilli', label: 'Fusilli', hint: 'Des torsades qui accrochent la sauce, idéales aussi en salade.', tags: ['torsade', 'spirale'] },
  radiatori: { category: 'Radiatori', label: 'Radiatori', hint: 'Une forme ondulée et généreuse, qui tient bien les sauces épaisses.', tags: ['macaroni radiatori'] },
  coquillette: { category: 'Coquillette', label: 'Coquillette', hint: 'Petites pâtes vite cuites, idéales en soupe ou pour les enfants.', tags: ['soupe'] },
};

// [forme, saveur, prix, stock, badge]
const RANGE = [
  ['macaroni', 'multi', 6_500, 60, 'Best-seller'],
  ['fusilli', 'multi', 6_500, 48],
  ['radiatori', 'multi', 7_000, 30],
  ['coquillette', 'multi', 6_500, 36],
  ['macaroni', 'haricot', 6_000, 40],
  ['macaroni', 'potiron', 6_000, 40],
  ['macaroni', 'chou', 6_000, 24],
  ['macaroni', 'betterave', 6_000, 40],
  ['macaroni', 'ail', 6_000, 32],
  ['fusilli', 'betterave', 6_000, 20],
  ['fusilli', 'haricot', 6_000, 20],
  ['fusilli', 'potiron', 6_000, 20],
  ['fusilli', 'ail', 6_000, 20],
];

const PASTA = RANGE.map(([shapeKey, flavorKey, price, stock, badge]) => {
  const shape = SHAPES[shapeKey];
  const flavor = FLAVORS[flavorKey];
  const id = `${shapeKey}-${flavor.slug}`;
  return {
    id,
    name: `${shape.label} ${flavor.label} – 275 g`,
    category: 'Alimentation',
    price,
    rating: 0,
    reviews: 0,
    stock,
    emoji: '🍝',
    tint: flavor.tint,
    image: `/products/${id}.jpg`,
    badge,
    description: `${flavor.text} ${shape.hint} Fabriquées à Madagascar avec 30 % de légumes, 100 % naturelles.`,
    specs: {
      Marque: 'Mama – Vita Malagasy',
      Forme: shape.label,
      Légumes: flavor.label,
      'Teneur en légumes': '30 %',
      Couleur: `${flavor.color} (100 % naturel)`,
      'Poids net': '275 g',
      Origine: 'Madagascar',
    },
    tags: ['pates', 'pâtes', 'legumes', 'mama', shape.category, ...shape.tags, ...flavor.tags],
  };
});

// EXEMPLES pour les autres rayons (univers enfant) : articles, prix et stocks fictifs, sans photo.
// À remplacer par le vrai catalogue (ajouter `image: '/products/xxx.jpg'` pour une photo).
const example = (id, category, name, price, stock, emoji, tint, description, specs, tags, badge) => ({
  id, category, name, price, stock, emoji, tint, description, specs, tags, badge, rating: 0, reviews: 0,
});
const SNACK = 'from-amber-100 to-orange-200';
const DRINK = 'from-sky-100 to-cyan-200';
const KIDS = 'from-pink-100 to-fuchsia-200';

const EXAMPLES = [
  example('gouter-biscuits-chocolat', 'Goûters', 'Biscuits fourrés au chocolat – 150 g', 4_500, 80, '🍪', SNACK,
    'Des biscuits croquants au cœur fondant au chocolat, parfaits pour le goûter ou le cartable.',
    { 'Poids net': '150 g', Parfum: 'Chocolat' }, ['biscuit', 'chocolat', 'gouter', 'cartable'], 'Nouveau'),
  example('gouter-madeleines', 'Goûters', 'Petites madeleines – sachet de 10', 6_000, 50, '🧁', SNACK,
    'Des madeleines moelleuses emballées une par une, faciles à glisser dans le sac.',
    { Quantité: '10 madeleines', Conditionnement: 'Emballage individuel' }, ['madeleine', 'gateau', 'gouter']),
  example('gouter-compote-gourde', 'Goûters', 'Compotes à boire pomme-banane – 4 gourdes', 8_000, 40, '🍎', SNACK,
    'Des gourdes de compote sans sucres ajoutés, à emporter partout.',
    { Quantité: '4 × 90 g', Fruits: 'Pomme, banane', 'Sucres ajoutés': 'Aucun' }, ['compote', 'fruit', 'gourde', 'pomme', 'banane']),
  example('gouter-cereales', 'Goûters', 'Céréales choco pour le petit-déjeuner – 375 g', 12_000, 30, '🥣', SNACK,
    'Des céréales croustillantes au chocolat pour bien démarrer la journée.',
    { 'Poids net': '375 g', Parfum: 'Chocolat' }, ['cereales', 'petit dejeuner', 'chocolat']),

  example('boisson-jus-orange', 'Boissons', 'Jus d’orange – 1 L', 7_500, 60, '🧃', DRINK,
    'Un jus d’orange doux et vitaminé, à servir bien frais.',
    { Volume: '1 L', Fruit: 'Orange' }, ['jus', 'orange', 'vitamine']),
  example('boisson-briquettes-fruits', 'Boissons', 'Briquettes de jus multifruits – lot de 6', 9_000, 45, '🧃', DRINK,
    'Des petites briquettes avec paille, idéales pour le goûter et les sorties.',
    { Quantité: '6 × 20 cl', Parfum: 'Multifruits' }, ['jus', 'briquette', 'paille', 'gouter'], 'Best-seller'),
  example('boisson-lait-chocolat', 'Boissons', 'Lait au chocolat – 6 × 20 cl', 10_500, 35, '🥛', DRINK,
    'Un lait chocolaté onctueux à boire frais, riche en calcium.',
    { Quantité: '6 × 20 cl', Parfum: 'Chocolat' }, ['lait', 'chocolat', 'calcium']),
  example('boisson-eau-petite', 'Boissons', 'Petites bouteilles d’eau – lot de 6', 6_000, 70, '💧', DRINK,
    'Des bouteilles de 33 cl à la bonne taille pour les petites mains.',
    { Quantité: '6 × 33 cl' }, ['eau', 'bouteille', 'cartable']),

  example('enfant-couches-t4', 'Enfants', 'Couches bébé taille 4 – paquet de 30', 38_000, 25, '👶', KIDS,
    'Des couches douces et absorbantes pour des nuits tranquilles.',
    { Taille: '4 (9 – 14 kg)', Quantité: '30 couches' }, ['couche', 'bebe', 'change']),
  example('enfant-lingettes', 'Enfants', 'Lingettes bébé douces – 72 pièces', 9_500, 50, '🧻', KIDS,
    'Des lingettes sans parfum pour les peaux délicates, pour le change et les petites mains.',
    { Quantité: '72 lingettes', Parfum: 'Sans parfum' }, ['lingette', 'bebe', 'toilette']),
  example('enfant-dentifrice', 'Enfants', 'Dentifrice enfant goût fraise – 50 ml', 5_500, 40, '🪥', KIDS,
    'Un dentifrice doux au goût fraise qui donne envie de se brosser les dents.',
    { Volume: '50 ml', Âge: 'Dès 3 ans', Goût: 'Fraise' }, ['dentifrice', 'dents', 'fraise']),
  example('enfant-gel-douche', 'Enfants', 'Gel douche & shampoing enfant – 250 ml', 11_000, 30, '🫧', KIDS,
    'Un 2-en-1 qui ne pique pas les yeux, pour un bain tout en bulles.',
    { Volume: '250 ml', Usage: 'Corps et cheveux' }, ['shampoing', 'bain', 'douche']),
];

export const PRODUCTS = [...PASTA, ...EXAMPLES];
