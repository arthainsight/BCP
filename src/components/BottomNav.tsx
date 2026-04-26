'use client';

export type TabId = 'chart' | 'data' | 'grahas' | 'dasha' | 'settings';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'chart',    label: 'Chart' },
  { id: 'data',     label: 'Data' },
  { id: 'grahas',   label: 'Grahas' },
  { id: 'dasha',    label: 'Dasha' },
  { id: 'settings', label: 'Settings' },
];

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

export default function BottomNav({ activeTab, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 safe-bottom">
      <div className="flex">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 py-3 text-xs font-mono transition-colors ${
              activeTab === tab.id
                ? 'text-emerald-700 dark:text-green-400 font-semibold'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
