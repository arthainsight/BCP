import assert from 'node:assert/strict';
import { FI } from './i18n';
import { translateDashaText } from './dashaText';

// The dasha code writes notes and reasons in English; with the Finnish dictionary
// every one of them comes out in Finnish, with its numbers in place.
const fi = (text: string) => FI[text] ?? text;
const en = (text: string) => text;

assert.equal(translateDashaText('Conditional: not applicable (11H Rahu from Lagna lord)', fi), 'Ehdollinen: ei sovellettavissa (Rahu 11. talossa Lagnan herrasta)');
assert.equal(
  translateDashaText('Conditional: not applicable (Moon in 4H; used with the Moon in 2, 3, 6, 8, 11, 12)', fi),
  'Ehdollinen: ei sovellettavissa (Moon 4. talossa; käytetään, kun Moon on talossa 2, 3, 6, 8, 11, 12)',
);
assert.equal(translateDashaText('Rahu is 6H from Lagna lord Venus', fi), 'Rahu on 6. talossa Lagnan herrasta Venus');
assert.equal(translateDashaText('Rahu is outside Lagna (sign 3)', fi), 'Rahu on Lagnan ulkopuolella (merkki 3)');
assert.equal(translateDashaText('Mars position unavailable', fi), 'Mars: sijainti ei saatavilla');
assert.equal(translateDashaText('Rahu position unavailable', fi), 'Rahun sijainti ei saatavilla');
for (const text of ['Date is before birth', 'Date is outside the calculated cycle', 'Moon unavailable', 'Calculation unavailable', 'Rahu occupies Lagna', 'Relative house unavailable', 'Kendra/trikona condition is met', 'Kendra/trikona condition is not met', 'BPHS/PVR Rahu condition', 'Condition met', 'Forced · condition not met',
  // The reasons of the second condition of the Aṣṭottarī (46.23) and the facts of the conditions of the eight daśās of 46.24–43.
  'Born by day in the dark half of the month', 'Born by day in the bright half of the month', 'Born by night in the dark half of the month', 'Born by night in the bright half of the month',
  'Day with the dark half or night with the bright half: the condition of 46.23 is met', 'Day with the dark half or night with the bright half: the condition of 46.23 is not met',
  "The Lagna is in the Sun's hora", "The Lagna is in the Moon's hora", 'The Sun or the Moon is not known']) {
  assert.notEqual(translateDashaText(text, fi), text, `${text} has a Finnish text`);
}
// English stays as it is.
assert.equal(translateDashaText('Rahu is 6H from Lagna lord Venus', en), 'Rahu is 6H from Lagna lord Venus');
