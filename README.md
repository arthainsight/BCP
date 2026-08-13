# bhrigu.code

A fast, experimental Jyotish toolkit focused on **daśā analysis** and practical chart reading.

Built for exploration — not dogma.

Live: [bcp-five.vercel.app](https://bcp-five.vercel.app)

---

## What this is

**bhrigu.code** is a browser-based astrology tool. Everything runs client-side;
charts and event lists live in local storage, and nothing is uploaded anywhere.

The goal is simple:

> Make chart reading faster, clearer, and more systematic.

---

## Core ideas

* **Chart first, theory second**
* **Toggle everything**
* **See patterns, not just data**
* **Say plainly what is calculated and what is approximated**

This is not meant to replace traditional study — it's meant to **accelerate it**.

---

## Features

### Chart

* North and South Indian styles
* BCP (Bhṛgu Chakra Paddhati) year/month highlighting
* Special lagnas and chara karakas
* Ashtakavarga overlay (SAV and per-planet BAV)
* Selectable ayanamsa, including a signed custom offset from Lahiri
* Transits with automatic recalculation

### Daśā

The largest part of the app. Nine calculated systems:

| System | Kind | Status |
| --- | --- | --- |
| Vimśottarī (and Vimśottarī Original) | Nakṣatra | Implemented |
| Aṣṭottarī | Nakṣatra | Implemented, chart-conditional eligibility |
| Yoginī | Nakṣatra | Implemented |
| Chara | Rāśi | Implemented |
| Kālachakra | — | Implemented |
| Nārāyaṇa, Mūla, Sthira | Rāśi | Beta — see *Validation* below |

All of them support six-level sub-daśā navigation. The **Daśā workspace** wraps
them in five tabs:

* **Timeline** — one date-driven cross-system view with the active MD–AD–PD path
* **Finder** — search a date range for MD/AD/PD combinations, across systems
* **Events** — saved life events with categories, tags, notes and significance,
  plus CSV/JSON import and export
* **Patterns** — recurring rulers across saved events, with category filters
* **Systems** — per-system method settings and calculation provenance

### Strength and divisional analysis

* Varga matrix (D1 → D60) and Viṁśopaka Bala
* Ṣaḍbala (beta)
* Bhāva Bala (beta)
* Graha dṛṣṭi and rāśi dṛṣṭi (Jaimini)
* Avasthās, sahams, panchanga

### Research tools

* Nāḍī paraya progressions for Jupiter, Saturn, Rahu and Ketu
* Nāḍī aṁśa (Deva Keralam and Siddhar)
* Local backup and restore of every saved chart, event list and setting

---

## Validation

Calculation accuracy is tracked explicitly rather than assumed.

* **Implemented** systems have regression fixtures covering seeds, period order,
  continuity and durations.
* **Beta** systems (Nārāyaṇa, Mūla, Sthira) have their *rules* checked against
  PyJHora commit `48e57d2` and carry source-derived golden vectors, but they stay
  Beta until independent full-date comparisons against the JHora desktop
  application pass. Rule parity is not date parity.
* Ashtakavarga is pinned to the classical BPHS totals — per-planet BAV of
  48/49/39/54/56/52/39 summing to an SAV of 337. Those totals are properties of
  the bindu table, so they hold for every chart and catch any drift in the rules.
* Ṣaḍbala and Bhāva Bala components are labelled in the UI as exact or
  approximate (`~`). Do not read an approximated component as a precise value.

Run the suite with `npm test`. Every calculation module under `src/lib` has a
fixture; they exercise the real implementation, not a copy of it.

---

## Development

```bash
npm install
npm run dev
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Calculation fixtures (needs Node 22.6+) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

CI runs typecheck, tests and a production build on every push and pull request.
Lint currently reports pre-existing errors and is non-blocking.

---

## Tech

* Next.js 16 + React 19 + TypeScript
* Swiss Ephemeris via `swisseph-wasm`
* Tailwind CSS 4
* Runs fully in the browser; local storage for saved charts

---

## Status

Actively developed. Expect bugs, changes, and unfinished ideas.

---

## Disclaimer

This is a research tool. Use your own judgement.
