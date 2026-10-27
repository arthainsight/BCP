import type { PanchangResult } from './index';

export interface DailyPanchangNarrative {
  overview: string;
  work: string;
  finances: string;
  relationships: string;
  spiritual: string;
  practicalAdvice: string;
}

type Influence = { themes: string[]; challenges: string[]; action: string };

const VARA: Record<string, Influence & { planet: string }> = {
  Sunday: { planet: 'Sun', themes: ['purpose', 'visibility', 'leadership'], challenges: ['pride', 'trying to control the outcome'], action: 'make the purpose clear before seeking recognition' },
  Monday: { planet: 'Moon', themes: ['emotional awareness', 'care', 'adaptability'], challenges: ['mood-driven choices', 'taking things personally'], action: 'make room for feelings without letting a passing mood decide everything' },
  Tuesday: { planet: 'Mars', themes: ['initiative', 'courage', 'decisive action'], challenges: ['impatience', 'unnecessary conflict'], action: 'turn energy into one deliberate action' },
  Wednesday: { planet: 'Mercury', themes: ['communication', 'learning', 'practical problem-solving'], challenges: ['scattered attention', 'overthinking'], action: 'write down the key question and verify the details' },
  Thursday: { planet: 'Jupiter', themes: ['judgment', 'learning', 'long-term perspective'], challenges: ['overconfidence', 'overpromising'], action: 'consider the long-term consequences and keep promises realistic' },
  Friday: { planet: 'Venus', themes: ['connection', 'creativity', 'appreciation'], challenges: ['people-pleasing', 'choosing comfort over priorities'], action: 'make room for beauty and connection without neglecting essentials' },
  Saturday: { planet: 'Saturn', themes: ['discipline', 'patience', 'responsibility'], challenges: ['pessimism', 'making progress feel harder than it is'], action: 'work steadily on what is within your control' },
};

const NAKSHATRA: Record<string, Influence> = {
  Ashwini: { themes: ['new beginnings', 'speed', 'healing', 'renewal'], challenges: ['rushing before the direction is clear', 'impatience'], action: 'begin with a small, reversible step' },
  Bharani: { themes: ['responsibility', 'endurance', 'boundaries', 'transformation', 'justice'], challenges: ['carrying too much', 'reacting intensely'], action: 'decide what is yours to carry and what needs a boundary' },
  Krittika: { themes: ['discernment', 'truth', 'creativity', 'honesty'], challenges: ['harsh criticism', 'rigidity'], action: 'be direct without being needlessly cutting' },
  Rohini: { themes: ['growth', 'nourishment', 'creativity', 'comfort', 'relationships'], challenges: ['jealousy', 'attachment to comfort or results'], action: 'nurture what matters while allowing it room to change' },
  Mrigashira: { themes: ['curiosity', 'searching', 'compassion', 'exploration'], challenges: ['indecision', 'restlessness'], action: 'set a limit on research and choose the next useful experiment' },
  Ardra: { themes: ['change', 'technology', 'invention', 'mental energy', 'freedom'], challenges: ['chaos', 'disappointment', 'self-centred reactions'], action: 'use disruption to identify what genuinely needs to change' },
  Punarvasu: { themes: ['renewal', 'optimism', 'lightness', 'manifestation'], challenges: ['difficulty choosing'], action: 'return to what works and choose one direction for now' },
  Pushya: { themes: ['expansion', 'teaching', 'generosity', 'trust', 'ambition'], challenges: ['overextending yourself to help others'], action: 'support growth with practical limits and clear priorities' },
  Ashlesha: { themes: ['sensitivity', 'flexibility', 'privacy', 'intelligence', 'independence'], challenges: ['tension', 'excessive attachment', 'indirect communication'], action: 'use insight carefully and state boundaries plainly' },
  Magha: { themes: ['tradition', 'roots', 'authority', 'success', 'wisdom'], challenges: ['anger', 'control', 'identity tied to status'], action: 'use authority responsibly without being ruled by reputation' },
  'Purva Phalguni': { themes: ['curiosity', 'beauty', 'comfort', 'passion', 'relationships', 'diplomacy'], challenges: ['carelessness', 'avoiding effort'], action: 'enjoy connection while keeping commitments in view' },
  'Uttara Phalguni': { themes: ['leadership', 'reliability', 'organisation', 'insight', 'honesty'], challenges: ['stubbornness', 'judgment', 'coldness'], action: 'turn principles into fair agreements and dependable follow-through' },
  Hasta: { themes: ['sensitivity', 'skill', 'creativity', 'detail', 'organisation', 'healing'], challenges: ['fragility', 'calculation', 'overcontrol'], action: 'make something useful through patient attention to detail' },
  Chitra: { themes: ['innovation', 'individuality', 'charisma', 'harmony', 'willpower'], challenges: ['vanity', 'excessive self-focus', 'ambition without balance'], action: 'improve the substance as carefully as the presentation' },
  Swati: { themes: ['freedom', 'breath', 'creative thinking', 'learning', 'balance'], challenges: ['impatience', 'inconsistency', 'excessive desire'], action: 'protect independence while choosing a steady direction' },
  Vishakha: { themes: ['ambition', 'innovation', 'courage', 'persistence', 'devotion'], challenges: ['indecision', 'impulsivity', 'envy', 'fixation on winning'], action: 'choose a milestone and pursue it without losing perspective' },
  Anuradha: { themes: ['devotion', 'loyalty', 'intuition', 'spirituality', 'progress'], challenges: ['jealousy', 'overattachment', 'self-sacrifice without limits'], action: 'combine loyalty with honest communication and healthy boundaries' },
  Jyeshtha: { themes: ['competence', 'vigilance', 'warrior spirit', 'control'], challenges: ['overthinking', 'hypervigilance', 'trying to control everything'], action: 'distinguish genuine risks from problems imagined through constant alertness' },
  Mula: { themes: ['roots', 'truth', 'investigation', 'revolution', 'deep change'], challenges: ['uprooting too quickly', 'eccentricity for its own sake'], action: 'investigate root causes before dismantling what exists' },
  'Purva Ashadha': { themes: ['flow', 'early victory', 'intrinsic motivation', 'charisma', 'purpose'], challenges: ['inflexibility'], action: 'act from purpose while staying open to evidence and feedback' },
  'Uttara Ashadha': { themes: ['leadership', 'many skills', 'lasting victory', 'delegation'], challenges: ['skepticism becoming rigidity'], action: 'build durable progress by sharing responsibility appropriately' },
  Shravana: { themes: ['listening', 'empathy', 'networking', 'boundaries', 'devotion'], challenges: ['overload', 'taking in more than you can process'], action: 'listen carefully, then make space to reflect before responding' },
  Dhanishta: { themes: ['courage', 'rhythm', 'ambition', 'music', 'coordination'], challenges: ['greed', 'pride', 'measuring worth only by status'], action: 'find a sustainable rhythm and coordinate effort with others' },
  Shatabhisha: { themes: ['research', 'healing symbolism', 'independence', 'the big picture'], challenges: ['isolation', 'withdrawing instead of seeking support'], action: 'step back to see the pattern, then reconnect with practical support' },
  'Purva Bhadrapada': { themes: ['intensity', 'kundalini symbolism', 'austerity', 'deep conviction'], challenges: ['fanaticism', 'all-or-nothing thinking'], action: 'give strong convictions a grounded, measured expression' },
  'Uttara Bhadrapada': { themes: ['depth', 'wisdom', 'stability', 'patience', 'inner strength', 'compassion'], challenges: ['passivity', 'suppressed feelings', 'isolation', 'fatalism'], action: 'combine inner steadiness with one concrete, compassionate action' },
  Revati: { themes: ['compassion', 'guidance', 'protection', 'intuition', 'creativity', 'completion', 'transition'], challenges: ['weak boundaries', 'escapism', 'over-rescuing', 'difficulty ending a cycle'], action: 'help where it is useful, maintain boundaries, and finish what is ready to end' },
};

const TITHI: Record<string, Influence> = {
  Pratipada: { themes: ['desire', 'passion', 'creativity', 'sensuality', 'compassion', 'love'], challenges: ['dissatisfaction', 'restlessness', 'attention-seeking'], action: 'give desire a constructive outlet instead of chasing approval' },
  Dwitiya: { themes: ['grounding', 'balance', 'confidence', 'patience', 'growth', 'feelings'], challenges: ['pride', 'oversaturation', 'emotional sensitivity'], action: 'build steadily and check that confidence stays grounded' },
  Tritiya: { themes: ['nourishment', 'effort', 'home', 'protection', 'harmony', 'forgiveness'], challenges: ['temperament', 'over-sensitivity', 'clinging to the comfort zone'], action: 'protect what matters while making room for necessary effort' },
  Chaturthi: { themes: ['intelligence', 'intuition', 'justice', 'truth', 'contentment'], challenges: ['vulnerability', 'laziness', 'emotional withdrawal', 'suppressed feelings'], action: 'name what you feel and check assumptions against facts' },
  Panchami: { themes: ['creativity', 'learning', 'optimism', 'faith', 'freedom', 'flexibility'], challenges: ['indecision', 'excessive compromise'], action: 'stay open-minded but commit to one practical next step' },
  Shashthi: { themes: ['passion', 'creativity', 'sacrifice', 'visualisation', 'stability', 'focus'], challenges: ['stubbornness', 'stress', 'ruthlessness', 'detachment'], action: 'turn an idea into action without sacrificing wellbeing or fairness' },
  Saptami: { themes: ['courage', 'grounding', 'practicality', 'service', 'dharma', 'order', 'routine'], challenges: ['workaholism or inertia', 'bluntness', 'emotional superficiality'], action: 'use a simple routine and make service sustainable' },
  Ashtami: { themes: ['nature', 'creative chaos', 'science', 'communication', 'speed', 'equality', 'balance'], challenges: ['changeable moods', 'emptiness', 'overstimulation'], action: 'channel restless energy into inquiry and restore balance with pauses' },
  Navami: { themes: ['roots', 'learning', 'teaching', 'innovation', 'confidence', 'individuality', 'generosity'], challenges: ['need for control', 'self-centredness', 'isolation'], action: 'lead with confidence while staying curious about other perspectives' },
  Dashami: { themes: ['imagination', 'creativity', 'relationships', 'connection', 'gathering knowledge', 'intuition'], challenges: ['confusion', 'daydreaming', 'self-focus', 'repetition'], action: 'translate imagination into a clear conversation or deliverable' },
  Ekadashi: { themes: ['inner strength', 'order', 'sharpness', 'search', 'inner fire', 'self-control', 'purification'], challenges: ['stress', 'excessive detachment', 'winning at any cost'], action: 'direct intensity toward disciplined effort rather than conflict' },
  Dwadashi: { themes: ['balance', 'eloquence', 'learning', 'moderation', 'justice', 'practicality', 'purity'], challenges: ['irrationality', 'overemphasis on winning'], action: 'make a fair, measured decision and explain it clearly' },
  Trayodashi: { themes: ['optimism', 'generosity', 'learning', 'teaching', 'social connection', 'freedom', 'gratitude'], challenges: ['impatience', 'excessive expectations', 'compensating for insecurity'], action: 'pair generosity with realistic expectations and gratitude' },
  Chaturdashi: { themes: ['passion', 'devotion', 'truth', 'honesty', 'transformation', 'independence'], challenges: ['attention-seeking', 'impulsivity', 'need for control'], action: 'pause before acting on an intense impulse and be honest about the motive' },
  Amavasya: { themes: ['inwardness', 'rest', 'closure', 'reflection', 'renewal'], challenges: ['low clarity', 'withdrawal'], action: 'make space for reflection and avoid forcing certainty where information is missing' },
  Purnima: { themes: ['culmination', 'visibility', 'emotional fullness', 'sharing', 'completion'], challenges: ['overstimulation', 'exaggeration', 'emotional reactivity'], action: 'review what has come to fruition and respond thoughtfully rather than dramatically' },
};

const YOGA: Record<string, Influence> = {
  Vishkumbha: { themes: ['endurance', 'support', 'working under pressure'], challenges: ['feeling unrecognised', 'harsh communication'], action: 'set realistic limits and ask for support where needed' },
  Priti: { themes: ['affection', 'connection', 'happiness'], challenges: ['appearance over substance', 'talking more than acting'], action: 'show care through one specific, reliable action' },
  Ayushman: { themes: ['longevity symbolism', 'care', 'sustaining life'], challenges: ['taking responsibility for everyone'], action: 'invest in sustainable habits and practical support' },
  Saubhagya: { themes: ['skill', 'resourcefulness', 'careful use of resources'], challenges: ['excessive frugality'], action: 'use resources efficiently without becoming needlessly restrictive' },
  Shobhana: { themes: ['presence', 'beauty', 'determination'], challenges: ['dependence on approval'], action: 'let past difficulty strengthen resolve without making criticism your fuel' },
  Atiganda: { themes: ['intensity', 'extreme effort'], challenges: ['escalation', 'rigidity'], action: 'avoid unnecessary extremes and check the likely consequences' },
  Sukarma: { themes: ['constructive action', 'service', 'ambition'], challenges: ['helping only for personal gain'], action: 'make the benefit and motive of an action explicit' },
  Dhriti: { themes: ['patience', 'unconventional thinking', 'persistence'], challenges: ['waiting to exploit others’ mistakes'], action: 'use patience to solve the problem, not to set traps' },
  Shoola: { themes: ['psychological intensity', 'teaching through difficulty'], challenges: ['distrust', 'frustration', 'conflict'], action: 'avoid escalating sensitive conversations and check interpretations' },
  Ganda: { themes: ['money awareness', 'separation', 'complex transitions'], challenges: ['bitterness', 'emotional distance'], action: 'handle family or financial complexity with clarity and fairness' },
  Vriddhi: { themes: ['growth', 'ambition', 'accumulation'], challenges: ['displaying success for validation'], action: 'measure growth by durable value, not only by what is visible' },
  Dhruva: { themes: ['stability', 'reputation', 'idealism', 'teaching'], challenges: ['being fixed in one image or belief'], action: 'build on what is stable while remaining open to new evidence' },
  Vyaghata: { themes: ['force', 'competition', 'technical ingenuity'], challenges: ['cruelty', 'aggression', 'forcing outcomes'], action: 'choose de-escalation and safety over proving strength' },
  Harshana: { themes: ['excitement', 'creativity', 'invention'], challenges: ['rumours', 'power games', 'avoiding obligations'], action: 'channel excitement into creation and verify information before sharing it' },
  Vajra: { themes: ['strength', 'resilience', 'tools', 'decisiveness'], challenges: ['extremes', 'decisions that disregard others'], action: 'be firm about priorities while considering who is affected' },
  Siddhi: { themes: ['accomplishment', 'ease', 'generosity'], challenges: ['carelessness', 'overconfidence'], action: 'define what completion means and check the final details' },
  Vyatipata: { themes: ['upheaval', 'unexpected reversals'], challenges: ['self-sabotage', 'impulsive decisions'], action: 'slow down, protect essentials and review consequential choices' },
  Variyana: { themes: ['comfort', 'resources', 'expertise'], challenges: ['overindulgence', 'relationship complications'], action: 'enjoy what works while keeping agreements and spending clear' },
  Parigha: { themes: ['rules', 'barriers', 'oversight', 'management'], challenges: ['rigidity', 'using power unfairly'], action: 'identify the actual constraint and work within ethical boundaries' },
  Shiva: { themes: ['devotion', 'right action', 'contentment', 'renewal'], challenges: ['neglecting practical needs in pursuit of ideals'], action: 'act from values without abandoning ordinary responsibilities' },
  Siddha: { themes: ['precision', 'sensory awareness', 'planning', 'guidance'], challenges: ['perfectionism', 'overreliance on one method'], action: 'define the intended result and test the plan against reality' },
  Sadhya: { themes: ['mastery', 'goals', 'focused effort'], challenges: ['self-interest', 'using every resource without rest'], action: 'pursue the goal without treating health or people as expendable resources' },
  Shubha: { themes: ['auspicious beginnings', 'organisation', 'careful planning'], challenges: ['risk avoidance'], action: 'prepare well, then take a proportionate and considered step' },
  Shukla: { themes: ['clarity', 'learning', 'skill'], challenges: ['misjudging compatibility or expectations'], action: 'be clear about expectations before making a commitment' },
  Brahma: { themes: ['innovation', 'new methods', 'study', 'building'], challenges: ['overwork', 'lack of recognition'], action: 'give a new idea time, structure and support' },
  Indra: { themes: ['leadership', 'versatility', 'strategy'], challenges: ['instrumentalising others', 'emotional distance'], action: 'lead decisively while being transparent about trade-offs' },
  Vaidhriti: { themes: ['mediation', 'social connection', 'reconciliation'], challenges: ['avoiding necessary confrontation'], action: 'seek a fair resolution without concealing the real disagreement' },
};

const KARANA: Record<string, Influence> = {
  Bava: { themes: ['leadership', 'boundaries', 'governance', 'contribution'], challenges: ['dominance', 'overcontrol'], action: 'take responsibility and make expectations clear' },
  Balava: { themes: ['care', 'healing symbolism', 'counselling', 'emotional awareness'], challenges: ['emotional variability', 'over-caretaking'], action: 'offer support without assuming you must solve everything' },
  Kaulava: { themes: ['groups', 'friends', 'cooperation', 'physical action'], challenges: ['competition', 'group pressure'], action: 'coordinate with others while keeping your own judgment' },
  Taitila: { themes: ['writing', 'books', 'process', 'organised work'], challenges: ['overplanning'], action: 'turn information into a clear sequence of steps' },
  Gara: { themes: ['large visions', 'collective contribution', 'responsibility'], challenges: ['taking on too much', 'missing practical details'], action: 'break a broad aim into manageable tasks' },
  Garaja: { themes: ['large visions', 'collective contribution', 'responsibility'], challenges: ['taking on too much', 'missing practical details'], action: 'break a broad aim into manageable tasks' },
  Vanija: { themes: ['trade', 'finance', 'problem-solving', 'exchange'], challenges: ['transactional thinking', 'overfocus on gain'], action: 'make the value exchange fair and explicit' },
  Vishti: { themes: ['discipline', 'hard work', 'persistence'], challenges: ['friction', 'rigidity', 'unnecessary escalation'], action: 'handle necessary difficult work carefully and avoid forcing optional new starts' },
  Bhadra: { themes: ['discipline', 'hard work', 'persistence'], challenges: ['friction', 'rigidity', 'unnecessary escalation'], action: 'handle necessary difficult work carefully and avoid forcing optional new starts' },
  Shakuni: { themes: ['strategy', 'investigation', 'spotting opportunities'], challenges: ['secrecy', 'overcalculation'], action: 'research quietly but keep decisions ethical and verifiable' },
  Chatushpada: { themes: ['practical tasks', 'physical work', 'specialised effort'], challenges: ['hazardous shortcuts', 'unnecessary risk'], action: 'prioritise safety and avoid risky work without proper preparation' },
  Naga: { themes: ['planning', 'challenging power', 'protecting the vulnerable'], challenges: ['confrontation', 'suspicion'], action: 'plan carefully and choose a proportionate response' },
  Kimstughna: { themes: ['detail', 'specialised work', 'completion'], challenges: ['getting lost in details'], action: 'finish a bounded task and check the essentials' },
};

function normalise(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z ]/g, '').trim().replace(/\s+/g, ' ');
}
function lookup<T>(map: Record<string, T>, name: string): T | undefined {
  const wanted = normalise(name).toLowerCase();
  const key = Object.keys(map).find(k => normalise(k).toLowerCase() === wanted);
  return key ? map[key] : undefined;
}
function dedupe(items: string[]): string[] {
  return [...new Map(items.map(item => [item.toLowerCase(), item])).values()];
}
function cleanNakshatraName(value: string): string {
  return value.replace(/\s*\([^)]*\)\s*$/, '').trim();
}
function pick<T>(value: T | undefined, fallback: T): T { return value ?? fallback; }

/** Generates a combined symbolic reading from already-calculated Panchang values. It does not predict events. */
export function generateDailyPanchangNarrative(
  p: Pick<PanchangResult, 'vara' | 'varaLord' | 'tithi' | 'tithiNumber' | 'paksha' | 'nakshatra' | 'nakshatraPada' | 'karana' | 'yoga'>,
): DailyPanchangNarrative {
  const day = pick(lookup(VARA, p.vara), { planet: p.varaLord || 'the weekday lord', themes: ['deliberate action', 'clear priorities'], challenges: ['reacting before understanding'], action: 'choose one clear priority' });
  const starName = cleanNakshatraName(p.nakshatra);
  const star = pick(lookup(NAKSHATRA, starName), { themes: ['attention to the demands of the moment'], challenges: ['assuming the day has a fixed outcome'], action: 'observe the situation before choosing a response' });
  const tithiName = p.tithi.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const tithi = pick(lookup(TITHI, tithiName), { themes: ['reflection and intentional action'], challenges: ['acting on assumptions'], action: 'check the facts and choose a proportionate next step' });
  const yoga = pick(lookup(YOGA, p.yoga), { themes: ['the traditional symbolism of ' + p.yoga], challenges: ['treating symbolism as certainty'], action: 'use the symbolism as a prompt, not a prediction' });
  const karana = pick(lookup(KARANA, p.karana), { themes: ['practical follow-through'], challenges: ['working from assumptions'], action: 'complete one manageable task carefully' });

  const themes = dedupe([...day.themes, ...tithi.themes, ...star.themes, ...yoga.themes, ...karana.themes]);
  const challenges = dedupe([...day.challenges, ...tithi.challenges, ...star.challenges, ...yoga.challenges, ...karana.challenges]);
  const shared = themes.filter(theme => [day, tithi, star, yoga, karana].filter(item => item.themes.some(t => t.toLowerCase() === theme.toLowerCase())).length > 1);
  const tension = challenges.slice(0, 2);
  const synthesis = shared.length
    ? 'Several factors reinforce ' + shared.slice(0, 3).join(', ') + '. Use that overlap as the main thread of the day, while remembering that these are traditional symbolic prompts rather than certain outcomes.'
    : 'The factors point in different directions, so treat the day as a balancing exercise rather than reducing it to one label.';
  const paksha = p.paksha ? p.paksha + ' Paksha' : 'current lunar half';

  return {
    overview: `${p.tithi} (${paksha}) combines with ${starName} Nakshatra, ${p.yoga} Yoga, ${p.karana} Karana and ${p.vara}. The weekday symbolism emphasises ${day.themes.slice(0, 3).join(', ')}; the tithi adds ${tithi.themes.slice(0, 3).join(', ')}, while the nakshatra brings ${star.themes.slice(0, 3).join(', ')} into focus. ${synthesis} The useful question is how to express these themes deliberately, not what events must happen.`,
    work: `For work, combine ${star.themes[0]} with ${karana.themes[0]}: ${star.action}. The yoga adds ${yoga.themes.slice(0, 2).join(' and ')}, so ${yoga.action}. The tithi suggests ${tithi.action}. A practical approach is to choose one meaningful deliverable, define what “done” means, and avoid scattering effort across too many tasks.`,
    finances: `For money and decisions, the combined themes of ${tithi.themes[0]}, ${karana.themes[0]} and ${day.themes[0]} can be used to reflect on value, resources and responsibility. ${karana.action}. Keep choices grounded in actual figures, written terms and affordability; a Panchang combination is not evidence that a financial risk will pay off.`,
    relationships: `In relationships, the day brings ${star.themes.includes('relationships') ? 'connection and relational awareness' : day.themes[0] + ' and ' + star.themes[0]} into the picture. ${day.action}. ${karana.action}. Watch for ${dedupe([...day.challenges, ...star.challenges, ...tithi.challenges]).slice(0, 3).join(', ')}; state needs plainly and leave room for the other person's perspective.`,
    spiritual: `For inner work, reflect on the relationship between ${tithi.themes[0]} and ${star.themes[0]}. The yoga highlights ${yoga.themes[0]}, while the karana points toward ${karana.themes[0]}. Ask where these qualities are helpful and where their excess could appear. Possible pressure points include ${tension.join(' and ') || 'reacting without reflection'}. Treat the reading as a reflective framework, not a fixed description of you or the day.`,
    practicalAdvice: `Today's practical thread: ${day.action}; ${tithi.action}; and ${karana.action}. Keep an eye on ${challenges.slice(0, 4).join(', ')}. Pick one concrete action, make it small enough to finish, and assess important choices on their real-world merits rather than on astrological symbolism alone.`,
  };
}

/** Finnish-language version, preserving the same combined interpretation logic. */
export function generateFinnishDailyPanchangNarrative(
  p: Pick<PanchangResult, 'vara' | 'varaLord' | 'tithi' | 'tithiNumber' | 'paksha' | 'nakshatra' | 'nakshatraPada' | 'karana' | 'yoga'>,
): DailyPanchangNarrative {
  const en = generateDailyPanchangNarrative(p);
  const replacements: Array<[RegExp, string]> = [
    [/Several factors reinforce/g, 'Useat tekijät vahvistavat'],
    [/Use that overlap as the main thread of the day, while remembering that these are traditional symbolic prompts rather than certain outcomes\./g, 'Käytä tätä yhteistä teemaa päivän punaisena lankana. Kyse on perinteisistä symbolisista tulkinnoista, ei varmoista ennusteista.'],
    [/The factors point in different directions, so treat the day as a balancing exercise rather than reducing it to one label\./g, 'Tekijät osoittavat eri suuntiin, joten päivää kannattaa tarkastella tasapainotteluna yhden leiman sijaan.'],
    [/The weekday symbolism emphasises/g, 'Viikonpäivän symboliikka korostaa'],
    [/the tithi adds/g, 'tithi tuo mukaan'],
    [/while the nakshatra brings/g, 'ja nakshatra nostaa esiin'],
    [/The useful question is how to express these themes deliberately, not what events must happen\./g, 'Olennaista on, miten tuot nämä teemat tietoisesti käytäntöön — ei se, mitä tapahtumia pitäisi tapahtua.'],
    [/For work, combine/g, 'Työssä yhdistä'],
    [/into focus:/g, 'keskiöön:'],
    [/The yoga adds/g, 'Yoga lisää kokonaisuuteen'],
    [/so /g, 'joten '],
    [/A practical approach is to choose one meaningful deliverable, define what “done” means, and avoid scattering effort across too many tasks\./g, 'Käytännössä valitse yksi merkityksellinen tehtävä, määrittele mitä sen valmistuminen tarkoittaa ja vältä energian hajauttamista liian moneen asiaan.'],
    [/For money and decisions/g, 'Rahan ja päätöksenteon näkökulmasta'],
    [/can be used to reflect on value, resources and responsibility\./g, 'tarjoavat näkökulmia arvoon, resursseihin ja vastuuseen.'],
    [/Keep choices grounded in actual figures, written terms and affordability; a Panchang combination is not evidence that a financial risk will pay off\./g, 'Perusta valinnat todellisiin lukuihin, kirjallisiin ehtoihin ja maksukykyyn. Panchang-yhdistelmä ei todista, että taloudellinen riski kannattaa.'],
    [/In relationships, the day brings/g, 'Ihmissuhteissa päivä nostaa esiin'],
    [/into the picture\./g, 'teemat.'],
    [/Watch for/g, 'Varo erityisesti'],
    [/state needs plainly and leave room for the other person's perspective\./g, 'kerro tarpeistasi suoraan ja jätä tilaa myös toisen näkökulmalle.'],
    [/For inner work, reflect on the relationship between/g, 'Sisäisessä työssä pohdi yhteyttä teemojen'],
    [/The yoga highlights/g, 'Yoga korostaa'],
    [/while the karana points toward/g, 'ja karana nostaa esiin'],
    [/Ask where these qualities are helpful and where their excess could appear\./g, 'Pohdi, missä nämä ominaisuudet auttavat ja missä niiden liioittelu voi näkyä.'],
    [/Possible pressure points include/g, 'Mahdollisia haasteita ovat'],
    [/Treat the reading as a reflective framework, not a fixed description of you or the day\./g, 'Käytä tulkintaa pohdinnan apuna, älä sinua tai päivää lopullisesti määrittelevänä kuvauksena.'],
    [/Today's practical thread:/g, 'Päivän käytännön punainen lanka:'],
    [/Keep an eye on/g, 'Kiinnitä huomiota seuraaviin haasteisiin:'],
    [/Pick one concrete action, make it small enough to finish, and assess important choices on their real-world merits rather than on astrological symbolism alone\./g, 'Valitse yksi konkreettinen ja loppuun saatettava teko. Arvioi tärkeät päätökset todellisten perusteiden, älä pelkän astrologisen symboliikan pohjalta.'],
  ];
  const translate = (value: string) => replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
  return {
    overview: translate(en.overview),
    work: translate(en.work),
    finances: translate(en.finances),
    relationships: translate(en.relationships),
    spiritual: translate(en.spiritual),
    practicalAdvice: translate(en.practicalAdvice),
  };
}
