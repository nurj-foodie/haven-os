'use client';
import React, { useState, useMemo } from 'react';
import { Node, useReactFlow, useEdges, useNodes } from '@xyflow/react';
import {
    Clapperboard, Sparkles, Zap, MessageSquare, Camera, PlayCircle,
    Type, ChevronRight, Loader2, RefreshCw, Check, Plus, Trash2,
    Clock, Layers, FileText, HelpCircle, Quote, AlertTriangle, Film, Image
} from 'lucide-react';

interface ProcessorProps {
    node: Node | null;
}

// Format presets optimized for IG/TikTok
const FORMAT_PRESETS = [
    { id: 'tiktok', name: 'TikTok', duration: '15-60s', hookTime: 2, color: '#00f2ea' },
    { id: 'reel', name: 'Reel', duration: '30-90s', hookTime: 3, color: '#E1306C' },
    { id: 'youtube-short', name: 'YT Short', duration: '30-60s', hookTime: 3, color: '#FF0000' },
    { id: 'youtube-long', name: 'YouTube', duration: '8-15m', hookTime: 30, color: '#FF0000' },
];

// Hook types
const HOOK_TYPES = [
    { id: 'question', name: 'Question', icon: <HelpCircle className="w-3 h-3" />, example: '"Did you know that..."' },
    { id: 'statement', name: 'Statement', icon: <Quote className="w-3 h-3" />, example: '"This changed everything..."' },
    { id: 'story', name: 'Story', icon: <FileText className="w-3 h-3" />, example: '"Last week I discovered..."' },
    { id: 'shock', name: 'Shock', icon: <AlertTriangle className="w-3 h-3" />, example: '"Nobody talks about this..."' },
];

// Voice styles
const VOICE_STYLES = [
    { id: 'casual', name: 'Casual', desc: 'Friendly, conversational' },
    { id: 'professional', name: 'Professional', desc: 'Polished, authoritative' },
    { id: 'energetic', name: 'Energetic', desc: 'High energy, excited' },
    { id: 'custom', name: 'Custom', desc: 'Your own style' },
];

// Shot types
const SHOT_TYPES = [
    { id: 'a-roll', name: 'A-Roll', icon: <Camera className="w-3 h-3" />, desc: 'Talking head' },
    { id: 'b-roll', name: 'B-Roll', icon: <PlayCircle className="w-3 h-3" />, desc: 'Cutaway footage' },
    { id: 'text-overlay', name: 'Text', icon: <Type className="w-3 h-3" />, desc: 'On-screen text' },
    { id: 'transition', name: 'Transition', icon: <Zap className="w-3 h-3" />, desc: 'Scene change' },
];

// CTA templates
const CTA_TEMPLATES = [
    'Follow for more tips like this!',
    'Save this for later 📌',
    'Comment your thoughts below!',
    'Link in bio for the full guide',
    'Share this with someone who needs it',
    'Drop a 🔥 if this helped!',
];

export default function ScriptProcessor({ node }: ProcessorProps) {
    const { setNodes } = useReactFlow();
    const edges = useEdges();
    const allNodes = useNodes();
    const [activeTab, setActiveTab] = useState<'story' | 'shots' | 'broll'>('story');
    const [isGenerating, setIsGenerating] = useState(false);
    const [topic, setTopic] = useState('');
    const [customVoice, setCustomVoice] = useState('');
    const [brollSuggestions, setBrollSuggestions] = useState<any[]>([]);
    const [brollKeywords, setBrollKeywords] = useState<string[]>([]);
    const [isFetchingBroll, setIsFetchingBroll] = useState(false);

    if (!node) return null;

    // Get the live node data from the nodes store (not the stale prop)
    const liveNode = allNodes.find(n => n.id === node.id) || node;

    // Find incoming connections
    const incomingEdges = edges.filter(e => e.target === node.id);
    const sourceNodes = useMemo(() => {
        return incomingEdges
            .map(edge => allNodes.find(n => n.id === edge.source))
            .filter((n): n is Node => n !== undefined);
    }, [incomingEdges, allNodes]);

    // Node data - now using liveNode for fresh data
    const format = (liveNode.data.format as string) || 'tiktok';
    const hookType = (liveNode.data.hookType as string) || 'question';
    const hook = (liveNode.data.hook as string) || '';
    const voiceStyle = (liveNode.data.voiceStyle as string) || 'casual';
    const cta = (liveNode.data.cta as string) || '';
    const contentBlocks = (liveNode.data.contentBlocks as any[]) || [];
    const scenes = (liveNode.data.scenes as any[]) || [];

    const updateNodeData = (updates: Record<string, any>) => {
        setNodes((nds) =>
            nds.map((n) =>
                n.id === node.id
                    ? { ...n, data: { ...n.data, ...updates } }
                    : n
            )
        );
    };

    // Auto-sync source nodes
    React.useEffect(() => {
        if (sourceNodes.length > 0) {
            const newSourceIds = sourceNodes.map(n => n.id);
            updateNodeData({ sourceNodeIds: newSourceIds });
        }
    }, [sourceNodes.length]);

    const handleGenerateScript = async () => {
        setIsGenerating(true);
        try {
            // Gather context from source nodes
            const sourceContext = sourceNodes
                .map(n => `${n.data.label || 'Untitled'}: ${n.data.content || ''}`)
                .join('\n\n');

            const response = await fetch('/api/agents/script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic || node.data.label,
                    format,
                    hookType,
                    voiceStyle,
                    customVoice: voiceStyle === 'custom' ? customVoice : undefined,
                    sourceContext,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                updateNodeData({
                    hook: result.hook,
                    contentBlocks: result.contentBlocks,
                    cta: result.cta,
                    scenes: result.scenes,
                    estimatedDuration: result.estimatedDuration,
                });
            }
        } catch (error) {
            console.error('Script generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddScene = () => {
        const newScene = {
            id: `scene-${Date.now()}`,
            shotType: 'a-roll',
            description: '',
            duration: 5,
        };
        updateNodeData({ scenes: [...scenes, newScene] });
    };

    const handleUpdateScene = (sceneId: string, updates: any) => {
        updateNodeData({
            scenes: scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s)
        });
    };

    const handleDeleteScene = (sceneId: string) => {
        updateNodeData({ scenes: scenes.filter(s => s.id !== sceneId) });
    };

    const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 0), 0);

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <Clapperboard className="w-3 h-3 text-rose-400" />
                Story Builder
            </div>

            {/* Source Materials Banner */}
            {sourceNodes.length > 0 && (
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-2">
                    <div className="text-[10px] text-blue-400 font-bold uppercase">
                        Using {sourceNodes.length} source{sourceNodes.length > 1 ? 's' : ''} for context
                    </div>
                </div>
            )}

            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                    onClick={() => setActiveTab('story')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'story'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Story
                </button>
                <button
                    onClick={() => setActiveTab('shots')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'shots'
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Shots ({scenes.length})
                </button>
                <button
                    onClick={() => setActiveTab('broll')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'broll'
                        ? 'bg-green-600 text-white'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    B-Roll
                </button>
            </div>

            {activeTab === 'story' && (
                <>
                    {/* Format Selector */}
                    <div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                            Format
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {FORMAT_PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => updateNodeData({ format: preset.id })}
                                    className={`p-2 rounded-lg border text-left transition-all ${format === preset.id
                                        ? 'border-rose-500/50 bg-rose-500/10'
                                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                                        }`}
                                >
                                    <div
                                        className="text-xs font-bold"
                                        style={{ color: preset.color }}
                                    >
                                        {preset.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500">{preset.duration}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Topic Input */}
                    <div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                            Topic
                        </div>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder={sourceNodes.length > 0 ? 'Auto-detected from sources...' : 'What is this video about?'}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500/50"
                        />
                    </div>

                    {/* Hook Type Selector */}
                    <div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                            Hook Style
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {HOOK_TYPES.map((ht) => (
                                <button
                                    key={ht.id}
                                    onClick={() => updateNodeData({ hookType: ht.id })}
                                    className={`p-2 rounded-lg border text-left transition-all ${hookType === ht.id
                                        ? 'border-amber-500/50 bg-amber-500/10'
                                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                        {ht.icon}
                                        {ht.name}
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-1">{ht.example}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Voice Style Selector */}
                    <div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                            Voice Style
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {VOICE_STYLES.map((vs) => (
                                <button
                                    key={vs.id}
                                    onClick={() => updateNodeData({ voiceStyle: vs.id })}
                                    className={`p-2 rounded-lg border text-left transition-all ${voiceStyle === vs.id
                                        ? 'border-purple-500/50 bg-purple-500/10'
                                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                                        }`}
                                >
                                    <div className="text-xs font-bold text-slate-300">{vs.name}</div>
                                    <div className="text-[9px] text-slate-500">{vs.desc}</div>
                                </button>
                            ))}
                        </div>
                        {voiceStyle === 'custom' && (
                            <input
                                type="text"
                                value={customVoice}
                                onChange={(e) => {
                                    setCustomVoice(e.target.value);
                                    updateNodeData({ customVoice: e.target.value });
                                }}
                                placeholder="Describe your voice style..."
                                className="w-full mt-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50"
                            />
                        )}
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerateScript}
                        disabled={isGenerating}
                        className="w-full py-3 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating Script...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate Script
                            </>
                        )}
                    </button>

                    {/* Generated Hook Preview */}
                    {hook && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-[10px] text-amber-400 font-bold uppercase flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    Generated Hook
                                </div>
                                <button
                                    onClick={handleGenerateScript}
                                    className="p-1 hover:bg-amber-500/20 rounded transition-colors"
                                    title="Regenerate"
                                >
                                    <RefreshCw className="w-3 h-3 text-amber-400" />
                                </button>
                            </div>
                            <div className="text-sm text-slate-200">"{hook}"</div>
                        </div>
                    )}

                    {/* CTA Selector */}
                    <div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                            Call to Action
                        </div>
                        <div className="space-y-1.5">
                            {CTA_TEMPLATES.map((template, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => updateNodeData({ cta: template })}
                                    className={`w-full p-2 rounded-lg border text-left text-xs transition-all ${cta === template
                                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                                        : 'border-slate-800 bg-slate-900 hover:border-slate-700 text-slate-400'
                                        }`}
                                >
                                    {template}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )
            }

            {
                activeTab === 'shots' && (
                    <>
                        {/* Duration Summary */}
                        <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">Total Duration</span>
                                </div>
                                <span className="text-lg font-bold text-rose-400">
                                    {totalDuration}s
                                </span>
                            </div>
                        </div>

                        {/* Scene List */}
                        <div className="space-y-2">
                            {scenes.map((scene, idx) => (
                                <div
                                    key={scene.id}
                                    className="bg-slate-900 rounded-lg p-3 border border-slate-800"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                            {idx + 1}
                                        </div>
                                        <select
                                            value={scene.shotType}
                                            onChange={(e) => handleUpdateScene(scene.id, { shotType: e.target.value })}
                                            className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300"
                                        >
                                            {SHOT_TYPES.map((st) => (
                                                <option key={st.id} value={st.id}>{st.name}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            value={scene.duration}
                                            onChange={(e) => handleUpdateScene(scene.id, { duration: parseInt(e.target.value) || 0 })}
                                            className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 text-center"
                                            min="1"
                                        />
                                        <span className="text-[10px] text-slate-500">sec</span>
                                        <button
                                            onClick={() => handleDeleteScene(scene.id)}
                                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3 text-red-400" />
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={scene.description}
                                        onChange={(e) => handleUpdateScene(scene.id, { description: e.target.value })}
                                        placeholder="Scene description..."
                                        className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 placeholder:text-slate-600"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Add Scene Button */}
                        <button
                            onClick={handleAddScene}
                            className="w-full py-2 border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-lg text-slate-500 hover:text-slate-400 text-xs font-bold uppercase flex items-center justify-center gap-1 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            Add Scene
                        </button>

                        {/* Shot Type Legend */}
                        <div className="grid grid-cols-2 gap-2">
                            {SHOT_TYPES.map((st) => (
                                <div key={st.id} className="flex items-center gap-2 text-[10px] text-slate-500">
                                    {st.icon}
                                    <span className="font-bold">{st.name}:</span>
                                    <span>{st.desc}</span>
                                </div>
                            ))}
                        </div>
                    </>)
            }

            {
                activeTab === 'broll' && (
                    <div className="space-y-4">
                        {/* B-Roll Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-slate-300">B-Roll Suggestions</div>
                                <div className="text-[10px] text-slate-500">Assets from your Vault matching script content</div>
                            </div>
                            <button
                                onClick={async () => {
                                    setIsFetchingBroll(true);
                                    try {
                                        const scriptContent = hook + ' ' + contentBlocks.map((b: any) => b.content).join(' ');
                                        const storedUser = localStorage.getItem('supabase-user');
                                        const userId = storedUser ? JSON.parse(storedUser).id : null;
                                        if (scriptContent && userId) {
                                            const res = await fetch('/api/agents/broll', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ scriptContent, userId })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                setBrollSuggestions(data.suggestions || []);
                                                setBrollKeywords(data.keywords || []);
                                            }
                                        }
                                    } catch (e) {
                                        console.error('[B-Roll] Error:', e);
                                    } finally {
                                        setIsFetchingBroll(false);
                                    }
                                }}
                                disabled={isFetchingBroll}
                                className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-[10px] font-semibold flex items-center gap-1"
                            >
                                {isFetchingBroll ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                Analyze Script
                            </button>
                        </div>

                        {/* Keywords */}
                        {brollKeywords.length > 0 && (
                            <div>
                                <div className="text-[10px] text-slate-500 mb-1">Detected Keywords:</div>
                                <div className="flex flex-wrap gap-1">
                                    {brollKeywords.map((kw, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px]">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggestions Grid */}
                        {brollSuggestions.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {brollSuggestions.map((asset) => (
                                    <div key={asset.id} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                                        {asset.type === 'image' ? (
                                            <img src={asset.url} alt={asset.filename} className="w-full h-20 object-cover" />
                                        ) : (
                                            <div className="w-full h-20 bg-slate-800 flex items-center justify-center">
                                                <Film className="w-6 h-6 text-slate-600" />
                                            </div>
                                        )}
                                        <div className="p-2">
                                            <div className="text-[10px] text-slate-300 truncate">{asset.filename}</div>
                                            {asset.matchedKeywords?.length > 0 && (
                                                <div className="text-[9px] text-green-400 truncate">Matches: {asset.matchedKeywords.join(', ')}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <div className="text-xs">Click "Analyze Script" to find matching assets</div>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
}
