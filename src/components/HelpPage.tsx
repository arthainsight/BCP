'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { APP_NAME, APP_VERSION, SOURCE_URL } from '@/lib/config';
import { FAQ_ENTRIES, FAQ_SECTIONS, filterFaq } from '@/lib/faq';
import { LANGUAGES, LanguageContext, useT, type Language } from '@/lib/i18n';
import { setStoredLanguage, useStoredLanguage } from '@/hooks/useStoredLanguage';

const LINK = 'text-emerald-700 hover:underline dark:text-green-400';

function Guide({ language }: { language: Language }) {
  const t = useT();
  const [query, setQuery] = useState('');

  const entries = useMemo(() => filterFaq(FAQ_ENTRIES, query, language), [query, language]);
  const sections = FAQ_SECTIONS.filter(section => entries.some(entry => entry.section === section.id));

  // Keep the document language in step with the guide for screen readers.
  useEffect(() => { document.documentElement.lang = language; }, [language]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2">
          <Link href="/" className={`${LINK} whitespace-nowrap text-xs font-mono`} data-help-back>
            ← {APP_NAME}
          </Link>
          <div className="flex items-center gap-2">
            <div role="group" aria-label={t('language')} className="inline-flex overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
              {LANGUAGES.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStoredLanguage(option.value)}
                  aria-pressed={language === option.value}
                  className={`px-2 py-1 text-[11px] font-mono transition-colors ${
                    language === option.value
                      ? 'bg-emerald-600 text-white dark:bg-green-700'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {option.value.toUpperCase()}
                </button>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-6">
        <div className="space-y-3">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t('Guide')}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t('How to use the app: answers to the common questions, in the order you will meet them.')}
          </p>
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t('Search the guide')}
            aria-label={t('Search the guide')}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-green-500"
          />
          {sections.length > 0 && (
            <nav aria-label={t('Sections')} className="flex flex-wrap gap-1.5">
              {sections.map(section => (
                <a
                  key={section.id}
                  href={`#section-${section.id}`}
                  className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-mono text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
                >
                  {section.title[language]}
                </a>
              ))}
            </nav>
          )}
        </div>

        {entries.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400" role="status" data-help-empty>
            {t('No answers match your search.')}
          </p>
        )}

        {sections.map(section => (
          <section key={section.id} id={`section-${section.id}`} aria-labelledby={`heading-${section.id}`} className="scroll-mt-16 space-y-4">
            <h2 id={`heading-${section.id}`} className="border-b border-zinc-200 pb-1 text-xs font-mono uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              {section.title[language]}
            </h2>
            {entries.filter(entry => entry.section === section.id).map(entry => (
              <article
                key={entry.id}
                id={entry.id}
                data-faq={entry.id}
                className="scroll-mt-16 space-y-2 rounded-lg border border-zinc-200 bg-white p-4 target:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:target:border-green-600"
              >
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  <a href={`#${entry.id}`} className="hover:underline">{entry.q[language]}</a>
                </h3>
                {entry.a[language].map((paragraph, index) => (
                  <p key={index} className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{paragraph}</p>
                ))}
              </article>
            ))}
          </section>
        ))}

        <footer className="border-t border-zinc-200 pt-4 text-xs font-mono text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
          <Link href="/" className={LINK}>{t('Back to the app')}</Link>
          <span className="mx-2">·</span>
          {APP_NAME} by Riku Forsell {APP_VERSION}
          <span className="mx-2">·</span>
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className={LINK}>{t('Source code (AGPL-3.0)')}</a>
        </footer>
      </main>
    </div>
  );
}

/** The user guide: the questions and answers of the app, in the language chosen in the app's settings. */
export default function HelpPage() {
  const language = useStoredLanguage();
  return (
    <LanguageContext.Provider value={language}>
      <Guide language={language} />
    </LanguageContext.Provider>
  );
}
