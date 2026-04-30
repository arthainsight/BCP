export const CHANGELOG = [
  {
    version: 'v1.26',
    changes: [
      'Added classical Varga Strength (Vimsopaka-style) with 4 calculation modes: Shadvarga, Saptavarga, Dasavarga, Shodasavarga',
      'Debilitation now treated as zero strength (0 viswa) in all calculations',
      'Replaced dominance score with weighted classical dignity evaluation',
      'Improved Varga Matrix to reflect classical strength logic instead of simple counting',
    ],
  },
  {
    version: 'v1.25',
    changes: [
      'Added UI mode switcher (Simple / Research / Debug) — persisted across sessions',
      'Simple mode: dashas rendered flat, no debug panel',
      'Research mode: each dasha is a collapsible card (first open by default); calculation details shown collapsed',
      'Debug mode: same as research + calculation details expanded by default, DEBUG badge in header',
      'Settings reorganised into Display (open) and Advanced (collapsed) sections',
      'Advanced settings: transit, outer planets, special lagnas, panchang, experimental dashas',
      'CollapsibleCard component added for reusable collapsible sections',
    ],
  }
];
