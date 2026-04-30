export const CHANGELOG = [
  {
    version: 'v1.27',
    changes: [
      'Implemented full Vimsopaka-style Varga Strength tables (Shadvarga, Saptavarga, Dasavarga, Shodasavarga)',
      'Added dignity-based coloring to Varga Matrix (exalted, own, friend, neutral, enemy, debilitated)',
      'Debilitation explicitly treated as zero strength in all calculations',
      'Replaced previous dominance score with classical weighted varga strength system',
    ],
  },
  {
    version: 'v1.26',
    changes: [
      'Added classical Varga Strength (Vimsopaka-style) with 4 calculation modes: Shadvarga, Saptavarga, Dasavarga, Shodasavarga',
      'Debilitation now treated as zero strength (0 viswa) in all calculations',
      'Replaced dominance score with weighted classical dignity evaluation',
      'Improved Varga Matrix to reflect classical strength logic instead of simple counting',
    ],
  }
];
