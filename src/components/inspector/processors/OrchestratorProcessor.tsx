'use client';
import React, { useState } from 'react';
import { Layers, Sparkles, BrainCircuit, Save, Link as LinkIcon, Brain, Repeat, Mail, Video, Linkedin, Twitter, Instagram, Calendar } from 'lucide-react';
import { Node, useReactFlow, Edge, MarkerType } from '@xyflow/react';
import BrainstormProcessor from './BrainstormProcessor';

interface OrchestratorProps {
    nodes: Node[];
}

export default function OrchestratorProcessor({ nodes }: OrchestratorProps) {
    const { setNodes, addEdges, getNodes } = useReactFlow();
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [batchProgress, setBatchProgress] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'orchestrate' | 'brainstorm'>('orchestrate');

    // Content Calendar State
    const [calendarStartDate, setCalendarStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [calendarDays, setCalendarDays] = useState(7);
    const [calendarPlatforms, setCalendarPlatforms] = useState<string[]>(['linkedin']);

    const handleSynthesize = async (prompt?: string, isAutoConnect: boolean = false) => {
        setLoading(true);
        try {
            // Prepare content from all nodes
            const contentPayload = nodes.map(node => {
                let text = '';
                if (node.type === 'noteNode') text = node.data.content as string;
                else if (node.type === 'docNode') text = `Document: ${node.data.label} (${node.data.url})`;
                else if (node.type === 'imageNode') text = `Image: ${node.data.label} (${node.data.url})`;
                else if (node.type === 'linkNode') text = `Link: ${node.data.label} (${node.data.url})`;
                else if (node.type === 'audioNode') text = `Audio: ${node.data.label} (TRANSCRIPT: ${JSON.stringify(node.data.metadata)})`;
                else if (node.type === 'videoNode') text = `Video: ${node.data.label} (TRANSCRIPT: ${JSON.stringify(node.data.metadata)})`;

                // CRITICAL: Include ID for auto-linking
                return `[ID: ${node.id}] [Type: ${node.type}] ${text}`;
            }).join('\n---\n');

            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'orchestrate',
                    content: contentPayload,
                    prompt: prompt
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            if (isAutoConnect) {
                // Parse JSON response for edges
                try {
                    // Extract JSON if wrapped in markdown code blocks
                    const jsonString = data.text.replace(/```json\n|\n```/g, '');
                    const parsed = JSON.parse(jsonString);

                    if (parsed.edges && Array.isArray(parsed.edges)) {
                        const newEdges = parsed.edges.map((edge: any) => ({
                            id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            source: edge.source,
                            target: edge.target,
                            label: edge.label,
                            type: 'default',
                            markerEnd: { type: MarkerType.ArrowClosed },
                            animated: true,
                            style: { stroke: '#a855f7' } // Purple edges for AI connections
                        }));

                        addEdges(newEdges);
                        setResult(`✨ Created ${newEdges.length} connections between nodes.`);
                    } else {
                        setResult('No connections found by AI.');
                    }
                } catch (e) {
                    console.error("Failed to parse auto-connect JSON", e);
                    setResult('Failed to parse AI connections.');
                }
            } else {
                setResult(data.text);
            }
        } catch (error) {
            console.error(error);
            setResult('Synthesis failed.');
        } finally {
            setLoading(false);
        }
    };


    const handleSaveResultAsNode = () => {
        if (!result) return;

        // Calculate center position of selected nodes to place the new node nearby
        const xSum = nodes.reduce((acc, node) => acc + node.position.x, 0);
        const ySum = nodes.reduce((acc, node) => acc + node.position.y, 0);
        const centerX = xSum / nodes.length;
        const centerY = ySum / nodes.length;

        const newNode: Node = {
            id: `noteNode-ai-${Date.now()}`,
            type: 'noteNode',
            position: { x: centerX + 300, y: centerY }, // Offset to the right
            data: {
                label: 'AI Synthesis',
                content: result,
                assetId: null
            },
        };

        setNodes((nds) => nds.concat(newNode));
    };

    const handleBatchRepurpose = async (action: string, platform?: string) => {
        // Filter for valid Note Nodes
        const validNodes = nodes.filter(n => n.type === 'noteNode' && n.data.content);
        if (validNodes.length === 0) return;

        setLoading(true);

        // Iterate sequentially
        for (let i = 0; i < validNodes.length; i++) {
            const node = validNodes[i];
            setBatchProgress(`Processing ${i + 1}/${validNodes.length}`);

            try {
                const res = await fetch('/api/ai/repurpose', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action,
                        content: node.data.content,
                        platform,
                        sourceNodeId: node.id
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                // Dispatch custom event for visual node creation
                const event = new CustomEvent('createRepurposedNode', {
                    detail: {
                        sourceNodeId: node.id,
                        content: data.content,
                        label: data.label,
                        nodeType: data.nodeType,
                        transformationType: action,
                        platform: platform,
                        metadata: data.metadata
                    }
                });
                window.dispatchEvent(event);

                // Small delay to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error(`Failed to repurpose node ${node.id}`, error);
            }
        }

        setLoading(false);
        setBatchProgress(null);
    };

    const handleGenerateCalendar = async () => {
        if (calendarPlatforms.length === 0 || nodes.length === 0) return;

        setLoading(true);
        setBatchProgress('Generating calendar...');

        try {
            // Prepare source content
            const sourceContent = nodes.map(n => {
                if (n.type === 'noteNode') return n.data.content;
                return `${n.type}: ${n.data.label}`;
            }).join('\n---\n');

            // Find the rightmost node to position new timeline
            const maxX = Math.max(...nodes.map(n => n.position.x), 0);
            const baseX = maxX + 400;
            const baseY = Math.min(...nodes.map(n => n.position.y), 100);

            let processedCount = 0;
            const totalNodes = calendarDays * calendarPlatforms.length;

            // Generate for each day and platform
            for (let day = 0; day < calendarDays; day++) {
                const targetDate = new Date(calendarStartDate);
                targetDate.setDate(targetDate.getDate() + day);
                const dateStr = targetDate.toISOString().split('T')[0];

                for (const platform of calendarPlatforms) {
                    setBatchProgress(`Generating ${processedCount + 1}/${totalNodes}`);

                    const res = await fetch('/api/ai/repurpose', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'FORMAT_PLATFORM',
                            content: sourceContent,
                            platform,
                            scheduledDate: dateStr
                        }),
                    });

                    const data = await res.json();
                    if (res.ok) {
                        // Create node positioned in timeline
                        const newNode: Node = {
                            id: `noteNode-calendar-${Date.now()}-${Math.random()}`,
                            type: 'noteNode',
                            position: {
                                x: baseX + (calendarPlatforms.indexOf(platform) * 250),
                                y: baseY + (day * 200)
                            },
                            data: {
                                label: `${platform.toUpperCase()} - ${dateStr}`,
                                content: data.content,
                                metadata: {
                                    scheduledDate: dateStr,
                                    platform,
                                    generatedFrom: 'calendar'
                                }
                            },
                        };
                        setNodes((nds) => [...nds, newNode]);
                    }

                    processedCount++;
                    // Small delay between requests
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            setBatchProgress(null);
            setResult(`✨ Generated ${totalNodes} posts for ${calendarDays} days`);
        } catch (error) {
            console.error('Calendar generation failed:', error);
            setResult('Calendar generation failed.');
        } finally {
            setLoading(false);
            setBatchProgress(null);
        }
    };

    // Build combined context for Brainstorm
    const combinedContext = nodes.map(node => {
        let text = '';
        const metadata = typeof node.data.metadata === 'object' && node.data.metadata !== null
            ? node.data.metadata as Record<string, any>
            : {};
        if (node.type === 'noteNode') text = String(node.data.content || '');
        else if (node.type === 'docNode') text = `Document: ${node.data.label}`;
        else if (node.type === 'imageNode') text = `Image: ${node.data.label}`;
        else if (node.type === 'linkNode') text = `Link: ${node.data.label}`;
        else if (node.type === 'courseNode') text = `Course: ${node.data.label} - ${JSON.stringify(metadata.modules || [])}`;
        else if (node.type === 'quizNode') text = `Quiz: ${node.data.label}`;
        return `[${node.type}] ${text}`;
    }).join('\n---\n');

    return (
        <div className="flex flex-col gap-4 overflow-y-auto h-full">
            <div className="flex items-center gap-2 mb-2 text-xs text-slate-500 font-bold uppercase tracking-wider flex-shrink-0">
                <BrainCircuit className="w-3 h-3 text-purple-400" />
                Neural Orchestrator
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 flex-shrink-0">
                <button
                    onClick={() => setActiveTab('orchestrate')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 min-w-0 ${activeTab === 'orchestrate'
                        ? 'bg-slate-700 text-slate-200'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    <Sparkles className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">Orchestrate</span>
                </button>
                <button
                    onClick={() => setActiveTab('brainstorm')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-1.5 min-w-0 ${activeTab === 'brainstorm'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    <Brain className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">Brainstorm</span>
                </button>
            </div>

            <div className="flex flex-col gap-4 flex-1 min-h-0">
                {/* Selection Summary */}
                <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 flex-shrink-0">
                    <div className="text-xs text-slate-400 font-medium mb-2 flex items-center justify-between">
                        <span>Active Context</span>
                        <span className="bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">{nodes.length} Items</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {nodes.slice(0, 5).map((n, i) => (
                            <div key={n.id} className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center" title={n.data.label as string}>
                                <Layers className="w-3 h-3 text-slate-500" />
                            </div>
                        ))}
                        {nodes.length > 5 && (
                            <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                                +{nodes.length - 5}
                            </div>
                        )}
                    </div>
                </div>

                {activeTab === 'orchestrate' && (
                    <>
                        {/* Actions */}
                        <div className="grid grid-cols-1 gap-2 flex-shrink-0">
                            <button
                                onClick={() => handleSynthesize('Summarize the connections between these items')}
                                disabled={loading}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors text-left flex items-center gap-2"
                            >
                                <Sparkles className="w-3 h-3 text-yellow-500" />
                                Summarize Connections
                            </button>
                            <button
                                onClick={() => handleSynthesize('JSON Edges', true)}
                                disabled={loading}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors text-left flex items-center gap-2"
                            >
                                <LinkIcon className="w-3 h-3 text-blue-400" />
                                Auto-Connect Nodes
                            </button>
                            <button
                                onClick={() => handleSynthesize('Synthesize these into a single coherent narrative')}
                                disabled={loading}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors text-left flex items-center gap-2"
                            >
                                <Sparkles className="w-3 h-3 text-purple-500" />
                                Synthesize Narrative
                            </button>
                        </div>

                        {/* Batch Repurposing */}
                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 flex-shrink-0">
                            <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 font-bold uppercase tracking-wider">
                                <Repeat className="w-3 h-3" />
                                Batch Repurposing
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <button
                                    onClick={() => handleBatchRepurpose('TWEET_TO_NEWSLETTER')}
                                    disabled={loading}
                                    className="px-2 py-2 bg-gradient-to-r from-amber-900/30 to-orange-900/30 hover:from-amber-800/40 hover:to-orange-800/40 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-700/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Mail className="w-3 h-3 text-amber-400" />
                                    Expand All
                                </button>
                                <button
                                    onClick={() => handleBatchRepurpose('NEWSLETTER_TO_SCRIPT')}
                                    disabled={loading}
                                    className="px-2 py-2 bg-gradient-to-r from-rose-900/30 to-pink-900/30 hover:from-rose-800/40 hover:to-pink-800/40 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-rose-700/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Video className="w-3 h-3 text-rose-400" />
                                    Convert All
                                </button>
                            </div>

                            <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-2">Format All For</div>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => handleBatchRepurpose('FORMAT_PLATFORM', 'linkedin')}
                                    disabled={loading}
                                    className="px-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                    <Linkedin className="w-3 h-3 text-blue-500" />
                                    LinkedIn
                                </button>
                                <button
                                    onClick={() => handleBatchRepurpose('FORMAT_PLATFORM', 'twitter')}
                                    disabled={loading}
                                    className="px-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                    <Twitter className="w-3 h-3 text-sky-400" />
                                    Twitter
                                </button>
                                <button
                                    onClick={() => handleBatchRepurpose('FORMAT_PLATFORM', 'instagram')}
                                    disabled={loading}
                                    className="px-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                    <Instagram className="w-3 h-3 text-pink-400" />
                                    IG
                                </button>
                            </div>
                        </div>

                        {/* Content Calendar */}
                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 flex-shrink-0">
                            <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 font-bold uppercase tracking-wider">
                                <Calendar className="w-3 h-3" />
                                Content Calendar
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div>
                                    <label className="text-[9px] text-slate-600 uppercase tracking-wider mb-1 block">Start Date</label>
                                    <input
                                        type="date"
                                        value={calendarStartDate}
                                        onChange={(e) => setCalendarStartDate(e.target.value)}
                                        className="w-full px-2 py-1.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-300 focus:outline-none focus:border-yellow-500/30 touch-manipulation"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-600 uppercase tracking-wider mb-1 block">Days</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={calendarDays}
                                        onChange={(e) => setCalendarDays(parseInt(e.target.value))}
                                        className="w-full px-2 py-1.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-300 focus:outline-none focus:border-yellow-500/30 touch-manipulation"
                                    />
                                </div>
                            </div>

                            {/* Platform Selector */}
                            <div className="mb-3">
                                <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-2">Platforms</div>
                                <div className="flex gap-2">
                                    {['linkedin', 'twitter', 'instagram'].map(platform => (
                                        <button
                                            key={platform}
                                            onClick={() => {
                                                if (calendarPlatforms.includes(platform)) {
                                                    setCalendarPlatforms(calendarPlatforms.filter(p => p !== platform));
                                                } else {
                                                    setCalendarPlatforms([...calendarPlatforms, platform]);
                                                }
                                            }}
                                            className={`flex-1 px-2 py-2 min-h-[44px] text-[10px] font-bold uppercase tracking-wider rounded border transition-all touch-manipulation ${calendarPlatforms.includes(platform)
                                                ? 'bg-purple-900/40 border-purple-700 text-purple-300'
                                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
                                                }`}
                                        >
                                            {platform === 'linkedin' && <Linkedin className="w-3 h-3 mx-auto" />}
                                            {platform === 'twitter' && <Twitter className="w-3 h-3 mx-auto" />}
                                            {platform === 'instagram' && <Instagram className="w-3 h-3 mx-auto" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerateCalendar}
                                disabled={loading || calendarPlatforms.length === 0}
                                className="w-full px-3 py-2.5 min-h-[44px] bg-gradient-to-r from-purple-900/40 to-pink-900/40 hover:from-purple-800/50 hover:to-pink-800/50 text-slate-200 text-xs font-bold uppercase tracking-wider rounded border border-purple-700/50 transition-all disabled:opacity-50 touch-manipulation"
                            >
                                Generate {calendarDays}-Day Calendar
                            </button>
                        </div>

                        {/* Result */}
                        {result && (
                            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 flex-1 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 flex flex-col min-h-0">
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/50 flex-shrink-0">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Result</span>
                                    <button
                                        onClick={handleSaveResultAsNode}
                                        className="text-[10px] bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 px-2 py-1 rounded border border-purple-800/50 flex items-center gap-1 transition-colors"
                                        title="Save as Note Node"
                                    >
                                        <Save className="w-3 h-3" />
                                        Save as Note
                                    </button>
                                </div>
                                <div className="prose prose-invert prose-xs max-w-none flex-1 overflow-y-auto">
                                    <>
                                        {result.split('\n').map((line, i) => (
                                            <p key={i} className="mb-2 text-slate-300 leading-relaxed">{line}</p>
                                        ))}
                                    </>
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-500 animate-pulse">
                                {batchProgress ? (
                                    <>
                                        <Repeat className="w-4 h-4 mb-2 text-amber-500" />
                                        <span>{batchProgress}</span>
                                        <span className="text-[10px] text-slate-600 mt-1">Please wait for completion...</span>
                                    </>
                                ) : (
                                    <span>Orchestrating information...</span>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Brainstorm Tab Content */}
            {activeTab === 'brainstorm' && (
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Combined Context Preview */}
                    <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 mb-3 flex-shrink-0">
                        <div className="text-xs text-slate-400 font-medium mb-1">Combined Context</div>
                        <div className="text-[10px] text-slate-500 line-clamp-2">
                            {combinedContext.substring(0, 150)}...
                        </div>
                    </div>

                    {/* BrainstormProcessor with multi-node context */}
                    <div className="flex-1 min-h-0">
                        <BrainstormProcessor
                            node={{
                                id: 'multi-node',
                                type: 'orchestrator',
                                position: { x: 0, y: 0 },
                                data: {
                                    label: `${nodes.length} Selected Nodes`,
                                    content: combinedContext
                                }
                            } as Node}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
