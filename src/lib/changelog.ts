export const CHANGELOG = [
  {
    version: 'v1.35',
    changes: [
      'Added Graha Drishti (planetary aspects)',
      'Added Rashi Drishti (Jaimini sign aspects)',
      'New Drishti tab with house-level summary',
      'Independent nakshatra zodiac mode: sidereal (Lahiri, default) or tropical — separate from ayanamsa sign setting',
      'BCP manual override moved from Data tab to Dasha tab where it belongs',
      'BNN Alpha module: clearly labeled research-only rule cards for planet placements and conjunctions',
      'Data section cleaned up: birth data only, no mixed BCP controls',
    ],
  },
  {
    version: 'v1.34',
    changes: [
      'Added full Ashtakavarga system (Bhinna + Sarva)',
      'Added chart overlay for Ashtakavarga',
    ],
  },
  {
    version: 'v1.26',
    changes: [
      'Simple mode UX cleanup: removed debug labels (chart.render, $ run bcp) from user-facing view',
      'BCP summary panel with human-readable year/month house themes shown below the chart in Simple mode',
      'Compact calculation summary strip (ayanamsa, node mode, timezone) visible near the chart',
      'Resolved SettingsPanel merge conflict; split display toggles into basic and advanced sections properly',
      'Special lagna highlight color changed to amber to avoid clash with the BCP "both houses" purple',
      'South Indian chart legend is now conditional — only shown when BCP highlights / transit / special lagnas are active',
      'Mobile chart and card readability improvements: cells use overflow-hidden and truncation',
    ],
  },
];
