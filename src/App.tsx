import { useState } from 'react';
import {
    createInitialMachineState,
    type MachineState,
} from './core/mips/single-cycle/execution/machineState';
import DatapathPage from './features/datapath/DatapathPage';
import AssemblyPage from './features/assembly/AssemblyPage';
import KMapPage from './features/kmap/KMapPage';
import PipelinePage from './features/pipeline/PipelinePage';
import CachePage from './features/cache/CachePage';
import {
    DEFAULT_CACHE_ARRAYS,
    DEFAULT_CACHE_PROGRAM,
} from './features/cache/defaultConfig';
import { DEFAULT_PIPELINE_PROGRAM } from './features/pipeline/defaultProgram';
import type { MipsArrayDefinitionDraft } from './types/mips';

type Tab = 'datapath' | 'assembly' | 'kmap' | 'pipeline' | 'cache';

const tabs: { id: Tab; label: string }[] = [
    { id: 'datapath', label: 'Datapath' },
    { id: 'assembly', label: 'Assembly' },
    { id: 'kmap', label: 'Karnaugh Maps' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'cache', label: 'Cache' },
];

export default function App() {
    const [tab, setTab] = useState<Tab>('datapath');
    const [assemblyArrays, setAssemblyArrays] = useState<
        MipsArrayDefinitionDraft[]
    >([]);
    const [pipelineProgram, setPipelineProgram] = useState(
        DEFAULT_PIPELINE_PROGRAM,
    );
    const [pipelineInitial, setPipelineInitial] = useState<MachineState>(() =>
        createInitialMachineState(),
    );
    const [pipelineArrays, setPipelineArrays] = useState<
        MipsArrayDefinitionDraft[]
    >([]);

    const [cacheProgram, setCacheProgram] = useState(DEFAULT_CACHE_PROGRAM);
    const [cacheInitial, setCacheInitial] = useState<MachineState>(() =>
        createInitialMachineState(),
    );
    const [cacheArrays, setCacheArrays] =
        useState<MipsArrayDefinitionDraft[]>(DEFAULT_CACHE_ARRAYS);

    function sendToPipeline(
        source: string,
        machine: MachineState,
        arrays: MipsArrayDefinitionDraft[],
    ) {
        setPipelineProgram(source);
        setPipelineInitial({ ...machine, pc: 0 });
        setPipelineArrays(arrays);
        setTab('pipeline');
    }

    function sendToCache(
        source: string,
        machine: MachineState,
        arrays: MipsArrayDefinitionDraft[],
    ) {
        setCacheProgram(source);
        setCacheInitial({
            ...machine,
            pc: 0,
        });
        setCacheArrays(arrays);
        setTab('cache');
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#eef2f3]">
            <nav className="flex flex-none border-b border-slate-200 bg-[#fbfcfd] px-3 py-2 shadow-sm sm:px-4 lg:px-6">
                <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm">
                            <img
                                src="/logo.png"
                                alt=""
                                className="h-6 w-6"
                                aria-hidden="true"
                            />
                        </div>

                        <div>
                            <div className="text-sm font-bold tracking-tight text-slate-950">
                                CS2100 Visualizer
                            </div>
                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                MIPS and logic practice
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 rounded-md bg-slate-100 p-1 ring-1 ring-slate-200">
                        {tabs.map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTab(id)}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition sm:px-4 ${
                                    tab === id
                                        ? 'bg-slate-900 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-white/70 hover:text-slate-950'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            <div className="min-h-0 flex-1 overflow-auto">
                {tab === 'datapath' ? (
                    <DatapathPage />
                ) : tab === 'assembly' ? (
                    <AssemblyPage
                        arrayDefinitions={assemblyArrays}
                        onArrayDefinitionsChange={setAssemblyArrays}
                        onSendToPipeline={sendToPipeline}
                        onSendToCache={sendToCache}
                    />
                ) : tab === 'kmap' ? (
                    <KMapPage />
                ) : tab === 'pipeline' ? (
                    <PipelinePage
                        program={pipelineProgram}
                        onProgramChange={setPipelineProgram}
                        initialMachine={pipelineInitial}
                        onInitialMachineChange={setPipelineInitial}
                        arrayDefinitions={pipelineArrays}
                        onArrayDefinitionsChange={setPipelineArrays}
                    />
                ) : (
                    <CachePage
                        program={cacheProgram}
                        onProgramChange={setCacheProgram}
                        initialMachine={cacheInitial}
                        onInitialMachineChange={setCacheInitial}
                        arrayDefinitions={cacheArrays}
                        onArrayDefinitionsChange={setCacheArrays}
                    />
                )}
            </div>
        </div>
    );
}
