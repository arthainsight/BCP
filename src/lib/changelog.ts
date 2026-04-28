export const CHANGELOG = [
  {
    version: 'v1.20',
    changes: [
      'Added Varga Matrix (D1, D3, D9, D10, D60)',
      'Implemented correct Navamsa (D9) calculation logic',
      'Added Varga Dominance Score (own sign / exalted / friend sign)',
      'Ranking system for planetary strength across divisional charts',
      'Integrated Varga Matrix into chart view (desktop + mobile)',
    ],
  },
  {
    version: 'v1.19',
    changes: [
      'Removed switch-case from DashaPanel and introduced renderer map',
      'DashaPanel now fully driven by registry + renderer mapping',
      'Improved scalability: adding new dashas no longer requires modifying control flow logic',
    ],
  },
  {
    version: 'v1.18',
    changes: [
      'Introduced central Dasha Registry (single source of truth for all dashas)',
      'All dashas are now defined in one place (registry layer)',
      'Refactored Settings → Dasha to support status-based UI (implemented / beta / coming soon)',
      'Improved scalability for adding future dasha systems',
    ],
  },
  {
    version: 'v1.17',
    changes: [
      'Added Chara Dasha (beta)',
      'Chara Dasha can now be enabled from Settings → Dasha',
      'Added MD → AD → PD drill-down navigation for Chara Dasha',
      'Marked Chara Dasha as beta because calculation variants still need validation across multiple charts',
    ],
  }
];
