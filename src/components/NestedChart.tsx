'use client';

import { Fragment, useMemo, type ComponentProps } from 'react';
import { useTheme } from 'next-themes';
import type { PlanetData } from '@/types';
import { useHydrated } from '@/lib/useHydrated';
import { useChartFontScale } from '@/lib/chartFont';
import { useGrahaNames } from '@/lib/grahaNames';
import { formatDegree } from '@/lib/formatDegree';
import { normalizeDegrees } from '@/lib/angles';
import { layoutHouseLabels, type ExclusionBox, type LabelToken, type Point } from '@/lib/chartLabelLayout';
import { INNER_SQUARE, SOUTH_CENTRE, centroidOf, northRegions, southRegions, type NestedRegion } from '@/lib/nestedChart';
import { dashaMark, dignityColor } from './chartLayers';
import { FILL_MAX_WIDTH, useChartFill } from './chartFill';
import NorthIndianChart, { getNakAbbr } from './NorthIndianChart';
import { SIGN_ABBR } from '@/lib/signs';

type ChartProps = ComponentProps<typeof NorthIndianChart>;

type Props = {
  /** The layout of the houses: the North Indian diamond or the South Indian square. */
  shape: 'north' | 'south';
  /** The chart whose planets are in the outer parts of the houses, and the one whose planets are in the inner parts. */
  outer: ChartProps;
  inner: ChartProps;
  /** What the two charts are, for the middle of the South Indian chart: for example "D9 Navāṃśa". */
  outerTitle: string;
  innerTitle: string;
  /** The words "outer chart" and "inner chart". */
  outerWord: string;
  innerWord: string;
};

const OUTER_PLANETS = ['Uranus', 'Neptune', 'Pluto'];
const SPECIAL_COLOR = '#d97706';
const ASCENDANT_COLOR = '#c026d3';
const HIGHLIGHT_COLOR = '#0891b2';
const BASE_LABEL_SIZE = 16;

const signForHouse = (lagnaSign: number, house: number) => ((lagnaSign + house - 2) % 12) + 1;

/**
 * A chart within a chart: the planets of one chart (say the navamsa) in the outer part of every house, those of another
 * (the rāśi chart) in the inner part. The houses are those of the inner chart's lagna in the North Indian layout, and the
 * signs in the South Indian one, so a planet is always in the house or the sign it is in, in whichever chart.
 */
export default function NestedChart({ shape, outer, inner, outerTitle, innerTitle, outerWord, innerWord }: Props) {
  const { resolvedTheme } = useTheme();
  const hydrated = useHydrated();
  const isDark = !hydrated || resolvedTheme === 'dark';
  const fill = useChartFill();
  const k = useChartFontScale();
  const { code: grahaCode } = useGrahaNames();
  const regions = useMemo(() => (shape === 'north' ? northRegions() : southRegions()), [shape]);

  const stroke = '#71717a';
  const base = isDark ? '#18181b' : '#ffffff';
  const outerFill = isDark ? 'rgba(190, 180, 90, 0.13)' : 'rgba(166, 160, 70, 0.17)';
  const innerFill = isDark ? 'rgba(161, 161, 170, 0.09)' : 'rgba(100, 116, 139, 0.10)';
  const squareStroke = isDark ? '#a8a23a' : '#8a8430';
  const signFill = isDark ? '#a1a1aa' : '#52525b';
  const planetFill = isDark ? '#e4e4e7' : '#27272a';
  const dignity = inner.colorByDignity === true;

  const planetLabel = (layer: ChartProps, planet: PlanetData) => {
    const parts = [grahaCode(planet.name) + (planet.isRetrograde ? '℞' : '') + dashaMark(planet.name, layer.dashaLords ?? null)];
    if ((layer.degreePrecision ?? 'off') !== 'off') parts.push(formatDegree(planet.degree, layer.degreePrecision!));
    if (layer.showCharaKaraka && layer.karakaByPlanet?.[planet.name]) parts.push(layer.karakaByPlanet[planet.name]);
    if (layer.showNakshatra) parts.push(getNakAbbr(normalizeDegrees(planet.longitude + (layer.nakshatraAdjust ?? 0))));
    return parts.join(' ');
  };

  /** The labels of one chart in one sign: its lagna, its planets and its special points. */
  const tokensIn = (layer: ChartProps, sign: number): LabelToken[] => {
    const tokens: LabelToken[] = [];
    if (sign === layer.ascendantSign) {
      tokens.push({ key: 'asc', group: 'asc', text: layer.ascendantDegree !== undefined ? `Asc ${formatDegree(layer.ascendantDegree, (layer.degreePrecision ?? 'off') === 'off' ? 'minute' : layer.degreePrecision!)}` : 'Asc' });
    }
    if (layer.showNatalPlanets !== false) {
      const visible = layer.showOuterPlanets ? layer.planets : layer.planets.filter(planet => !OUTER_PLANETS.includes(planet.name));
      visible.filter(planet => planet.sign === sign).forEach(planet => tokens.push({ key: `na-${planet.name}`, group: 'natal', text: planetLabel(layer, planet) }));
    }
    if (layer.showSpecialLagnas) {
      (layer.specialLagnas ?? []).filter(special => special.sign === sign).forEach((special, index) => tokens.push({ key: `sl-${special.name}-${index}`, group: 'special', text: special.name }));
    }
    return tokens;
  };

  const isHighlighted = (layer: ChartProps, name: string) =>
    layer.highlightPlanet === name || (layer.selectedPlanet?.kind === 'natal' && layer.selectedPlanet.name === name);

  const renderRows = (layer: ChartProps, sign: number, tokens: LabelToken[], polygon: Point[], exclude: ExclusionBox[], keyPrefix: string) => {
    if (tokens.length === 0 || polygon.length < 3) return null;
    const layout = layoutHouseLabels(
      tokens,
      { polygon, exclude, anchorY: centroidOf(polygon)[1] },
      { maxFontSize: BASE_LABEL_SIZE * k, minFontSize: 5 * k, padding: 2 },
    );
    return layout.rows.map((row, rowIndex) => (
      <text
        key={`${keyPrefix}-${rowIndex}`}
        x={row.x}
        y={row.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={row.fontSize}
        fontWeight={row.group === 'asc' ? 800 : 700}
        opacity={row.group === 'special' ? 0.85 : 1}
      >
        {row.tokens.map((token, index) => {
          const name = token.group === 'natal' ? token.key.slice('na-'.length) : null;
          const highlighted = name !== null && isHighlighted(layer, name);
          const clickable = name !== null && (layer.onPlanetClick !== undefined || layer.onPlanetSelect !== undefined);
          const click = () => {
            if (name === null) return;
            if (layer.onPlanetSelect) layer.onPlanetSelect({ kind: 'natal', name });
            else layer.onPlanetClick?.(name);
          };
          return (
            <Fragment key={token.key}>
              {index > 0 ? ' ' : ''}
              <tspan
                fill={highlighted ? HIGHLIGHT_COLOR
                  : token.group === 'natal' ? (dignity && name ? dignityColor(name, sign, isDark) : undefined) ?? planetFill
                  : token.group === 'special' ? SPECIAL_COLOR
                  : ASCENDANT_COLOR}
                textDecoration={highlighted ? 'underline' : undefined}
                onClick={clickable ? click : undefined}
                style={clickable ? { cursor: 'pointer' } : undefined}
              >
                {token.text}
              </tspan>
            </Fragment>
          );
        })}
      </text>
    ));
  };

  const points = (polygon: readonly Point[]) => polygon.map(([x, y]) => `${x},${y}`).join(' ');
  const showSigns = inner.showSigns !== false;

  return (
    <div className={fill ? 'w-full mx-auto' : 'w-full max-w-[680px] mx-auto'} style={fill ? { maxWidth: FILL_MAX_WIDTH } : undefined} data-chart="nested" data-nested-shape={shape}>
      <svg viewBox="-25 -25 550 550" className="h-auto w-full overflow-visible" role="img" aria-label={shape === 'north' ? 'North Indian chart within a chart' : 'South Indian chart within a chart'}>
        {regions.map((region: NestedRegion) => {
          const sign = shape === 'north' ? signForHouse(inner.ascendantSign, region.house!) : region.sign!;
          const [signX, signY] = region.signAt;
          const exclude: ExclusionBox[] = showSigns ? [{ x0: signX - 14 * k, x1: signX + 14 * k, y0: signY - 9 * k, y1: signY + 8 * k }] : [];
          return (
            <g key={shape === 'north' ? `h${region.house}` : `s${region.sign}`}>
              {/* The whole house in the outer chart's colour, and the inner part of it on top in the inner chart's. */}
              <polygon points={points(region.polygon)} fill={base} />
              <polygon points={points(region.polygon)} fill={outerFill} />
              {region.inner.length >= 3 && <polygon points={points(region.inner)} fill={base} />}
              {region.inner.length >= 3 && <polygon points={points(region.inner)} fill={innerFill} />}
              <polygon points={points(region.polygon)} fill="none" stroke={stroke} strokeWidth="2" />
              {showSigns && (
                <text x={signX} y={signY} textAnchor="middle" dominantBaseline="middle" fontSize={11 * k} fontWeight="600" fill={signFill}>
                  {SIGN_ABBR[sign - 1]}
                </text>
              )}
              {renderRows(outer, sign, tokensIn(outer, sign), region.outer, [], `o-${sign}`)}
              {renderRows(inner, sign, tokensIn(inner, sign), region.inner, exclude, `i-${sign}`)}
            </g>
          );
        })}
        {shape === 'south' && (
          <rect x={SOUTH_CENTRE.x0} y={SOUTH_CENTRE.y0} width={SOUTH_CENTRE.x1 - SOUTH_CENTRE.x0} height={SOUTH_CENTRE.y1 - SOUTH_CENTRE.y0} fill={innerFill} stroke={stroke} strokeWidth="2" />
        )}
        {/* The square that is the inner chart's own. */}
        <rect x={INNER_SQUARE.x0} y={INNER_SQUARE.y0} width={INNER_SQUARE.x1 - INNER_SQUARE.x0} height={INNER_SQUARE.y1 - INNER_SQUARE.y0} fill="none" stroke={squareStroke} strokeWidth="1.5" pointerEvents="none" />
        {shape === 'south' && (
          <g textAnchor="middle" fill={planetFill} pointerEvents="none">
            <text x="250" y="190" fontSize={10 * k} fill={signFill}>{outerWord}</text>
            <text x="250" y="222" fontSize={20 * k} fontWeight="600">{outerTitle}</text>
            <text x="250" y="290" fontSize={10 * k} fill={signFill}>{innerWord}</text>
            <text x="250" y="322" fontSize={20 * k} fontWeight="600">{innerTitle}</text>
          </g>
        )}
      </svg>
    </div>
  );
}
