import type { Metadata } from 'next';
import HelpPage from '@/components/HelpPage';
import { APP_NAME } from '@/lib/config';

export const metadata: Metadata = {
  title: `Guide · ${APP_NAME}`,
  description: 'How to use bhrigu.code: charts, timing, analysis, palm, saving and recording. Käyttöohje ja usein kysytyt kysymykset.',
};

export default function Page() {
  return <HelpPage />;
}
