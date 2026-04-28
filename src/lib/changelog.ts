export const CHANGELOG = [
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
  },
  {
    version: 'v1.16',
    changes: [
      'Restored full Settings panel structure (Charts, Calculations, Dasha, Updates, About)',
      'Added live North ↔ South chart switching without page reload',
      'Fixed Settings UI regression where sections were missing',
      'Chart style selection now persists correctly and updates instantly',
    ],
  },
  {
    version: 'v1.15',
    changes: [
      'Increased planet label font size for better readability on desktop and mobile',
      'Increased sign abbreviation font size from 11 to 13',
      'Improved chart line contrast in dark and light mode',
      'Increased vertical spacing between stacked planet labels',
      'Strengthened BCP Year / Month / Both house highlight fills',
      'Neutral planet labels now use higher-contrast zinc-200 (dark) and zinc-800 (light)',
      'Legend text size increased to 13px',
    ],
  },
  {
    version: 'v1.14',
    changes: [
      'Unified BCP Engine and Vimshottari Dasha styling into one shared visual system',
      'Removed orange/brown Vimshottari-specific alert styling',
      'Made active dasha states use the same restrained accent logic as the rest of the app',
      'Simplified chart renderer colors by removing planet-specific color coding',
      'Made BCP Year / Month / Both house highlights the primary chart visual signal',
      'Updated chart styling for a calmer, more consistent interface across desktop and mobile',
    ],
  }
];
