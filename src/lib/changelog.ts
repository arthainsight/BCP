export const CHANGELOG = [
  {
    version: 'v1.34',
    changes: [
      'Added full Ashtakavarga system (Bhinna + Sarva)',
      'Implemented bindu calculation per planet (BAV)',
      'Added Sarva Ashtakavarga totals (SAV)',
      'Added chart overlay data for Ashtakavarga (house strength visualization)',
    ],
  },
  {
    version: 'v1.33',
    changes: [
      'Added classical Bhava Bala (beta) based on Shadbala + Drig Bala projection',
      'Bhavesha now uses full Shadbala total for house strength',
      'Implemented Drig Bala split (Drig1–Drig4) for house aspect pressure',
      'Improved overall structural accuracy of strength calculations',
    ],
  },
  {
    version: 'v1.30',
    changes: [
      'Added Kala Bala (Natonnata, Paksha, Tribhaga)',
      'Shadbala now includes Sthana + Dig + Kala + Naisargika (partial)',
      'Fixed version mismatch issue',
    ],
  },
  {
    version: 'v1.27',
    changes: [
      'Implemented full Vimsopaka-style Varga Strength tables (Shadvarga, Saptavarga, Dasavarga, Shodasavarga)',
      'Added dignity-based coloring to Varga Matrix',
    ],
  }
];
