export const CHANGELOG = [
  {
    version: 'v1.09',
    changes: [
      'Added Dasha settings section with toggles for BCP and Vimshottari visibility',
      'Added Vimshottari level toggles: MD, AD (Antardasha), PD (Pratyantardasha)',
      'AD and PD show for the currently active period (today\'s date)',
      'Removed House Analysis block from Dasha page — BCP Engine only',
      'Dasha settings persisted to localStorage',
    ],
  },
  {
    version: 'v1.08',
    changes: [
      'Added Vimshottari Dasha calculation from Moon nakshatra',
      'Shows Vimshottari Mahadasha timeline alongside BCP dasha output',
      'Dasha page: BCP on left, Vimshottari on right (stacked on mobile)',
      'Vimshottari uses standard 120-year cycle and Moon sidereal longitude',
    ],
  },
  {
    version: 'v1.07',
    changes: [
      'Added current chart/session name display in the top header',
      'Shows saved chart name after LOAD or SAVE AS, Untitled if data exists without a saved name, None when session is empty',
    ],
  },
  {
    version: 'v1.06',
    changes: [
      'Added top header file toolbar: NEW, LOAD, SAVE, SAVE AS, EXPORT, IMPORT',
      'Removed lower PROFILE load/save buttons',
      'EXPORT downloads all saved charts as bcp-charts-export.json',
      'IMPORT merges charts from a JSON export file (no overwrites)',
      'Saved charts use browser localStorage (bcp_saved_charts)',
      'LOAD shows saved charts dropdown with delete per entry',
      'SAVE updates active chart; SAVE AS creates a new named entry',
      'NEW starts a fresh session with confirmation if data exists',
    ],
  },
  {
    version: 'v1.05',
    changes: [
      'Nakshatra abbreviation on chart (Asw/Bha/Krt…)',
      'Chart settings no longer affect Grahas table',
      'Dasha page simplified — compact technical output only',
      'Settings: About/Charts/Calculations all collapsible',
      'Settings: Calculation details and Export report removed from UI',
    ],
  },
  {
    version: 'v1.04',
    changes: [
      'Charts settings: 7 display toggles (signs, natal, transit, Sanskrit, degrees, nakshatra, karaka)',
      'Calculations settings: ayanamsa and Rahu/Ketu mode selectors',
      'About section in Settings',
      'Display settings persisted to localStorage',
    ],
  },
  {
    version: 'v1.03',
    changes: [
      'Separated Data and Settings tabs',
      'Removed standalone Karakas tab (karakas visible in Grahas table)',
      'Export report and debug panel moved to Settings',
    ],
  },
  {
    version: 'v1.02',
    changes: [
      'Export report (.md)',
      'Calculation details panel',
      'Improved build stability (swisseph-wasm)',
    ],
  },
  {
    version: 'v1.01',
    changes: [
      'Initial release',
    ],
  },
];
