// The compass directions of the zodiac and of the houses.
//
// The fire signs belong to the east, the earth signs to the south, the air
// signs to the west and the water signs to the north. The houses follow the
// same turn from the ascendant: the 1st house is east, the 10th south, the
// 7th west and the 4th north, and the houses between them take the direction
// of the sign that would stand there for an Aries ascendant.

export type Direction = 'North' | 'East' | 'South' | 'West';
export type DirectionMode = 'sign' | 'house';

export const DIRECTIONS: Direction[] = ['North', 'East', 'South', 'West'];

/** Direction of each sign, 1 = Aries … 12 = Pisces. */
export function signDirection(sign: number): Direction {
  return (['East', 'South', 'West', 'North'] as const)[(((sign - 1) % 4) + 4) % 4];
}

/** Direction of a house, 1–12, from the ascendant. */
export function houseDirection(house: number): Direction {
  return signDirection(house);
}

/** The direction in which a graha has Dig Bala (directional strength). */
export const DIG_BALA_DIRECTION: Record<string, Direction> = {
  Jupiter: 'East', Mercury: 'East',
  Sun: 'South', Mars: 'South',
  Saturn: 'West',
  Moon: 'North', Venus: 'North',
};

export interface DirectionBody {
  name: string;
  /** Sign 1–12. */
  sign: number;
  /** Degrees within the sign, 0–30. */
  degree: number;
  retrograde: boolean;
  transit?: boolean;
}

export interface CompassItem extends DirectionBody {
  house: number;
  direction: Direction;
  /** The graha stands in the direction where it has Dig Bala. */
  digBala: boolean;
  transit: boolean;
}

export interface AspectItem extends CompassItem {
  /** The sign the retrograde graha stands in; `sign` is the one it aspects, the 12th from it. */
  fromSign: number;
}

export interface Compass {
  /** The grahas in each direction, in ascending order of their degree within the sign. */
  bodies: Record<Direction, CompassItem[]>;
  /** The retrograde grahas, written in the direction of the sign they aspect (the 12th from their own). */
  aspects: Record<Direction, AspectItem[]>;
}

/** The nodes always move backwards; they have no separate aspect on the 12th. */
const NODES = ['Rahu', 'Ketu'];

const byDegree = <T extends { degree: number }>(a: T, b: T) => a.degree - b.degree;

/**
 * The directional chart of the Nadi: every graha is written in the direction of its sign (or of its
 * house from the ascendant), the grahas of a direction in ascending order of their degree, from the left.
 * A retrograde graha (not the nodes) casts its aspect on the 12th sign, so it is also written, in brackets,
 * in the direction of that sign.
 */
export function buildCompass(ascendantSign: number, bodies: DirectionBody[], mode: DirectionMode = 'sign'): Compass {
  const houseOf = (sign: number) => ((sign - ascendantSign + 12) % 12) + 1;
  const directionOf = (sign: number) => (mode === 'sign' ? signDirection(sign) : houseDirection(houseOf(sign)));
  const result: Compass = {
    bodies: { North: [], East: [], South: [], West: [] },
    aspects: { North: [], East: [], South: [], West: [] },
  };
  for (const body of bodies) {
    const direction = directionOf(body.sign);
    result.bodies[direction].push({
      ...body,
      transit: body.transit === true,
      house: houseOf(body.sign),
      direction,
      digBala: DIG_BALA_DIRECTION[body.name] === direction,
    });
    if (body.retrograde && !NODES.includes(body.name)) {
      const aspected = body.sign === 1 ? 12 : body.sign - 1;
      const aspectDirection = directionOf(aspected);
      result.aspects[aspectDirection].push({
        ...body,
        transit: body.transit === true,
        sign: aspected,
        fromSign: body.sign,
        house: houseOf(aspected),
        direction: aspectDirection,
        digBala: false,
      });
    }
  }
  for (const direction of DIRECTIONS) {
    result.bodies[direction].sort(byDegree);
    result.aspects[direction].sort(byDegree);
  }
  return result;
}
