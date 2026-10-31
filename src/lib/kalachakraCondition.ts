import { combustionOf } from './combustion';
import { DEBILITATION, EXALTATION, MOOLATRIKONA, NATURAL_FRIENDS, OWN_SIGNS } from './dignity';
import { navamshaSign } from './birthConditions';
import { SIGN_LORDS, signName } from './signs';
import type { ConditionFact, ConditionResult } from './nakshatraSystems';

/**
 * When the Kālachakra daśā is taken (Phaladīpikā 22.30, "kālacakradaśā jñeyā candrāṁśeśe balānvite"): when the lord of the navāṁśa the Moon is in is strong.
 * The text does not say what strong is; the Phaladīpikā's own account of the strength of a graha (4.3–4) is followed: strong in its exaltation sign, its own sign
 * or mūlatrikoṇa, or a friend's sign; a retrograde graha is strong whatever its sign (4.4); a combust one is weak even in its exaltation (4.4); a debilitated one is weak.
 */
export const KALACHAKRA_CONDITION = 'The lord of the navāṁśa that the Moon is in is strong: in its exaltation, own or mūlatrikoṇa sign or a friend\'s sign (or retrograde), and not combust. Otherwise the daśā that rests on the nakṣatras is taken.';

interface P { name: string; longitude: number; sign: number; isRetrograde?: boolean }

export function evaluateKalachakraCondition(planets: P[]): ConditionResult {
  const moon = planets.find(planet => planet.name === 'Moon');
  if (!moon) return { met: null, facts: [{ template: 'The Moon is not known' }] };
  const sign = navamshaSign(moon.longitude);
  const lordName = SIGN_LORDS[sign - 1];
  const facts: ConditionFact[] = [{ template: 'The navāṁśa of the Moon is {sign}, ruled by {lord}', values: { sign: signName(sign), lord: lordName } }];
  const lord = planets.find(planet => planet.name === lordName);
  if (!lord) return { met: null, facts: [...facts, { template: '{lord} is not known', values: { lord: lordName } }] };
  const sun = planets.find(planet => planet.name === 'Sun');
  const combust = sun ? combustionOf(lord.name, lord.longitude, sun.longitude, lord.isRetrograde === true) !== null : false;
  const signLord = SIGN_LORDS[lord.sign - 1];
  const place = EXALTATION[lord.name] === lord.sign ? 'exalted'
    : DEBILITATION[lord.name] === lord.sign ? 'debilitated'
    : MOOLATRIKONA[lord.name] === lord.sign || OWN_SIGNS[lord.name]?.includes(lord.sign) ? 'own'
    : NATURAL_FRIENDS[lord.name]?.includes(signLord) ? 'friend' : 'other';
  const retrograde = lord.isRetrograde === true;
  const strong = !combust && (retrograde || place === 'exalted' || place === 'own' || place === 'friend');
  facts.push({ template: `{lord} is in {at}: ${place === 'exalted' ? 'exalted' : place === 'own' ? 'its own sign' : place === 'friend' ? 'a friend\'s sign' : place === 'debilitated' ? 'debilitated' : 'neither its own nor a friend\'s sign'}`, values: { lord: lordName, at: signName(lord.sign) } });
  if (retrograde) facts.push({ template: '{lord} is retrograde', values: { lord: lordName } });
  if (combust) facts.push({ template: '{lord} is combust', values: { lord: lordName } });
  return { met: strong, facts };
}
