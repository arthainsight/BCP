export function astroDatabankSearchUrl(query: string): string {
  const search = query.trim();
  if (!search) return 'https://www.astro.com/astro-databank/Main_Page';
  const params = new URLSearchParams({ search, title: 'Special:Search', go: 'Go' });
  return `https://www.astro.com/astro-databank/index.php?${params.toString()}`;
}

export const PUBLIC_CHART_SERVICES = [
  {
    name: 'Astro-Databank',
    description: 'Documented public-figure birth data with source notes and Rodden ratings.',
    url: 'https://www.astro.com/astro-databank/Main_Page',
    recommended: true,
  },
  {
    name: 'Astro-Seek',
    description: 'Large searchable directory of ready-made celebrity charts.',
    url: 'https://famouspeople.astro-seek.com/',
  },
  {
    name: 'Astrotheme',
    description: 'Public-figure chart directory with filters for profession, country and birth time.',
    url: 'https://www.astrotheme.com/celestar/horoscope_celebrity_search_by_filters.php',
  },
] as const;