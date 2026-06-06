import { useState } from 'react';
import DatapathPage from './features/datapath/DatapathPage';
import AssemblyPage from './features/assembly/AssemblyPage';
import KMapPage from './features/kmap/KMapPage';

type Tab = 'datapath' | 'assembly' | 'kmap';

const tabs: { id: Tab; label: string }[] = [
    { id: 'datapath', label: 'Datapath' },
    { id: 'assembly', label: 'Assembly' },
    { id: 'kmap', label: 'Karnaugh Maps' },
];

export default function App() {
    const [tab, setTab] = useState<Tab>('datapath');

    return (
        <div className="flex h-screen flex-col overflow-hidden">
            <nav className="flex flex-none gap-1 border-b border-slate-200 bg-white px-6 py-2">
                {tabs.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium ${
                            tab === id
                                ? 'bg-slate-900 text-white'
                                : 'text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </nav>

            <div className="min-h-0 flex-1 overflow-auto">
                {tab === 'datapath' ? (
                    <DatapathPage />
                ) : tab === 'assembly' ? (
                    <AssemblyPage />
                ) : (
                    <KMapPage />
                )}
            </div>
        </div>
    );
}
