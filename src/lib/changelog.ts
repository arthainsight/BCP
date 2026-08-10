export const CHANGELOG = [
  {
    version: 'v1.60',
    date: '2026-08-10',
    title: 'Separate Aṣṭakavarga table',
    changes: [
      'Moved Bhinna and Sarva Aṣṭakavarga values into their own chart tab.',
      'Removed the AV overlay and its setting from natal charts.',
      'Aligned house-based bindu values to fixed zodiac-sign columns; cells now show numbers only.',
    ],
  },
  {
    version: 'v1.59',
    changes: [
      'Added selectable Chara Karaka ranking: classical highest degree or highest minute',
      'Highest-minute mode compares the minute–second remainder and reverses Rahu before ranking',
      'Added deterministic tests for both Chara Karaka ranking modes',
    ],
  },
  {
    version: 'v1.58',
    changes: [
      'Added all 150 Deva Keralam / Chandra Kala Nadi nāḍī-aṁśa names',
      'Nāḍī table now shows the calculated name together with its number and sign modality',
    ],
  },
  {
    version: 'v1.57',
    changes: [
      'Added a dedicated Nāḍī tab for Lagna and graha calculations',
      'Deva Keralam: 150 equal 0°12′ divisions with movable, fixed, and dual sign ordering',
      'Siddhar: separate equal D150 harmonic placement with pūrva/para 0°06′ halves',
      'Added boundary tests for sign modalities, 15° dual-sign reset, and nāḍī halves',
    ],
  },
  {
    version: 'v1.56',
    changes: [
      'BNN simplified into single Event Detection module; removed standalone Jupiterian Rounds and Minor Progression panels',
      'BNN Event Detection context now shows natal Jupiter sign/degree, balance, current round number, and Temporary Lagna',
      'BNN Event Detection panel is collapsible; age override cleared with one click',
      'Removed Pada, Pada108, and D108 Experimental columns from Graha Table',
      'Removed BNN Jupiterian Rounds and BNN Jupiter Minor settings toggles',
      'Ashtakavarga handling corrected: shows "Ashtakavarga not available yet" instead of unreliable values',
    ],
  },
  {
    version: 'v1.55',
    changes: [
      'Bhava Bala: added occupant (Bhava Graha) contribution — ~approx: benefic occupant +45 × Ṣaḍbala ratio, malefic −30 × ratio virupa',
      'Bhava Bala: Bhavadhipati column now shows lord virupa, required minimum, and ratio transparently (source from Ṣaḍbala)',
      'Bhava Bala: ~Bhava Dig Bala expanded — kendra +15 vp, panapara +7.5 vp, apoklima 0 vp (labeled approximate)',
      'Bhava Bala: expandable per-house debug row shows lord source, each occupant with contribution, each aspecting planet with contribution and aspect strength, and explicit A+B+C=total formula',
      'Bhava Bala: Status column added — strong/ok/weak relative to chart mean (not a fixed threshold)',
      'Bhava Bala: negative contributions visible in Drig− column and occupant column for malefic planets',
      'Added bhavaBala.test.ts: deterministic verification fixture with fully worked H1 and H4 manual calculations',
    ],
  },
  {
    version: 'v1.54',
    changes: [
      'Shadbala rewritten to use classical virūpa totals and planet-specific minimum thresholds',
      'All six Shadbala components now stored and displayed in virūpa (not rūpa decimals)',
      'Naisargika Bala updated to exact classical integer values: Sun 60, Moon 51, Venus 43, Jupiter 34, Mercury 26, Mars 17, Saturn 9',
      'Planet-specific required minimums in virūpa: Sun 390, Moon 360, Mars 300, Mercury 420, Jupiter 390, Venus 330, Saturn 300',
      'Strength percentage calculated as totalVirupa / requiredVirupa × 100',
      'UI now shows raw virūpa total, required minimum, percentage, and status (weak/ok/strong with colour coding)',
      'Dṛg Bala now allows negative values where malefic aspects reduce strength (classical convention)',
      'Debug table marks approximate components with ~ prefix (Saptavargaja, Dig, Natonnata, Tribhaga, Ayana, Cheṣṭā, Dṛg)',
    ],
  },
  {
    version: 'v1.53',
    changes: [
      'Bhava Bala beta: replaced heuristic 0–100 scoring with classical Bhavesha + Bhava Drig calculation',
      'Bhavesha Bala now uses the lord\'s actual Ṣaḍbala (virupa) computed from the same chart data',
      'Bhava Drig uses orb-based drishti to the house sign midpoint — four components (strong/weak × benefic/malefic)',
      'Kendra bonus: +15 virupa for angular houses (H1, H4, H7, H10), per classical convention',
      'Values now in virupa (no arbitrary 0–100 normalisation); heuristic Quality column removed',
      'Code comments clarify what is implemented and what is not yet (Digbala, Kala Bala, cusp-based Drig)',
    ],
  },
  {
    version: 'v1.52',
    changes: [
      'Varga Matrix, Varga Strength / Viṁśopaka Bala, Shadbala beta, and Bhava Bala beta are now independent Workspace panels',
      'Each section can be added as a standalone Workspace panel and toggled independently',
      'Existing Chart Render → Varga combined view preserved unchanged',
    ],
  },
  {
    version: 'v1.51',
    changes: [
      'Removed Target Date from the main page input area.',
      'Renamed Run BCP action to Calculate Chart for clearer UX.',
    ],
  },
  {
    version: 'v1.48',
    changes: [
      'Inactive yogas hidden by default — only active yogas are shown in the Yoga Table',
      'Yoga Table can now be added as a standalone Workspace panel',
      'Workspace now supports up to 8 panels (was 4)',
      'Added Mukuta, Raja, Sakata, Dhana, Chandra, Adhi, Uttama, Sama and Adhama yogas',
      'Added Pancha Mahapurusha yogas: Ruchaka (Mars), Bhadra (Mercury), Hamsa (Jupiter), Malavya (Venus), Shasha (Saturn)',
    ],
  },
  {
    version: 'v1.47',
    changes: [
      'Added Yoga Table with Vosi, Vesi, Ubhayachari, Anapha, Sunapha, Durudhara and Kemadruma yoga detection.',
    ],
  },
  {
    version: 'v1.44',
    changes: [
      'Added configurable degree precision: Off, rounded degrees, degrees + minutes, and degrees + minutes + seconds. Transit planets now follow the same degree display setting.',
      'Transit datetime controls now visible under main chart and in Natal+Transit workspace panel',
      'BCP age/month manual override controls now appear under the main chart when BCP is enabled',
      'Legend items are now panel-specific in workspace: BCP legend only in BCP panel, BNN legend only in BNN panel, transit legend only in Natal+Transit panel',
      'Natal and Natal+Transit workspace panels no longer show BCP legend items',
    ],
  },
  {
    version: 'v1.43',
    changes: [
      'Fixed BNN age override chart syncing — override state lifted to page level, chart highlights update instantly',
      'Added BCP age controls below BCP chart in workspace panels',
      'Fixed retrograde detection — SEFLG_SPEED flag now correctly passed to Swiss Ephemeris (all grahas, not just nodes)',
      'BNN age override shared across BNN tab and workspace BNN panels',
    ],
  },
  {
    version: 'v1.42',
    changes: [
      'Retrograde planets now show ℞ in chart, Graha Table — Rahu/Ketu always marked retrograde',
      'BCP Override and BCP Summary now hidden when BCP dasha is turned off',
      'Workspace mode opens full-width on desktop (chart column collapses)',
      'BNN age override syncs to chart highlight colors via lifted state',
    ],
  },
  {
    version: 'v1.41',
    changes: [
      'Added multi-chart workspace mode with independent panels for BNN, BCP, Natal+Transit, Vimshottari and Graha Table',
      'Each workspace panel independently controls which highlights are shown (BNN vs BCP vs none)',
      'Desktop: 2–3 column responsive grid; mobile: stacked with per-panel collapse',
      'Add up to 4 panels; panel type changes via dropdown; panel configuration persists across sessions',
    ],
  },
  {
    version: 'v1.40',
    changes: [
      'Added BNN Event Detection panel combining Jupiterian Rounds and Minor Progression into interpretable event windows',
      'Event categories: marriage, career, property, children, father/authority, wealth/family, spirituality, health/pressure, foreign travel, education',
      'Confidence levels (high/medium/low) based on dual-layer activation scoring',
      'Moved raw BNN engine output behind Advanced BNN Engine Debug toggle (off by default)',
    ],
  },
  {
    version: 'v1.39',
    changes: [
      'Added BNN Jupiterian Rounds panel with natal Jupiter degree based rounds',
      'Active rashi / temporary lagna from natal Jupiter sign progression',
      'Age controls: auto-computed from birth + target date, with manual override',
      'Graha activation table: house from temporary lagna, sorted 1–12, with karakatwa',
      'Sun karakatwa reflects BNN timing layer (Fame, Talent, Government, etc.) — not Parashari dasha',
    ],
  },
  {
    version: 'v1.38',
    changes: [
      'BNN v2: planetary chain engine (depth-2 and depth-3 ordered chains)',
      'Multi-factor chain scoring: conjunction +10, trine +5, Jupiter/Saturn presence, Ketu/Rahu modifiers',
      'Signal filtering: top-5–7 findings with guaranteed Saturn / Jupiter / Moon coverage',
      'Structured output: Key Patterns, Support Factors, Risk Factors (Ketu / Ra-Mo)',
      'Rahu chains flagged as unstable in UI',
    ],
  },
  {
    version: 'v1.37',
    changes: [
      'BNN Relationship Engine: graha-to-graha analysis (conjunction, 2nd, 5th, 7th, 9th, 12th)',
      'Topic-based readings: Career, Marriage, Education, Wealth, Children, Spirituality, Health, General',
      'Anchor Graha selector with Auto (topic anchors) or specific graha',
      'Confidence scoring (high/medium/low) and strength scoring per finding',
      'Full relation map table (collapsible)',
    ],
  },
  {
    version: 'v1.36',
    changes: [
      'BNN Pro: ordered trinal chain engine (Fire / Earth / Air / Water circuits)',
      'Degree sequence matters — Venus → Moon and Moon → Venus carry distinct meanings',
      'Chain activation model: dasha planets and transits (sign conjunction + 7th aspect)',
    ],
  },
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
