'use client';
import React, { useState, useEffect } from 'react';
import { Mic, Sparkles, Copy, Loader2, CheckCircle, Save } from 'lucide-react';
import { ProcessorProps } from './types';
import { supabase } from '@/lib/supabase';
import { useReactFlow, Node } from '@xyflow/react';

interface TranscriptionSegment {
    speaker?: string;
    timestamp?: string;
    text: string;
    language?: string;
    emotion?: string;
}

interface TranscriptionData {
    summary?: string;
    transcript?: string;
    segments?: TranscriptionSegment[];
}

export default function TranscriptionProcessor({ node }: ProcessorProps) {
    const { setNodes } = useReactFlow();
    const [transcription, setTranscription] = useState<TranscriptionData | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Load existing transcription from node metadata
    useEffect(() => {
        const metadata = node?.data?.metadata as Record<string, any> | undefined;
        if (metadata && 'transcription' in metadata && metadata.transcription) {
            setTranscription(metadata.transcription as TranscriptionData);
        } else {
            setTranscription(null);
        }
    }, [node?.id, node?.data?.metadata]);

    if (!node) return null;

    const handleTranscribe = async () => {
        if (!node.data.url) {
            console.error('No audio/video URL available');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'transcribe',
                    content: node.data.url as string, // Send as 'content' parameter
                    mediaType: node.type === 'audioNode' ? 'audio' : 'video'
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Transcription failed');

            // Save transcription to asset metadata
            const assetId = node.data.assetId as string;
            if (assetId) {
                const { error: updateError } = await supabase
                    .from('assets')
                    .update({
                        metadata: {
                            ...(node.data.metadata as object || {}),
                            transcription: data
                        }
                    })
                    .eq('id', assetId);

                if (updateError) {
                    console.error('Failed to save transcription:', updateError);
                }
            }

            setTranscription(data);
        } catch (error: any) {
            console.error('Transcription error:', error);
            alert(`Transcription failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        const text = transcription?.transcript || transcription?.segments?.map(s => s.text).join('\n') || '';
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveAsNode = () => {
        if (!transcription) return;

        const transcriptText = transcription.transcript || transcription.segments?.map(s => s.text).join('\n') || '';

        // Create new node positioned to the right of the current node
        const newNode: Node = {
            id: `noteNode-transcript-${Date.now()}`,
            type: 'noteNode',
            position: {
                x: node.position.x + 350,
                y: node.position.y
            },
            data: {
                label: `Transcript - ${node.data.label}`,
                content: transcriptText,
                metadata: {
                    source: 'transcription',
                    originalNodeId: node.id,
                    summary: transcription.summary
                }
            }
        };

        setNodes((nds) => [...nds, newNode]);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <Mic className="w-3 h-3" />
                Transcription Agent
            </div>

            <div className="flex-1 flex flex-col space-y-4 min-h-0">
                {!transcription ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Mic className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 mb-2">No transcription yet</p>
                            <button
                                onClick={handleTranscribe}
                                disabled={loading}
                                className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Transcribing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-3 h-3" />
                                        Transcribe Now
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header with Copy and Save Buttons */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-green-500/70 uppercase font-bold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Transcribed
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded transition-colors"
                                    title="Copy transcript"
                                >
                                    {copied ? (
                                        <CheckCircle className="w-3 h-3 text-green-400" />
                                    ) : (
                                        <Copy className="w-3 h-3" />
                                    )}
                                </button>
                                <button
                                    onClick={handleSaveAsNode}
                                    className="px-2 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 text-[9px] font-bold uppercase tracking-wider rounded border border-blue-800/50 flex items-center gap-1 transition-colors"
                                    title="Save as Note Node"
                                >
                                    <Save className="w-3 h-3" />
                                    Save as Node
                                </button>
                            </div>
                        </div>

                        {/* Summary */}
                        {transcription.summary && (
                            <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                                <div className="text-[9px] text-purple-400 uppercase font-bold mb-1">Summary</div>
                                <p className="text-xs text-slate-300 leading-relaxed">{transcription.summary}</p>
                            </div>
                        )}

                        {/* Transcript */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900 border border-slate-800 rounded-lg">
                            {transcription.segments && transcription.segments.length > 0 ? (
                                <div className="p-3 space-y-3">
                                    {transcription.segments.map((segment, i) => (
                                        <div key={i} className="text-xs">
                                            <div className="flex items-center gap-2 mb-1">
                                                {segment.speaker && (
                                                    <span className="text-[9px] text-purple-400 font-bold">{segment.speaker}</span>
                                                )}
                                                {segment.timestamp && (
                                                    <span className="text-[8px] text-slate-600 font-mono">{segment.timestamp}</span>
                                                )}
                                                {segment.emotion && (
                                                    <span className="text-[8px] text-slate-500 italic">({segment.emotion})</span>
                                                )}
                                            </div>
                                            <p className="text-slate-300 leading-relaxed">{segment.text}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3">
                                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {transcription.transcript}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Re-transcribe Button */}
                        <button
                            onClick={handleTranscribe}
                            disabled={loading}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-3 h-3 text-purple-400" />
                                    Re-transcribe
                                </>
                            )}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
