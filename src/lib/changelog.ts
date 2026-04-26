export const CHANGELOG = [
  {
    version: 'v1.10',
    changes: [
      'Major Vimshottari UI upgrade: full MD → AD → PD → SD → PR → DE navigation',
      'Active dasha path ("NOW") shown clearly across all levels',
      'Clickable breadcrumb navigation between all dasha levels',
      'Fixed incorrect dasha labeling (MD shown as AD bug)',
      'Added time precision (HH:mm) from PD level onwards',
      'Mobile layout optimized: no overflow, stacked time display for deep dashas',
      'All dasha levels selectable, including final DE level',
      'Improved visual hierarchy: active vs selected dashas clearly separated',
    ],
  },
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
];
