/**
 * Brand focus merchandising:
 * - Kerastase: one universal product in main bento (100% of combos)
 * - L'Oreal Professionnel: optional focus routine (~30% at quiz start)
 */

export const FOCUS_BRAND_WEIGHTS = [
  { brand: 'Kerastase', weight: 0.7 },
  { brand: "L'Oreal Professionnel", weight: 0.3 },
];

/** Main bento cards that stay on default brands even during Kerastase focus */
export const KERASTASE_MAIN_BENTO_SLOTS = new Set([
  'shampoo_fm',
  'shampoo_coarse',
  'leave_in',
  'oil_fm',
  'oil_coarse',
]);

/** Single Kerastase pick shown in main product bento for every routine */
export const UNIVERSAL_KERASTASE_MAIN = {
  key: 'kerastase_main',
  brand: 'Kerastase',
  title: 'Elixir Ultime Hair Oil-In-Serum',
  handle: 'kerastase-elixir-ultime-hair-oil-in-serum-30ml',
  price: 'Rs. 2,700',
  image:
    '/images/products/lookskart/all/kerastase/kerastase-elixir-ultime-hair-oil-in-serum-30ml.webp',
  note: 'A lightweight hair serum for shine, softness, and protection on mids and ends.',
};

/** Default primaries (current live results.html picks) */
export const DEFAULT_PRODUCTS = {
  shampoo_fm: {
    key: 'sc',
    brand: 'Biotop',
    title: 'Biotop 911 Quinoa Shampoo',
    handle: 'biotop-911-quinoa-shampoo-330ml',
    price: 'Rs. 2,070',
    image: '/images/products/lookskart/biotop-911-quinoa-shampoo.jpg',
  },
  shampoo_coarse: {
    key: 'scc',
    brand: 'Brasil Cacau',
    title: 'Brasil Cacau Extreme Repair Shampoo',
    handle: 'brasil-cacau-extreme-repair-shampoo-for-damaged-hair-300ml',
    price: 'Rs. 1,646',
    image: '/images/products/lookskart/brasil-cacau-extreme-repair-shampoo.jpg',
  },
  conditioner_fm: {
    brand: 'Biotop',
    title: 'Biotop 911 Quinoa Conditioner',
    handle: 'biotop-911-quinoa-conditioner-330ml',
    image: '/images/products/lookskart/biotop-911-quinoa-conditioner.jpg',
  },
  conditioner_coarse: {
    brand: 'Brasil Cacau',
    title: 'Brasil Cacau Extreme Repair Conditioner',
    handle: 'brasil-cacau-extreme-repair-conditioner-for-damaged-hair-300ml',
    image: '/images/products/lookskart/brasil-cacau-extreme-repair-conditioner.jpg',
  },
  leave_in: {
    key: 'li',
    brand: 'K18',
    title: 'K-18 Leave-in Molecular Repair Mask',
    handle: 'k-18-leave-in-molecular-repair-hair-mask-50ml',
    price: 'Rs. 5,625',
    image: '/images/products/lookskart/k18-leave-in-mask-50ml.jpg',
  },
  oil_fm: {
    key: 'oil',
    brand: 'Moroccanoil',
    title: 'Moroccanoil Treatment Light',
    handle: 'moroccanoil-moroccanoil-treatment-light-100ml-for-fine-or-light-coloured-hair',
    price: 'Rs. 4,320',
    image: '/images/products/lookskart/moroccanoil-treatment-light.jpg',
  },
  oil_coarse: {
    key: 'moroil',
    brand: 'Moroccanoil',
    title: 'Moroccanoil Treatment Original',
    handle: 'moroccanoil-moroccanoil-treatment-original-100ml-for-all-hair-types',
    price: 'Rs. 4,320',
    image: '/images/products/lookskart/moroccanoil-treatment-original.jpg',
  },
  heat_blow_fm: {
    key: 'bdc',
    brand: 'Kerastase',
    title: 'Nectar Thermique Blow Dry Primer',
    handle: 'kerastase-nutritive-nectar-thermique-blow-dry-primer-150ml',
    price: 'Rs. 2,800',
    image: '/images/products/lookskart/kerastase-nectar-thermique.webp',
  },
  heat_blow_coarse: {
    key: 'rebel',
    brand: 'Kerastase',
    title: 'Gloss Absolu Heat Protectant Spray',
    handle: 'kerastase-gloss-absolu-anti-frizz-heat-protectant-spray-190ml',
    price: 'Rs. 3,000',
    image: '/images/products/lookskart/kerastase-gloss-absolu-heat-protectant.webp',
  },
  heat_iron: {
    key: 'thermal',
    brand: 'Kerastase',
    title: 'Genesis Défense Thermique',
    handle: 'kerastase-genesis-di©fense-thermique-blow-dry-primer-150ml',
    price: 'Rs. 3,000',
    image:
      '/images/products/lookskart/all/kerastase/kerastase-genesis-di©fense-thermique-blow-dry-primer-150ml.jpg',
  },
  volume: {
    key: 'volume',
    brand: 'Moroccanoil',
    title: 'Root Boost',
    handle: 'moroccanoil-root-boost-for-fine-to-medium-hair-250ml',
    price: 'Rs. 3,150',
    image: '/images/products/lookskart/moroccanoil-root-boost.jpg',
  },
  dry_texture: {
    key: 'dryshampoo',
    brand: 'Kerastase',
    title: 'Fresh Affair Dry Shampoo',
    handle: 'fresh-affair-dry-shampoo',
    price: 'Rs. 2,759',
    image: '/images/products/lookskart/all/kerastase/fresh-affair-dry-shampoo.webp',
  },
  hairspray: {
    key: 'hairspray',
    brand: 'Moroccanoil',
    title: 'Luminous Hairspray Strong',
    handle: 'moroccanoil-luminous-hairspray-strong-330ml',
    price: 'Rs. 3,340',
    image: '/images/products/lookskart/moroccanoil-luminous-hairspray.jpg',
  },
  repair: {
    key: 'repair',
    brand: 'pH Plex',
    title: 'Step 3 Bond Repair',
    handle: 'ph-plex-step-3-150ml',
    price: 'Rs. 3,950',
    image: '/images/products/lookskart/ph-plex-step-3.webp',
  },
  mask: {
    key: 'mask',
    brand: 'Kerastase',
    title: 'Nutritive Masquintense Riche Mask',
    handle: 'kerastase-nutritive-masquintense-epais-mask-200ml-highly-nourishing-mask',
    price: 'Rs. 3,850',
    image:
      '/images/products/lookskart/all/kerastase/kerastase-nutritive-masquintense-epais-mask-200ml-highly-nourishing-mask.jpg',
  },
};

/** Focus-brand overrides per slot */
export const FOCUS_PRODUCTS = {
  Kerastase: {
    shampoo_fm: {
      brand: 'Kerastase',
      title: 'Nutritive Bain Satin Riche Shampoo',
      handle: 'kerastase-nutritive-bain-satin-shampoo-250ml-nourishing-for-dry-to-very-dry-hair',
      price: 'Rs. 2,625',
      image:
        '/images/products/lookskart/all/kerastase/kerastase-nutritive-bain-satin-shampoo-250ml-nourishing-for-dry-to-very-dry-hair.jpg',
    },
    shampoo_coarse: {
      brand: 'Kerastase',
      title: 'Chroma Bain Respect Shampoo',
      handle:
        'kerastase-shampoo-for-damaged-or-damaged-and-coloured-hair-nourishing-hair-bath-bain-riche-chroma-500ml',
      price: 'Rs. 4,005',
      image:
        '/images/products/lookskart/all/loreal-professionnel/kerastase-shampoo-for-damaged-or-damaged-and-coloured-hair-nourishing-hair-bath-bain-riche-chroma-500ml.jpg',
    },
    conditioner_fm: {
      brand: 'Kerastase',
      title: 'Genesis Fondant Renforçateur Conditioner',
      handle: 'kerastase-genesis-fondant-renfori-ateur-conditioner-200ml',
      price: 'Rs. 3,400',
      image:
        '/images/products/lookskart/all/kerastase/kerastase-genesis-fondant-renfori-ateur-conditioner-200ml.jpg',
    },
    conditioner_coarse: {
      brand: 'Kerastase',
      title: 'Genesis Fondant Renforçateur Conditioner',
      handle: 'kerastase-genesis-fondant-renfori-ateur-conditioner-200ml',
      price: 'Rs. 3,400',
      image:
        '/images/products/lookskart/all/kerastase/kerastase-genesis-fondant-renfori-ateur-conditioner-200ml.jpg',
    },
    leave_in: DEFAULT_PRODUCTS.leave_in,
    oil_fm: DEFAULT_PRODUCTS.oil_fm,
    oil_coarse: DEFAULT_PRODUCTS.oil_coarse,
    heat_blow_fm: DEFAULT_PRODUCTS.heat_blow_fm,
    heat_blow_coarse: DEFAULT_PRODUCTS.heat_blow_coarse,
    heat_iron: DEFAULT_PRODUCTS.heat_iron,
    dry_texture: DEFAULT_PRODUCTS.dry_texture,
    mask: DEFAULT_PRODUCTS.mask,
    hairspray: DEFAULT_PRODUCTS.hairspray,
    volume: DEFAULT_PRODUCTS.volume,
    repair: DEFAULT_PRODUCTS.repair,
  },
  "L'Oreal Professionnel": {
    shampoo_fm: {
      brand: "L'Oreal Professionnel",
      title: 'Serie Expert Absolut Repair Lipidium Shampoo',
      handle: 'loreal-professionnel-serie-expert-absolut-repair-lipidium-shampoo-300ml',
      price: 'Rs. 703',
      image:
        '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-serie-expert-absolut-repair-lipidium-shampoo-300ml.jpg',
    },
    shampoo_coarse: {
      brand: "L'Oreal Professionnel",
      title: 'Serie Expert Absolut Repair Lipidium Shampoo',
      handle: 'loreal-professionnel-serie-expert-absolut-repair-lipidium-shampoo-300ml',
      price: 'Rs. 703',
      image:
        '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-serie-expert-absolut-repair-lipidium-shampoo-300ml.jpg',
    },
    conditioner_fm: {
      brand: "L'Oreal Professionnel",
      title: 'Serie Expert Absolut Repair Lipidium Masque',
      handle: 'loreal-professionnel-serie-expert-absolut-repair-lipidium-masque-250ml',
      price: 'Rs. 990',
      image:
        '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-serie-expert-absolut-repair-lipidium-masque-250ml.jpg',
    },
    conditioner_coarse: {
      brand: "L'Oreal Professionnel",
      title: 'Serie Expert Absolut Repair Lipidium Masque',
      handle: 'loreal-professionnel-serie-expert-absolut-repair-lipidium-masque-250ml',
      price: 'Rs. 990',
      image:
        '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-serie-expert-absolut-repair-lipidium-masque-250ml.jpg',
    },
    leave_in: {
      brand: "L'Oreal Professionnel",
      title: 'Metal DX Leave-In Serum',
      handle: 'l-oreal-professionnel-metal-dx-concentrated-leave-in-serum-for-soft-shiny-hair50ml',
      price: 'Rs. 1,500',
      image:
        '/images/products/lookskart/all/loreal-professionnel/l-oreal-professionnel-metal-dx-concentrated-leave-in-serum-for-soft-shiny-hair50ml.jpg',
    },
    oil_fm: {
      brand: "L'Oreal Professionnel",
      title: 'Serie Expert Absolut Repair Lipidium Serum',
      handle: 'loreal-professionnel-serie-expert-absolut-repair-lipidium-serum-50ml',
      price: 'Rs. 1,300',
      image:
        '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-serie-expert-absolut-repair-lipidium-serum-50ml.jpg',
    },
    oil_coarse: {
      brand: "L'Oreal Professionnel",
      title: 'Serie Expert Absolut Repair Lipidium Serum',
      handle: 'loreal-professionnel-serie-expert-absolut-repair-lipidium-serum-50ml',
      price: 'Rs. 1,300',
      image:
        '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-serie-expert-absolut-repair-lipidium-serum-50ml.jpg',
    },
    heat_blow_fm: {
      brand: "L'Oreal Professionnel",
      title: 'Tecni Art Flex Blowdry',
      handle: 'loreal-professionnel-tecni-art-flex-blowdry-150ml',
      price: 'Rs. 990',
      image:
        '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-tecni-art-flex-blowdry-150ml.webp',
    },
    heat_blow_coarse: {
      brand: "L'Oreal Professionnel",
      title: 'Tecni Art Flex Blowdry',
      handle: 'loreal-professionnel-tecni-art-flex-blowdry-150ml',
      price: 'Rs. 990',
      image:
        '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-tecni-art-flex-blowdry-150ml.webp',
    },
    heat_iron: {
      brand: "L'Oreal Professionnel",
      title: 'Tecni Art Flex Liss Control Cream',
      handle: 'loreal-professionnel-tecni-art-flex-liss-control-cream-150ml',
      price: 'Rs. 990',
      image:
        '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-tecni-art-flex-liss-control-cream-150ml.jpg',
    },
    volume: {
      brand: "L'Oreal Professionnel",
      title: 'Tecni Art Full Volume Extra',
      handle: 'loreal-professionnel-tecni-art-full-volume-extra-250ml',
      price: 'Rs. 990',
      image:
        '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-tecni-art-full-volume-extra-250ml.webp',
    },
    dry_texture: {
      brand: "L'Oreal Professionnel",
      title: 'TecniArt Super Dust Volume Powder',
      handle: 'loreal-professionnel-tecniart-super-dust-volume-texture-powder-7g',
      price: 'Rs. 950',
      image:
        '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-tecniart-super-dust-volume-texture-powder-7g.jpg',
    },
    hairspray: {
      brand: "L'Oreal Professionnel",
      title: 'Tecni Art Elnett Hairspray',
      handle: 'loreal-professionnel-tecni-art-elnett-hair-spray-500ml',
      price: 'Rs. 950',
      image:
        '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-tecni-art-elnett-hair-spray-500ml.jpg',
    },
    mask: {
      brand: "L'Oreal Professionnel",
      title: 'Serie Expert Absolut Repair Lipidium Masque',
      handle: 'loreal-professionnel-serie-expert-absolut-repair-lipidium-masque-250ml',
      price: 'Rs. 990',
      image:
        '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-serie-expert-absolut-repair-lipidium-masque-250ml.jpg',
    },
  },
};

/** Same-brand variants for the universal Kerastase main pick */
export const UNIVERSAL_KERASTASE_VARIANTS = [
  {
    title: 'Nutritive 8H Magic Night Serum',
    handle: 'kerastase-nutritive-8h-magic-night-serum-90ml-moisturising-overnight-hair-leave',
    price: 'Rs. 3,850',
    image:
      '/images/products/lookskart/all/kerastase/kerastase-nutritive-8h-magic-night-serum-90ml-moisturising-overnight-hair-leave.jpg',
  },
  {
    title: 'Gloss Absolu Glaze Drops',
    handle: 'kerastase-gloss-absolu-glaze-drops-oil-in-serum-45ml',
    price: 'Rs. 3,000',
    image:
      '/images/products/lookskart/all/kerastase/kerastase-gloss-absolu-glaze-drops-oil-in-serum-45ml.webp',
  },
  {
    title: 'Nutritive Nectar Thermique',
    handle: 'kerastase-nutritive-nectar-thermique-blow-dry-primer-150ml',
    price: 'Rs. 2,800',
    image: '/images/products/lookskart/kerastase-nectar-thermique.webp',
  },
  {
    title: 'Nutritive Masquintense Riche Mask',
    handle: 'kerastase-nutritive-masquintense-epais-mask-200ml-highly-nourishing-mask',
    price: 'Rs. 3,850',
    image:
      '/images/products/lookskart/all/kerastase/kerastase-nutritive-masquintense-epais-mask-200ml-highly-nourishing-mask.jpg',
  },
];

/** Same-brand variants shown on results for L'Oreal focus routines */
export const SAME_BRAND_VARIANTS = {
  Kerastase: {},
  "L'Oreal Professionnel": {
    shampoo_fm: [
      {
        title: 'Serie Expert Inforcer Shampoo',
        handle: 'loreal-professionnel-serie-expert-inforcer-shampoo-300ml',
        price: 'Rs. 703',
        image:
          '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-serie-expert-inforcer-shampoo-300ml.jpg',
      },
      {
        title: 'Serie Expert Liss Unlimited Shampoo',
        handle: 'loreal-professionnel-serie-expert-liss-unlimited-shampoo-300ml',
        price: 'Rs. 703',
        image:
          '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-serie-expert-liss-unlimited-shampoo-300ml.jpg',
      },
    ],
    leave_in: [
      {
        title: 'Absolut Repair Molecular Leave-In Cream',
        handle: 'loreal-professionnel-absolut-molecular-deep-repairing-leave-in-cream-for-damaged-hair-100-ml',
        price: 'Rs. 1,300',
        image:
          '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-absolut-molecular-deep-repairing-leave-in-cream-for-damaged-hair-100-ml.webp',
      },
    ],
    oil_fm: [
      {
        title: 'Xtenso Care Serum',
        handle: 'loreal-professionnel-xtenso-care-serum-50ml',
        price: 'Rs. 990',
        image:
          '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-xtenso-care-serum-50ml.jpg',
      },
    ],
    heat_blow_fm: [
      {
        title: 'Tecni Art Flex Liss Control Cream',
        handle: 'loreal-professionnel-tecni-art-flex-liss-control-cream-150ml',
        price: 'Rs. 990',
        image:
          '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-tecni-art-flex-liss-control-cream-150ml.jpg',
      },
    ],
    volume: [
      {
        title: 'Tecni Art Volume Rootlift Mousse',
        handle: 'loreal-professionnel-tecni-art-volume-rootlift-mousse-250ml',
        price: 'Rs. 990',
        image:
          '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-tecni-art-volume-rootlift-mousse-250ml.jpg',
      },
    ],
    mask: [
      {
        title: 'Serie Expert Inforcer Masque',
        handle: 'loreal-professionnel-serie-expert-inforcer-masque-250ml',
        price: 'Rs. 990',
        image:
          '/images/products/lookskart/all/loreal-professionnel/loreal-professionnel-serie-expert-inforcer-masque-250ml.jpg',
      },
    ],
  },
};

const LOOKSKART = 'https://lookskart.com';

export function productUrl(handle) {
  return `${LOOKSKART}/products/${handle}`;
}

export function pickFocusBrand(random = Math.random()) {
  let cumulative = 0;
  for (const { brand, weight } of FOCUS_BRAND_WEIGHTS) {
    cumulative += weight;
    if (random < cumulative) return brand;
  }
  return FOCUS_BRAND_WEIGHTS[0].brand;
}

export function isFocusBrand(brand) {
  return brand === 'Kerastase' || brand === "L'Oreal Professionnel";
}

export function universalKerastaseProduct() {
  return {
    ...UNIVERSAL_KERASTASE_MAIN,
    url: productUrl(UNIVERSAL_KERASTASE_MAIN.handle),
  };
}

export function kerastaseSameBrandProducts() {
  return UNIVERSAL_KERASTASE_VARIANTS.map((v) => ({
    ...v,
    brand: 'Kerastase',
    url: productUrl(v.handle),
  }));
}

/** Resolve slot product for a focus brand (or default when no focus). */
export function resolveSlotProduct(slotKey, focusBrand) {
  const base = DEFAULT_PRODUCTS[slotKey];
  if (!focusBrand || !isFocusBrand(focusBrand)) {
    return { ...base, url: productUrl(base.handle) };
  }
  const override = FOCUS_PRODUCTS[focusBrand]?.[slotKey];
  if (!override) {
    return { ...base, url: productUrl(base.handle) };
  }
  return {
    ...base,
    ...override,
    key: base?.key,
    url: productUrl(override.handle || base.handle),
  };
}

/** Slots shown for given quiz answers */
export function activeSlots(context) {
  const { isCoarse, usesBlowDryer, usesIron, wantsVolume } = context;
  const slots = [];
  slots.push(isCoarse ? 'shampoo_coarse' : 'shampoo_fm');
  slots.push(isCoarse ? 'conditioner_coarse' : 'conditioner_fm');
  slots.push('leave_in');
  slots.push(isCoarse ? 'oil_coarse' : 'oil_fm');
  slots.push('dry_texture');
  slots.push('hairspray');
  slots.push('repair');
  slots.push('mask');
  if (usesBlowDryer) slots.push(isCoarse ? 'heat_blow_coarse' : 'heat_blow_fm');
  if (usesIron) slots.push('heat_iron');
  if (wantsVolume && usesBlowDryer) slots.push('volume');
  return slots;
}

export function sameBrandProductsForContext(focusBrand, context) {
  if (focusBrand === 'Kerastase' || !focusBrand) {
    return kerastaseSameBrandProducts();
  }
  if (focusBrand === "L'Oreal Professionnel" && isFocusBrand(focusBrand)) {
    const variants = SAME_BRAND_VARIANTS[focusBrand] || {};
    const seen = new Set();
    const out = [];
    for (const slotKey of activeSlots(context)) {
      const primary = resolveSlotProduct(slotKey, focusBrand);
      seen.add(primary.handle);
      for (const v of variants[slotKey] || []) {
        if (seen.has(v.handle)) continue;
        seen.add(v.handle);
        out.push({ ...v, brand: focusBrand, url: productUrl(v.handle), slot: slotKey });
      }
    }
    return out.slice(0, 8);
  }
  return kerastaseSameBrandProducts();
}
