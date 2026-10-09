// The directions of the zodiac, as the directional chart of the Nadi uses them: the direction belongs to the
// sign. The fire signs are east, the earth signs south, the air signs west and the water signs north.

export type Direction = 'North' | 'East' | 'South' | 'West';

export const DIRECTIONS: Direction[] = ['North', 'East', 'South', 'West'];

/** Direction of each sign, 1 = Aries … 12 = Pisces. */
export function signDirection(sign: number): Direction {
  return (['East', 'South', 'West', 'North'] as const)[(((sign - 1) % 4) + 4) % 4];
}

export interface DirectionBody {
  name: string;
  /** Sign 1–12. */
  sign: number;
  /** Degrees within the sign, 0–30. */
  degree: number;
  retrograde: boolean;
}

export interface CompassItem extends DirectionBody {
  direction: Direction;
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
 * The directional chart of the Nadi: every graha is written in the direction of its sign, the grahas of a
 * direction in ascending order of their degree, from the left. A retrograde graha (not the nodes) casts its
 * aspect on the 12th sign, so it is also written, in brackets, in the direction of that sign.
 */
export function buildCompass(bodies: DirectionBody[]): Compass {
  const result: Compass = {
    bodies: { North: [], East: [], South: [], West: [] },
    aspects: { North: [], East: [], South: [], West: [] },
  };
  for (const body of bodies) {
    const direction = signDirection(body.sign);
    result.bodies[direction].push({ ...body, direction });
    if (body.retrograde && !NODES.includes(body.name)) {
      const aspected = body.sign === 1 ? 12 : body.sign - 1;
      const aspectDirection = signDirection(aspected);
      result.aspects[aspectDirection].push({ ...body, sign: aspected, fromSign: body.sign, direction: aspectDirection });
    }
  }
  for (const direction of DIRECTIONS) {
    result.bodies[direction].sort(byDegree);
    result.aspects[direction].sort(byDegree);
  }
  return result;
}
