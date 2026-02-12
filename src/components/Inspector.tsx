'use client';
import React, { useState, useEffect } from 'react';
import { Sparkles, Layers } from 'lucide-react';
import { Node } from '@xyflow/react';
import { getProcessorForNode, getAllProcessorsForNode } from './inspector/ProcessorRegistry';
import OrchestratorProcessor from './inspector/processors/OrchestratorProcessor';

interface InspectorProps {
    selectedNodes: Node[];
}

export default function Inspector({ selectedNodes }: InspectorProps) {
    const count = selectedNodes.length;
    const [activeProcessorId, setActiveProcessorId] = useState<string | null>(null);

    // Reset active processor when node changes
    useEffect(() => {
        if (count === 1) {
            const processors = getAllProcessorsForNode(selectedNodes[0]);
            if (processors.length > 0) {
                setActiveProcessorId(processors[0].id);
            }
        } else {
            setActiveProcessorId(null);
        }
    }, [count, selectedNodes[0]?.id]);

    // Determine what to show
    let content;
    let header;

    if (count === 0) {
        // 0 Nodes -> Default (Processors List)
        const processor = getProcessorForNode(null);
        content = processor ? <processor.Component node={null} /> : null;
        header = (
            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Inspector</h2>
            </div>
        );
    } else if (count === 1) {
        // 1 Node -> Specific Processor(s)
        const node = selectedNodes[0];
        const availableProcessors = getAllProcessorsForNode(node);
        const activeProcessor = availableProcessors.find(p => p.id === activeProcessorId) || availableProcessors[0];

        header = (
            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Inspector</h2>
            </div>
        );

        content = (
            <>
                {/* Context Header */}
                <div className="mb-4">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg animate-in slide-in-from-right duration-300">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Context</div>
                        <div className="text-sm text-slate-200 truncate">{node.data.label as string || node.id}</div>
                        <div className="text-[10px] text-slate-600 mt-1 font-mono">{node.type}</div>
                    </div>
                </div>

                {/* Processor Tabs (only if multiple processors available) */}
                {availableProcessors.length > 1 && (
                    <div className="mb-4">
                        <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto custom-scrollbar-horizontal">
                            {availableProcessors.map((proc) => (
                                <button
                                    key={proc.id}
                                    onClick={() => setActiveProcessorId(proc.id)}
                                    className={`flex-shrink-0 px-3 py-2 min-h-[40px] text-[10px] font-bold uppercase tracking-wider rounded transition-all touch-manipulation whitespace-nowrap ${activeProcessorId === proc.id
                                        ? 'bg-slate-700 text-slate-200'
                                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                                        }`}
                                >
                                    {proc.name}
                                </button>
                            ))}
                        </div>
                        {availableProcessors.length > 3 && (
                            <div className="text-[9px] text-slate-600 text-center mt-1">← Scroll for more →</div>
                        )}
                    </div>
                )}

                {/* Processor Content */}
                {activeProcessor && <activeProcessor.Component node={node} />}
            </>
        );
    } else {
        // >1 Nodes -> Orchestrator
        header = (
            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" />
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Orchestrator</h2>
            </div>
        );
        content = <OrchestratorProcessor nodes={selectedNodes} />;
    }

    return (
        <>
            {/* Desktop/Tablet Landscape: Fixed Sidebar */}
            <aside className="hidden lg:flex w-[300px] xl:w-[320px] flex-shrink-0 border-l border-slate-800 bg-[#020617] flex-col z-20 h-screen">
                {header}
                <div className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar min-h-0">
                    {content}
                </div>
            </aside>

            {/* Tablet Portrait: Bottom Sheet */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#020617] border-t border-slate-800 rounded-t-2xl shadow-2xl flex flex-col touch-manipulation"
                style={{ height: '60vh', maxHeight: '600px' }}
            >
                {/* Drag Handle */}
                <div className="flex items-center justify-center py-2 border-b border-slate-800">
                    <div className="w-12 h-1 rounded-full bg-slate-700"></div>
                </div>

                {header}
                <div className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar min-h-0">
                    {content}
                </div>
            </div>
        </>
    );
}
