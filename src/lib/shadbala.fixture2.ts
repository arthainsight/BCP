// Two more charts for the Ṣaḍbala and Bhāva Bala tests, to show that the engine is right away from the
// reference chart of shadbala.fixture.ts: a day birth in Mumbai with Sagittarius rising, and a birth in the
// twilight in Sydney (southern hemisphere, waning Moon, Jupiter retrograde, Pisces rising). The positions are
// the app's own (Lahiri ayanamsa). The expected numbers were worked out by a separate program written from
// the Sanskrit rules alone (the verse constants, the Surya Siddhanta's Kali-yuga epoch and revolutions for
// the mean positions), not by the engine, with the decisions of the audit (the defaults of balaOptions.ts).
// The Cheṣṭā Bala of Mars, Mercury, Jupiter, Venus and Saturn is left out of the totals: it rests on the mean
// positions of Raman's tables, which differ from the pure Surya Siddhanta ones by up to 2.2 virupa (Mercury),
// and is tested through its own parts in shadbala.test.ts. Bhāva Bala is therefore compared part by part,
// without the lord's Ṣaḍbala.

import type { ShadbalaChartLike } from './shadbala';

export interface IndependentShadbala {
  uccha: number; saptavargaja: number; ojhayugma: number; kendradi: number; drekkana: number;
  dig: number; natonnata: number; paksha: number; tribhaga: number; varsheshadi: number; ayana: number;
  naisargika: number; drik: number;
}
export interface IndependentBhava { house: number; lord: string; dig: number; drig: number; occupants: number; kala: number }
export interface IndependentCase {
  name: string;
  chart: ShadbalaChartLike;
  shadbala: Record<string, IndependentShadbala>;
  bhava: IndependentBhava[];
}

// Mumbai 2 August 1975 15:10 IST
export const MUMBAI_CASE: IndependentCase = {
  name: "Mumbai 2 August 1975 15:10 IST",
  chart: {
  "ascendant": {
    "sign": 8,
    "longitude": 228.14570396625803
  },
  "midheaven": 143.70308217769207,
  "debug": {
    "julianDay": 2442626.902777778,
    "ayanamsa": 23.516040635121385,
    "siderealAyanamsa": 23.516040635121385,
    "inputDateTime": "1975-08-02 15:10:00",
    "sunriseLocalHours": 6.25438791699753,
    "sunsetLocalHours": 19.233503585680864,
    "nextSunriseLocalHours": 30.259917190297983,
    "previousSunriseLocalHours": -17.751198576763727
  },
  "planets": [
    {
      "name": "Sun",
      "longitude": 105.97250706858674,
      "sign": 4,
      "house": 9,
      "speed": 0.9570420565851446,
      "declination": 17.879030364727573,
      "isRetrograde": false
    },
    {
      "name": "Moon",
      "longitude": 39.49411714046618,
      "sign": 2,
      "house": 7,
      "speed": 12.874801254793491,
      "declination": 20.345001991686495,
      "isRetrograde": false
    },
    {
      "name": "Mars",
      "longitude": 28.5613816315754,
      "sign": 1,
      "house": 6,
      "speed": 0.6521628924735876,
      "declination": 16.89366621299765,
      "isRetrograde": false
    },
    {
      "name": "Mercury",
      "longitude": 107.11128222874206,
      "sign": 4,
      "house": 9,
      "speed": 2.070003210755397,
      "declination": 19.235059084132658,
      "isRetrograde": false
    },
    {
      "name": "Jupiter",
      "longitude": 0.9343782620813528,
      "sign": 1,
      "house": 6,
      "speed": 0.0406111852468993,
      "declination": 8.168500579961107,
      "isRetrograde": false
    },
    {
      "name": "Venus",
      "longitude": 137.92404296613233,
      "sign": 5,
      "house": 10,
      "speed": 0.14105458126284734,
      "declination": 3.5274313803217145,
      "isRetrograde": false
    },
    {
      "name": "Saturn",
      "longitude": 91.27837904462552,
      "sign": 4,
      "house": 9,
      "speed": 0.12706257554798425,
      "declination": 21.15809480410911,
      "isRetrograde": false
    },
    {
      "name": "Rahu",
      "longitude": 213.77979343014223,
      "sign": 8,
      "house": 1,
      "speed": -0.05293618035081082,
      "isRetrograde": true
    },
    {
      "name": "Ketu",
      "longitude": 33.77979343014226,
      "sign": 2,
      "house": 7,
      "speed": -0.05293618035081082,
      "isRetrograde": true
    },
    {
      "name": "Uranus",
      "longitude": 185.14116102946258,
      "sign": 7,
      "house": 12,
      "speed": 0.02262248093999048,
      "declination": -10.517347763439426,
      "isRetrograde": false
    },
    {
      "name": "Neptune",
      "longitude": 225.60352449288058,
      "sign": 8,
      "house": 1,
      "speed": -0.009963300586987661,
      "declination": -20.264500521947785,
      "isRetrograde": true
    },
    {
      "name": "Pluto",
      "longitude": 163.54037607591474,
      "sign": 6,
      "house": 11,
      "speed": 0.02403540379768055,
      "declination": 12.38730638994468,
      "isRetrograde": false
    }
  ]
},
  shadbala: {
  "Sun": {
    "uccha": 28.009,
    "saptavargaja": 132,
    "ojhayugma": 0,
    "kendradi": 15,
    "drekkana": 0,
    "dig": 47.423,
    "natonnata": 47.886,
    "paksha": 37.841,
    "tribhaga": 0,
    "varsheshadi": 0,
    "ayana": 52.521,
    "naisargika": 60,
    "drik": -2.519
  },
  "Moon": {
    "uccha": 57.835,
    "saptavargaja": 160,
    "ojhayugma": 30,
    "kendradi": 60,
    "drekkana": 0,
    "dig": 34.736,
    "natonnata": 12.114,
    "paksha": 22.159,
    "tribhaga": 0,
    "varsheshadi": 0,
    "ayana": 3.599,
    "naisargika": 51.429,
    "drik": 4.112
  },
  "Mars": {
    "uccha": 29.813,
    "saptavargaja": 88,
    "ojhayugma": 30,
    "kendradi": 15,
    "drekkana": 0,
    "dig": 21.619,
    "natonnata": 12.114,
    "paksha": 37.841,
    "tribhaga": 0,
    "varsheshadi": 0,
    "ayana": 53.095,
    "naisargika": 17.143,
    "drik": 0.317
  },
  "Mercury": {
    "uccha": 40.704,
    "saptavargaja": 84,
    "ojhayugma": 15,
    "kendradi": 15,
    "drekkana": 15,
    "dig": 19.655,
    "natonnata": 60,
    "paksha": 22.159,
    "tribhaga": 0,
    "varsheshadi": 0,
    "ayana": 52.103,
    "naisargika": 25.714,
    "drik": -3.088
  },
  "Jupiter": {
    "uccha": 28.645,
    "saptavargaja": 80,
    "ojhayugma": 30,
    "kendradi": 15,
    "drekkana": 15,
    "dig": 15.737,
    "natonnata": 47.886,
    "paksha": 22.159,
    "tribhaga": 60,
    "varsheshadi": 60,
    "ayana": 42.225,
    "naisargika": 34.286,
    "drik": -16.692
  },
  "Venus": {
    "uccha": 13.025,
    "saptavargaja": 56,
    "ojhayugma": 15,
    "kendradi": 60,
    "drekkana": 0,
    "dig": 1.926,
    "natonnata": 47.886,
    "paksha": 22.159,
    "tribhaga": 0,
    "varsheshadi": 15,
    "ayana": 39.28,
    "naisargika": 42.857,
    "drik": -18.271
  },
  "Saturn": {
    "uccha": 23.759,
    "saptavargaja": 100,
    "ojhayugma": 0,
    "kendradi": 15,
    "drekkana": 0,
    "dig": 45.622,
    "natonnata": 12.114,
    "paksha": 37.841,
    "tribhaga": 60,
    "varsheshadi": 75,
    "ayana": 3.306,
    "naisargika": 8.571,
    "drik": 3.801
  }
},
  bhava: [{"house": 1, "lord": "Mars", "dig": 1.049, "drig": -9.507, "occupants": 0, "kala": 15}, {"house": 2, "lord": "Jupiter", "dig": 22.901, "drig": 23.133, "occupants": 0, "kala": 0}, {"house": 3, "lord": "Saturn", "dig": 47.099, "drig": -87.135, "occupants": 0, "kala": 0}, {"house": 4, "lord": "Saturn", "dig": 31.049, "drig": -58.181, "occupants": 0, "kala": 15}, {"house": 5, "lord": "Jupiter", "dig": 52.901, "drig": -37.992, "occupants": 0, "kala": 0}, {"house": 6, "lord": "Mars", "dig": 17.099, "drig": -20.201, "occupants": 0, "kala": 0}, {"house": 7, "lord": "Venus", "dig": 27.099, "drig": 9.971, "occupants": 0, "kala": 0}, {"house": 8, "lord": "Mercury", "dig": 8.951, "drig": 26.688, "occupants": 0, "kala": 15}, {"house": 9, "lord": "Moon", "dig": 41.049, "drig": 36.992, "occupants": -60, "kala": 0}, {"house": 10, "lord": "Sun", "dig": 57.099, "drig": 17.621, "occupants": 0, "kala": 15}, {"house": 11, "lord": "Mercury", "dig": 38.951, "drig": -12.24, "occupants": 0, "kala": 15}, {"house": 12, "lord": "Venus", "dig": 48.951, "drig": -18.051, "occupants": 0, "kala": 15}],
};

// Sydney 21 March 2003 08:40 AEDT
export const SYDNEY_CASE: IndependentCase = {
  name: "Sydney 21 March 2003 08:40 AEDT",
  chart: {
  "ascendant": {
    "sign": 12,
    "longitude": 356.4819679517378
  },
  "midheaven": 268.5181091866032,
  "debug": {
    "julianDay": 2452719.402777778,
    "ayanamsa": 23.902007362109373,
    "siderealAyanamsa": 23.902007362109373,
    "inputDateTime": "2003-03-21 08:40:00",
    "sunriseLocalHours": 6.973804889246367,
    "sunsetLocalHours": 19.103518182412245,
    "nextSunriseLocalHours": 30.98651546426163,
    "previousSunriseLocalHours": -17.03895092569246
  },
  "planets": [
    {
      "name": "Sun",
      "longitude": 335.9602201426956,
      "sign": 12,
      "house": 1,
      "speed": 0.9932070473772577,
      "declination": -0.05469569014589843,
      "isRetrograde": false
    },
    {
      "name": "Moon",
      "longitude": 190.47561240868765,
      "sign": 7,
      "house": 8,
      "speed": 14.906509299887501,
      "declination": -10.808405133206442,
      "isRetrograde": false
    },
    {
      "name": "Mars",
      "longitude": 256.2544982031474,
      "sign": 9,
      "house": 10,
      "speed": 0.630641097607526,
      "declination": -23.43573680872115,
      "isRetrograde": false
    },
    {
      "name": "Mercury",
      "longitude": 334.8979601145779,
      "sign": 12,
      "house": 1,
      "speed": 1.9683036673343646,
      "declination": -1.8342838120728755,
      "isRetrograde": false
    },
    {
      "name": "Jupiter",
      "longitude": 104.48075807103407,
      "sign": 4,
      "house": 5,
      "speed": -0.045015151391418984,
      "declination": 19.022027012886163,
      "isRetrograde": true
    },
    {
      "name": "Venus",
      "longitude": 297.893887171551,
      "sign": 10,
      "house": 11,
      "speed": 1.194008489816013,
      "declination": -14.499114216277773,
      "isRetrograde": false
    },
    {
      "name": "Saturn",
      "longitude": 58.888994055537125,
      "sign": 2,
      "house": 3,
      "speed": 0.04833368415687365,
      "declination": 22.218617386545542,
      "isRetrograde": false
    },
    {
      "name": "Rahu",
      "longitude": 38.9492337020411,
      "sign": 2,
      "house": 3,
      "speed": -0.05297708790385374,
      "isRetrograde": true
    },
    {
      "name": "Ketu",
      "longitude": 218.9492337020411,
      "sign": 8,
      "house": 9,
      "speed": -0.05297708790385374,
      "isRetrograde": true
    },
    {
      "name": "Uranus",
      "longitude": 306.63635264785125,
      "sign": 11,
      "house": 12,
      "speed": 0.052035668215388284,
      "declination": -11.952175929438782,
      "isRetrograde": false
    },
    {
      "name": "Neptune",
      "longitude": 288.454952450741,
      "sign": 10,
      "house": 11,
      "speed": 0.02803491342814527,
      "declination": -17.069940587458653,
      "isRetrograde": false
    },
    {
      "name": "Pluto",
      "longitude": 236.047682913671,
      "sign": 8,
      "house": 9,
      "speed": 0.0012477010799967108,
      "declination": -13.682405934204088,
      "isRetrograde": false
    }
  ]
},
  shadbala: {
  "Sun": {
    "uccha": 48.653,
    "saptavargaja": 84,
    "ojhayugma": 15,
    "kendradi": 60,
    "drekkana": 15,
    "dig": 37.519,
    "natonnata": 38.14,
    "paksha": 11.505,
    "tribhaga": 0,
    "varsheshadi": 0,
    "ayana": 29.931,
    "naisargika": 60,
    "drik": -8.79
  },
  "Moon": {
    "uccha": 7.508,
    "saptavargaja": 67,
    "ojhayugma": 15,
    "kendradi": 30,
    "drekkana": 0,
    "dig": 26.014,
    "natonnata": 21.86,
    "paksha": 48.495,
    "tribhaga": 0,
    "varsheshadi": 30,
    "ayana": 46.605,
    "naisargika": 51.429,
    "drik": -10.388
  },
  "Mars": {
    "uccha": 46.085,
    "saptavargaja": 110,
    "ojhayugma": 30,
    "kendradi": 60,
    "drekkana": 0,
    "dig": 55.912,
    "natonnata": 21.86,
    "paksha": 11.505,
    "tribhaga": 0,
    "varsheshadi": 0,
    "ayana": 1.354,
    "naisargika": 17.143,
    "drik": -21.931
  },
  "Mercury": {
    "uccha": 3.367,
    "saptavargaja": 75,
    "ojhayugma": 15,
    "kendradi": 60,
    "drekkana": 0,
    "dig": 52.805,
    "natonnata": 60,
    "paksha": 48.495,
    "tribhaga": 60,
    "varsheshadi": 60,
    "ayana": 30.6,
    "naisargika": 25.714,
    "drik": -9.454
  },
  "Jupiter": {
    "uccha": 56.84,
    "saptavargaja": 130,
    "ojhayugma": 0,
    "kendradi": 30,
    "drekkana": 0,
    "dig": 24.0,
    "natonnata": 38.14,
    "paksha": 48.495,
    "tribhaga": 60,
    "varsheshadi": 0,
    "ayana": 52.926,
    "naisargika": 34.286,
    "drik": -28.226
  },
  "Venus": {
    "uccha": 40.298,
    "saptavargaja": 89,
    "ojhayugma": 30,
    "kendradi": 30,
    "drekkana": 15,
    "dig": 9.792,
    "natonnata": 38.14,
    "paksha": 48.495,
    "tribhaga": 0,
    "varsheshadi": 60,
    "ayana": 11.992,
    "naisargika": 42.857,
    "drik": -4.829
  },
  "Saturn": {
    "uccha": 12.963,
    "saptavargaja": 84,
    "ojhayugma": 0,
    "kendradi": 15,
    "drekkana": 0,
    "dig": 20.802,
    "natonnata": 21.86,
    "paksha": 11.505,
    "tribhaga": 0,
    "varsheshadi": 0,
    "ayana": 0.961,
    "naisargika": 8.571,
    "drik": -27.244
  }
},
  bhava: [{"house": 1, "lord": "Jupiter", "dig": 25.494, "drig": 37.883, "occupants": 0, "kala": 15}, {"house": 2, "lord": "Mars", "dig": 24.506, "drig": -5.662, "occupants": 0, "kala": 0}, {"house": 3, "lord": "Venus", "dig": 14.506, "drig": -32.998, "occupants": -60, "kala": 0}, {"house": 4, "lord": "Mercury", "dig": 33.827, "drig": -68.153, "occupants": 0, "kala": 0}, {"house": 5, "lord": "Moon", "dig": 36.173, "drig": -42.825, "occupants": 60, "kala": 0}, {"house": 6, "lord": "Sun", "dig": 15.494, "drig": -32.402, "occupants": 0, "kala": 0}, {"house": 7, "lord": "Mercury", "dig": 3.827, "drig": -57.331, "occupants": 0, "kala": 0}, {"house": 8, "lord": "Venus", "dig": 6.173, "drig": -3.077, "occupants": 0, "kala": 0}, {"house": 9, "lord": "Mars", "dig": 43.827, "drig": 21.152, "occupants": 0, "kala": 0}, {"house": 10, "lord": "Jupiter", "dig": 55.494, "drig": -29.398, "occupants": -60, "kala": 0}, {"house": 11, "lord": "Saturn", "dig": 5.494, "drig": 39.82, "occupants": 0, "kala": 0}, {"house": 12, "lord": "Saturn", "dig": 46.173, "drig": 23.77, "occupants": 0, "kala": 0}],
};

export const INDEPENDENT_CASES: IndependentCase[] = [MUMBAI_CASE, SYDNEY_CASE];
