import type { PanchangResult } from './index';

export interface DailyPanchangNarrative {
  overview: string;
  work: string;
  finances: string;
  relationships: string;
  spiritual: string;
  practicalAdvice: string;
}

const VARA_THEMES: Record<string, { planet: string; theme: string; watch: string }> = {
  Sunday: { planet: 'Sun', theme: 'purpose, visibility and leadership', watch: 'pride or the urge to control the outcome' },
  Monday: { planet: 'Moon', theme: 'emotional awareness, care and adaptability', watch: 'mood-driven decisions or taking things too personally' },
  Tuesday: { planet: 'Mars', theme: 'initiative, courage and decisive action', watch: 'impatience, conflict or speaking before thinking' },
  Wednesday: { planet: 'Mercury', theme: 'communication, learning and practical problem-solving', watch: 'scattered attention or overthinking' },
  Thursday: { planet: 'Jupiter', theme: 'judgment, learning and long-term perspective', watch: 'overconfidence or promising more than you can deliver' },
  Friday: { planet: 'Venus', theme: 'connection, creativity and appreciation', watch: 'people-pleasing or choosing comfort over what matters' },
  Saturday: { planet: 'Saturn', theme: 'discipline, patience and responsibility', watch: 'pessimism or making progress feel harder than it is' },
};

const NAKSHATRA_THEMES: Record<string, { theme: string; challenge: string }> = {
  Ashwini: { theme: 'beginnings, speed and recovery', challenge: 'rushing before the direction is clear' },
  Bharani: { theme: 'carrying responsibility, creation and transformation', challenge: 'holding on too long or reacting intensely' },
  Krittika: { theme: 'discernment, purification and cutting through excess', challenge: 'being unnecessarily sharp or critical' },
  Rohini: { theme: 'growth, nourishment and building something tangible', challenge: 'attachment to comfort or results' },
  Mrigashira: { theme: 'curiosity, exploration and searching for answers', challenge: 'restlessness or endlessly looking for a better option' },
  Ardra: { theme: 'honest confrontation, release and change', challenge: 'letting frustration dictate your response' },
  Punarvasu: { theme: 'renewal, perspective and returning to what works', challenge: 'repeating an old pattern without learning from it' },
  Pushya: { theme: 'support, steady growth and responsible care', challenge: 'over-functioning for other people' },
  Ashlesha: { theme: 'strategy, perception and seeing beneath the surface', challenge: 'suspicion or indirect communication' },
  Magha: { theme: 'legacy, roots and responsible authority', challenge: 'acting from status or inherited expectations' },
  Purva Phalguni: { theme: 'pleasure, creativity and social connection', challenge: 'avoiding effort in favour of immediate enjoyment' },
  Uttara Phalguni: { theme: 'agreements, commitment and dependable support', challenge: 'taking obligations for granted' },
  Hasta: { theme: 'skill, craft and making an idea useful', challenge: 'trying to control every detail' },
  Chitra: { theme: 'design, refinement and making a clear impression', challenge: 'prioritising appearance over substance' },
  Swati: { theme: 'independence, flexibility and finding your own pace', challenge: 'drifting without a firm decision' },
  Vishakha: { theme: 'ambition, focus and reaching a chosen milestone', challenge: 'becoming fixated on winning' },
  Anuradha: { theme: 'friendship, cooperation and loyalty', challenge: 'expecting others to intuit what you need' },
  Jyeshtha: { theme: 'competence, protection and mature responsibility', challenge: 'defensiveness or carrying everything alone' },
  Mula: { theme: 'investigation, roots and removing what no longer holds', challenge: 'tearing something down before understanding it' },
  Purva Ashadha: { theme: 'conviction, renewal and standing behind a choice', challenge: 'mistaking confidence for proof' },
  Uttara Ashadha: { theme: 'persistence, integrity and durable achievement', challenge: 'rigidity or refusing to adjust the plan' },
  Shravana: { theme: 'listening, learning and understanding context', challenge: 'hearing only what confirms your view' },
  Dhanishta: { theme: 'rhythm, teamwork and coordinated action', challenge: 'measuring success only by external recognition' },
  Shatabhisha: { theme: 'research, independence and seeing the larger pattern', challenge: 'withdrawing instead of asking for help' },
  Purva Bhadrapada: { theme: 'deep conviction, intensity and meaningful change', challenge: 'all-or-nothing thinking' },
  Uttara Bhadrapada: { theme: 'steadiness, depth and patient inner work', challenge: 'becoming passive while waiting for certainty' },
  Revati: { theme: 'completion, guidance and a thoughtful transition', challenge: 'delaying an ending that is already clear' },
};

const YOGA_THEMES: Record<string, string> = {
  Siddhi: 'The traditional symbolism of Siddhi Yoga emphasises accomplishment. Treat it as a prompt to finish a concrete task rather than as a guarantee of success.',
  Sukarma: 'Sukarma is traditionally associated with constructive action. Favour useful work and choices whose benefits can be explained clearly.',
  Dhriti: 'Dhriti is associated with steadiness. Consistent effort may be more useful than a dramatic change of direction.',
  Shubha: 'Shubha is traditionally considered auspicious. Use the symbolism to support considerate, well-prepared action.',
  Sadhya: 'Sadhya is associated with what can be accomplished. Break a larger aim into a practical next step.',
  Variyan: 'Variyan is traditionally linked with comfort and ease. Notice where ease helps you work well and where it becomes avoidance.',
  Vajra: 'Vajra carries a symbolism of firmness and force. Be clear about priorities without turning firmness into needless confrontation.',
  Atiganda: 'Atiganda is traditionally treated as a more difficult yoga. Slow down around avoidable risks and check assumptions before acting.',
  Vyaghata: 'Vyaghata carries a challenging traditional symbolism. Avoid forcing an outcome when a pause or a second look would help.',
  Vyatipata: 'Vyatipata is traditionally considered difficult. Keep plans realistic and give important decisions an extra review.',
  Parigha: 'Parigha symbolises an obstacle or barrier. Identify the actual bottleneck instead of spending energy fighting the whole situation.',
};

function titleCase(value: string): string {
  return value.length ? value[0].toUpperCase() + value.slice(1) : value;
}

/**
 * Builds a readable, Panchang-led daily reading from already-calculated values.
 * This is interpretation, not astronomical calculation; it intentionally contains no remedies.
 */
export function generateDailyPanchangNarrative(p: Pick<PanchangResult, 'vara' | 'varaLord' | 'tithi' | 'tithiNumber' | 'paksha' | 'nakshatra' | 'nakshatraPada' | 'karana' | 'yoga'>): DailyPanchangNarrative {
  const day = VARA_THEMES[p.vara] ?? {
    planet: p.varaLord || 'the weekday lord',
    theme: 'attention, deliberate action and clear priorities',
    watch: 'reacting before the situation is fully understood',
  };
  const nakshatraName = p.nakshatra.replace(/\s*\([^)]*\)\s*$/, '');
  const nakshatra = NAKSHATRA_THEMES[nakshatraName] ?? {
    theme: 'paying attention to the specific demands of the moment',
    challenge: 'assuming the day has one fixed outcome',
  };
  const yoga = YOGA_THEMES[p.yoga] ?? `${p.yoga} has its own traditional symbolism; use it as a secondary influence rather than treating it as a promise about what will happen.`;
  const karanaName = p.karana.toLowerCase();
  const karanaTheme = /kaulava/.test(karanaName)
    ? 'Kaulava is traditionally associated with friendship and cooperation, so support may come through a useful conversation or shared effort.'
    : /bava|balava|taitila|gara|vanija/.test(karanaName)
      ? `${p.karana} adds a secondary traditional emphasis to the day's activity; let it inform the tone, not dictate a decision.`
      : /vishti|bhadra/.test(karanaName)
        ? `${p.karana} is traditionally approached with caution for certain undertakings. Double-check timing and avoid unnecessary escalation.`
        : `${p.karana} adds another layer to the Panchang. Interpret it alongside the tithi, weekday and nakshatra rather than in isolation.`;

  return {
    overview: `${p.tithi} tithi (${p.paksha} Paksha), ${p.vara}, ${p.nakshatra} nakshatra and ${p.yoga} Yoga bring together several different themes. ${titleCase(day.planet)} rules the weekday, emphasising ${day.theme}. ${titleCase(nakshatraName)} points toward ${nakshatra.theme}. The useful question is how to express these themes deliberately, rather than assuming the day guarantees a particular result.`,
    work: `For work, focus on one task that would make a real difference if completed. The nakshatra's themes of ${nakshatra.theme} can be used as a prompt for how to approach it. ${yoga}`,
    finances: `Keep financial decisions grounded in evidence. Prefer clear value, realistic numbers and work you can actually deliver; do not treat a favourable Panchang combination as a reason to speculate or take a risk you would otherwise reject.`,
    relationships: `The weekday highlights ${day.theme}. Communicate directly, listen to the other person's actual point, and pause if the conversation becomes heated. ${karanaTheme}`,
    spiritual: `${titleCase(nakshatraName)} invites reflection on ${nakshatra.theme}. Notice where that quality is useful in your life and where its challenging side—${nakshatra.challenge}—may be showing up. A small, honest observation is more useful than forcing a grand conclusion.`,
    practicalAdvice: `Use the day for ${day.theme}. Be especially mindful of ${day.watch}. Choose one specific action, complete it carefully, and review important decisions on their merits.`,
  };
}
