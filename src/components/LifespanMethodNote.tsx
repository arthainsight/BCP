'use client';
import { useMemo } from 'react';
import type { PlanetData } from '@/types';
import { chooseLifespanMethod, LIFESPAN_METHOD_NAMES } from '@/lib/lifespanMethod';
import { fill, useT } from '@/lib/i18n';

/** Which of the spans of life the Phaladīpikā takes for this chart (22.28–29); the daśās of the three spans are the Aṃśī, the Paiṇḍī and the Naisargika. */
export default function LifespanMethodNote({ planets, ascendantSign }: { planets: PlanetData[]; ascendantSign: number }) {
  const t = useT();
  const choice = useMemo(() => chooseLifespanMethod(planets, ascendantSign), [planets, ascendantSign]);
  if (!choice) return null;
  const methods = choice.methods.map(method => LIFESPAN_METHOD_NAMES[method]).join(', ');
  const who = choice.strongest.join(', ');
  return <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
    {choice.methods.length === 1
      ? fill(t('Phaladīpikā 22.28: the span of life for this chart is taken by the {methods} (the strongest of the Lagna, the Sun and the Moon: {who}).'), { methods, who })
      : fill(t('Phaladīpikā 22.29: the strongest of the Lagna, the Sun and the Moon are equal ({who}); the span is the mean of {methods}.'), { methods, who })}
  </p>;
}
