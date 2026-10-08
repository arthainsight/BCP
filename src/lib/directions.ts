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

export interface BodyInSign {
  name: string;
  /** Sign 1–12. */
  sign: number;
}

export interface DirectionPlacement {
  name: string;
  sign: number;
  house: number;
  direction: Direction;
  /** The graha stands in the direction where it has Dig Bala. */
  digBala: boolean;
  transit: boolean;
}

/**
 * Sorts the grahas (and the ascendant) into the four directions, by the sign
 * they stand in or by their house from the ascendant. The result lists each
 * direction in the order of the input.
 */
export function placeByDirection(
  ascendantSign: number,
  natal: BodyInSign[],
  transit: BodyInSign[] = [],
  mode: DirectionMode = 'sign',
): Record<Direction, DirectionPlacement[]> {
  const result: Record<Direction, DirectionPlacement[]> = { North: [], East: [], South: [], West: [] };
  const add = (body: BodyInSign, isTransit: boolean) => {
    const house = ((body.sign - ascendantSign + 12) % 12) + 1;
    const direction = mode === 'sign' ? signDirection(body.sign) : houseDirection(house);
    result[direction].push({
      name: body.name,
      sign: body.sign,
      house,
      direction,
      digBala: DIG_BALA_DIRECTION[body.name] === direction,
      transit: isTransit,
    });
  };
  natal.forEach(body => add(body, false));
  transit.forEach(body => add(body, true));
  return result;
}
