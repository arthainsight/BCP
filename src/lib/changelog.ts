export const CHANGELOG = [
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
  },
  {
    version: 'v1.24',
    changes: [
      'Fixed duplicate panel rendering: desktop and mobile layouts are now mutually exclusive at the lg breakpoint',
      'Split shared header into separate desktop and mobile headers, both hidden at the opposite breakpoint',
      'BottomNav wrapped in lg:hidden to prevent it rendering on desktop',
    ],
  },
  {
    version: 'v1.23',
    changes: [
      'Added Panchang panel: Vara, Tithi, Nakshatra (with Pada), Karana, Yoga, Hora',
      'Sunrise / sunset / solar noon computed from coordinates (NOAA algorithm, no extra dependency)',
      'Ayanamsa displayed in DMS with mode name; Masa shown as approximate from solar sign',
      'Toggle via Settings → Charts → panchang (default off)',
    ],
  },
  {
    version: 'v1.22',
    changes: [
      'Fixed D9/Navamsa start-sign logic in the Varga Matrix (movable: same sign, fixed: 9th from sign, dual: 5th from sign)',
      'Added sanity checks for D9 covering movable, fixed, and dual signs',
      'No changes to dasha logic',
    ],
  },
  {
    version: 'v1.21',
    changes: [
      'Expanded Varga Matrix with extended divisional charts (D2, D4, D7, D12, D16, D20, D24, D27, D30, D40, D45)',
      'Improved Varga Matrix UI with horizontal scroll and sticky body column',
      'Extended Varga Dominance Score to include all available divisions',
      'General stability improvements for divisional calculation layer',
    ],
  },
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
