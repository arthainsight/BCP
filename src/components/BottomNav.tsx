'use client';

export type TabId = 'chart' | 'data' | 'grahas' | 'dasha' | 'public' | 'settings' | 'workspace';

interface Tab {
  id: TabId;
  label: string;
}

const BASE_TABS: Tab[] = [
  { id: 'chart',    label: 'Chart' },
  { id: 'data',     label: 'Data' },
  { id: 'grahas',   label: 'Grahas' },
  { id: 'dasha',    label: 'Dasha' },
  { id: 'public',   label: 'Public' },
  { id: 'settings', label: 'Settings' },
];

const WORKSPACE_TAB: Tab = { id: 'workspace', label: 'WS' };

interface Props {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  showWorkspace?: boolean;
}

export default function BottomNav({ activeTab, onChange, showWorkspace = false }: Props) {
  const tabs = showWorkspace
    ? [...BASE_TABS.slice(0, -1), WORKSPACE_TAB, BASE_TABS[BASE_TABS.length - 1]]
    : BASE_TABS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 safe-bottom">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 min-w-[44px] py-3 text-xs font-mono transition-colors ${
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
