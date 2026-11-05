import type { BhriguGrahaProgression, BhriguPada } from '@/lib/bhriguPadaProgression';
import { SIGN_LORDS } from '@/lib/signs';

export type FinancialDictum = { number: number; page: number; summaryFi: string; automation: 'automatic' | 'partial' | 'manual' };

export const NADI_PRAVESIKA_FINANCIAL_DICTUMS: readonly FinancialDictum[] = [
{ number: 1, page: 217, summaryFi: 'Grahan vaikutukset voimistuvat, kun se etenee kendrassa suhteessa syntymämerkkiinsä.', automation: 'automatic' },
{ number: 2, page: 217, summaryFi: 'Seitsemäs merkki syntymämerkistä on vaikea etenemispaikka, erityisesti Saturnukselle ja Rahulle.', automation: 'automatic' },
{ number: 3, page: 217, summaryFi: 'A8:n eli Mrityupadan hallitsijan kendra-eteneminen syntymämerkistä on erityisen vaikea.', automation: 'automatic' },
{ number: 4, page: 217, summaryFi: 'A8-hallitsijan eteneminen 3., 5., 9., 11. tai 12. huoneessa Lagnasta lieventää kahdeksannen huoneen haittoja.', automation: 'automatic' },
{ number: 5, page: 218, summaryFi: 'Saturnuksen, Jupiterin, Rahun ja osin Marsin eteneminen muokkaa muita Bhṛgu Pada -jaksoja.', automation: 'partial' },
{ number: 6, page: 218, summaryFi: 'Graha voimistaa huoneen tuloksia kulkiessaan huoneessa, jonka Arudha Padan hallitsija se on.', automation: 'automatic' },
{ number: 7, page: 218, summaryFi: 'AL- ja A2-hallitsijoiden eteneminen 6., 8. tai 12. huoneessa on haitallinen Lagnan ja toisen huoneen asioille.', automation: 'automatic' },
{ number: 8, page: 218, summaryFi: 'Huoneen vaikutus korostuu, jos sama graha aspektioi sitä sekä syntymä- että progressiokartassa.', automation: 'manual' },
{ number: 9, page: 218, summaryFi: 'AL-hallitsija suojaa voimakkaasti kendra-etenemisessä syntymämerkkiinsä nähden, paitsi jos etenemispaikka on 6., 8. tai 12. huone.', automation: 'automatic' },
{ number: 10, page: 218, summaryFi: 'AL-hallitsijan eteneminen 6., 8. tai 12. huoneessa heikentää muiden Pada-daśā-jaksojen hyötyjä.', automation: 'automatic' },
{ number: 11, page: 218, summaryFi: 'Huoneen hallitsijan ja sen Arudha Padan hallitsijan keskinäinen kendra-asema progressioissa voimistaa huoneen tuloksia.', automation: 'partial' },
{ number: 12, page: 219, summaryFi: 'Menetelmä soveltuu sekä trooppiseen että sideeriseen karttaan; yhtenevät progressiopaikat tarkentavat ajoitusta.', automation: 'manual' },
{ number: 13, page: 219, summaryFi: 'Marsin neljännen 14-vuotisen kierroksen (42–56 vuotta) koko jaksoa pidetään voimakkaana.', automation: 'automatic' },
{ number: 14, page: 219, summaryFi: 'Jupiterin kuudes (34 v 7 kk–41 v 6 kk) ja yhdeksäs (55 v 4 kk–62 v 3 kk) alajakso ovat voimakkaita.', automation: 'automatic' },
{ number: 15, page: 219, summaryFi: 'Saturnuksen kolmannen kierroksen ensimmäistä vuotta (59. ikävuosi) pidetään voimakkaana.', automation: 'automatic' },
{ number: 16, page: 219, summaryFi: 'Uusi tulosjakso alkaa, kun etenevä graha siirtyy uuteen nakṣatraan.', automation: 'manual' },
{ number: 17, page: 219, summaryFi: 'Käynnissä olevan Vimśottarī-daśān MD- ja AD-hallitsijoiden keskinäinen kendra progressioissa muodostaa Bhṛgu Rāja Yogān.', automation: 'manual' },
{ number: 18, page: 220, summaryFi: 'Syntymäkartan polttama graha antaa progressiossa heikkoja tuloksia; sen yhtymäkumppani korostuu.', automation: 'partial' },
{ number: 19, page: 220, summaryFi: 'Rahu-daśāssa Rahun ja sen merkkihallitsijan progressioiden 1–7-akseli on vaikea.', automation: 'manual' },
{ number: 20, page: 220, summaryFi: 'Tietyissä Rahu–Aurinko-syntymäyhteyksissä Rahun eteneminen Auringon tai Leijonan yli voi heikentää Auringon merkityksiä Rahu-jaksoissa.', automation: 'manual' },
{ number: 21, page: 220, summaryFi: 'Tietyissä Rahu–Kuu-syntymäyhteyksissä Rahun eteneminen Kuun tai Ravun yli voi heikentää Kuun merkityksiä Rahu-jaksoissa.', automation: 'manual' },
{ number: 22, page: 220, summaryFi: 'Tietyissä Rahu–Mars-syntymäyhteyksissä Rahun eteneminen Marsin, Oinaan tai Skorpionin yli voi heikentää Marsin merkityksiä Rahu-jaksoissa.', automation: 'manual' },
{ number: 23, page: 221, summaryFi: 'Grahan eteneminen syntymäkartan 11. huoneessa voi tuoda vaurautta, jos progressio ei ole retrogradinen eikä haitallinen argalā vaivaa sitä; erityisesti A2-, A11- ja 11. huoneen hallitsijat mainitaan.', automation: 'partial' },
] as const;

export function applicableFinancialDictums(progression: BhriguGrahaProgression, ageYears: number, padas: readonly BhriguPada[]): number[] {
  const kendra = [1, 4, 7, 10].includes(progression.houseFromNatal);
  const difficult = [6, 8, 12].includes(progression.houseFromLagna);
  const al = padas.find(p => p.house === 1);
  const a2 = padas.find(p => p.house === 2);
  const a8 = padas.find(p => p.house === 8);
  const alLord = al ? SIGN_LORDS[al.sign - 1] : undefined;
  const a2Lord = a2 ? SIGN_LORDS[a2.sign - 1] : undefined;
  const a8Lord = a8 ? SIGN_LORDS[a8.sign - 1] : undefined;
  const rules = new Set<number>();
  if (kendra) rules.add(1);
  if (progression.houseFromNatal === 7) rules.add(2);
  if (progression.body === a8Lord && kendra) rules.add(3);
  if (progression.body === a8Lord && [3, 5, 9, 11, 12].includes(progression.houseFromLagna)) rules.add(4);
  const currentPada = padas.find(p => p.house === progression.houseFromLagna);
  if (currentPada && progression.body === SIGN_LORDS[currentPada.sign - 1]) rules.add(6);
  if ((progression.body === alLord || progression.body === a2Lord) && difficult) rules.add(7);
  if (progression.body === alLord && kendra && !difficult) rules.add(9);
  if (progression.body === alLord && difficult) rules.add(10);
  if (progression.body === 'Mars' && ageYears >= 42 && ageYears < 56) rules.add(13);
  if (progression.body === 'Jupiter' && ((ageYears >= 34 + 7 / 12 && ageYears < 41 + 6 / 12) || (ageYears >= 55 + 4 / 12 && ageYears < 62 + 3 / 12))) rules.add(14);
  if (progression.body === 'Saturn' && ageYears >= 58 && ageYears < 59) rules.add(15);
  // D23 remains provisional until progression retrograde and argala are evaluated.
  if (progression.houseFromLagna === 11) rules.add(23);
  return [...rules].sort((a, b) => a - b);
}