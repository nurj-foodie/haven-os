'use client';
import React, { useState } from 'react';
import { FileText, Sparkles, ArrowRight } from 'lucide-react';
import { ProcessorProps } from './types';
import { useReactFlow } from '@xyflow/react';

export default function SummaryProcessor({ node }: ProcessorProps) {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const { addNodes } = useReactFlow();

    if (!node) return null;

    const handleSummarize = async () => {
        setLoading(true);
        try {
            // Extract content based on node type
            let content = '';
            let documentUrl = '';

            if (node.type === 'docNode') {
                // Pass the URL so the API can fetch the actual document content
                documentUrl = (node.data.url as string) || '';
                content = (node.data.label as string) || 'Document';
            } else if (node.type === 'linkNode') {
                content = (node.data.url as string);
            } else if (node.type === 'noteNode') {
                content = (node.data.content as string);
            }

            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'summarize',
                    content: content,
                    documentUrl: documentUrl || undefined
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setSummary(data.text);
        } catch (error) {
            console.error(error);
            setSummary('Failed to generate summary.');
        } finally {
            setLoading(false);
        }
    };


    const handleSaveAsNote = () => {
        if (!summary) return;

        const newNode = {
            id: `note-${Date.now()}`,
            type: 'noteNode',
            position: { x: node.position.x + 300, y: node.position.y },
            data: {
                label: `Summary: ${node.data.label}`,
                content: summary
            },
        };

        addNodes(newNode);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <FileText className="w-3 h-3" />
                Summarizer Agent
            </div>

            {!summary ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                    <div className="p-3 rounded-full bg-slate-900 border border-slate-800">
                        <Sparkles className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-300 font-medium">Ready to crystallize</p>
                        <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                            Generate a concise summary of this asset using Gemini 2.0 Flash.
                        </p>
                    </div>
                    <button
                        onClick={handleSummarize}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Crystallizing...' : 'Generate Summary'}
                        {!loading && <Sparkles className="w-3 h-3" />}
                    </button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col min-h-0 space-y-4">
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="prose prose-invert prose-xs max-w-none">
                            <React.Fragment>
                                {summary.split('\n').map((line, i) => (
                                    <p key={i} className="mb-2 text-slate-300 leading-relaxed">{line}</p>
                                ))}
                            </React.Fragment>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveAsNote}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded transition-colors border border-slate-700"
                    >
                        Save as Note
                        <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                        onClick={() => setSummary('')}
                        className="text-xs text-slate-500 hover:text-slate-400 underline text-center"
                    >
                        Reset
                    </button>
                </div>
            )}
        </div>
    );
}
