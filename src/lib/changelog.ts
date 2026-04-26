export const CHANGELOG = [
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
  },
  {
    version: 'v1.13',
    changes: [
      'Mobile Grahas view now uses stacked cards instead of horizontal table scrolling',
      'Nakṣatra Pada is now visible in the mobile Grahas view',
      'Desktop Grahas table remains unchanged',
    ],
  },
  {
    version: 'v1.12',
    changes: [
      'Removed Sanskrit toggle from Settings → Chart',
      'Removed Theme control from Settings',
      'All Settings sections collapsed by default',
      'Removed MD/AD/PD controls from Settings and simplified Vimshottari UI',
      'Added special Lagnas to graha table: HL, BL, GL, SL, PP, ViL',
    ],
  },
  {
    version: 'v1.11',
    changes: [
      'Added Tropical (Sayana) zodiac option',
      'Added multiple sidereal ayanamsas: Lahiri, Raman, Krishnamurti',
      'Added True Node support for Rahu/Ketu',
      'Ayanamsa and node selection now affect actual chart calculation',
    ],
  },
];