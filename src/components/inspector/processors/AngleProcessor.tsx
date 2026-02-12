'use client';
import React, { useState, useMemo } from 'react';
import { Node, useReactFlow, useEdges, useNodes } from '@xyflow/react';
import {
    Target, Megaphone, Zap, Sparkles, BookOpen, Trophy, Clock, HelpCircle,
    ChevronDown, ChevronRight, Loader2, Plus, Trash2, Copy, Check,
    Linkedin, Twitter, Instagram, Mail, DollarSign, RefreshCw, Shuffle
} from 'lucide-react';

interface ProcessorProps {
    node: Node | null;
}

// Angle type configurations
const ANGLE_TYPES = [
    { id: 'pain-point', icon: <Zap className="w-4 h-4" />, label: 'Pain Point', color: '#ef4444', description: 'Address a problem they face' },
    { id: 'benefit', icon: <Sparkles className="w-4 h-4" />, label: 'Benefit', color: '#22c55e', description: 'Highlight what they gain' },
    { id: 'story', icon: <BookOpen className="w-4 h-4" />, label: 'Story', color: '#8b5cf6', description: 'Personal narrative hook' },
    { id: 'authority', icon: <Trophy className="w-4 h-4" />, label: 'Authority', color: '#f59e0b', description: 'Expert credibility' },
    { id: 'urgency', icon: <Clock className="w-4 h-4" />, label: 'Urgency', color: '#ec4899', description: 'Time-sensitive motivation' },
    { id: 'curiosity', icon: <HelpCircle className="w-4 h-4" />, label: 'Curiosity', color: '#06b6d4', description: 'Intrigue-driven hooks' },
];

// Target audiences
const AUDIENCES = [
    'Entrepreneurs',
    'Content Creators',
    'Students',
    'Professionals',
    'Parents',
    'Developers',
    'Marketers',
    'Custom'
];

// Platforms
const PLATFORMS = [
    { id: 'linkedin', icon: <Linkedin className="w-4 h-4" />, label: 'LinkedIn', color: '#0077b5' },
    { id: 'twitter', icon: <Twitter className="w-4 h-4" />, label: 'Twitter/X', color: '#1da1f2' },
    { id: 'instagram', icon: <Instagram className="w-4 h-4" />, label: 'Instagram', color: '#e4405f' },
    { id: 'email', icon: <Mail className="w-4 h-4" />, label: 'Email', color: '#6366f1' },
    { id: 'ads', icon: <DollarSign className="w-4 h-4" />, label: 'Ads', color: '#f97316' },
];

export default function AngleProcessor({ node }: ProcessorProps) {
    const { setNodes } = useReactFlow();
    const edges = useEdges();
    const nodes = useNodes();
    const [activeTab, setActiveTab] = useState<'setup' | 'angles' | 'variations'>('setup');
    const [isGenerating, setIsGenerating] = useState(false);
    const [expandedAngle, setExpandedAngle] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin', 'twitter']);
    const [customAudience, setCustomAudience] = useState('');
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

    if (!node) return null;

    const nodeData = node.data as {
        label?: string;
        product?: string;
        targetAudience?: string;
        angles?: Array<{
            id: string;
            type: string;
            title: string;
            hook: string;
            platforms: string[];
            variations: Array<{ id: string; label: string; copy: string }>;
        }>;
    };

    const angles = nodeData.angles || [];

    // Find connected source nodes for context
    const sourceNodes = useMemo(() => {
        const incomingEdges = edges.filter(e => e.target === node.id);
        return incomingEdges
            .map(e => nodes.find(n => n.id === e.source))
            .filter(Boolean) as Node[];
    }, [edges, nodes, node.id]);

    const updateNodeData = (updates: Partial<typeof nodeData>) => {
        setNodes((nds) =>
            nds.map((n) =>
                n.id === node.id
                    ? { ...n, data: { ...n.data, ...updates } }
                    : n
            )
        );
    };

    const handleGenerateAngles = async () => {
        setIsGenerating(true);
        try {
            // Gather context from connected nodes
            const sourceContext = sourceNodes.map(n => {
                const data = n.data as { label?: string; content?: string; hook?: string };
                return `[${n.type}] ${data.label || ''}: ${data.content || data.hook || ''}`;
            }).join('\n');

            const audience = nodeData.targetAudience === 'Custom' ? customAudience : nodeData.targetAudience;

            const response = await fetch('/api/agents/angle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product: nodeData.product || nodeData.label || 'Product',
                    targetAudience: audience || 'General audience',
                    platforms: selectedPlatforms,
                    sourceContext
                })
            });

            if (response.ok) {
                const data = await response.json();
                updateNodeData({
                    angles: data.angles,
                    targetAudience: audience
                });
                setActiveTab('angles');
            }
        } catch (error) {
            console.error('Failed to generate angles:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyVariation = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDeleteAngle = (angleId: string) => {
        updateNodeData({
            angles: angles.filter(a => a.id !== angleId)
        });
    };

    const togglePlatform = (platformId: string) => {
        setSelectedPlatforms(prev =>
            prev.includes(platformId)
                ? prev.filter(p => p !== platformId)
                : [...prev, platformId]
        );
    };

    const handleCreateABVariant = async (angleId: string, variationId: string, originalCopy: string) => {
        setRegeneratingId(variationId);
        try {
            const res = await fetch('/api/agents/abtest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalCopy,
                    product: nodeData.product,
                    platform: selectedPlatforms[0],
                })
            });
            const data = await res.json();
            if (data.success) {
                // Add new variant to the angle
                const newVariation = {
                    id: `v-${Date.now()}`,
                    label: `A/B ${data.testName || 'Test'}`,
                    copy: data.variant
                };
                updateNodeData({
                    angles: angles.map(a =>
                        a.id === angleId
                            ? { ...a, variations: [...(a.variations || []), newVariation] }
                            : a
                    )
                });
            }
        } catch (e) {
            console.error('[A/B Test] Error:', e);
        } finally {
            setRegeneratingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <Target className="w-3 h-3 text-amber-400" />
                Angle Generator
            </div>

            {/* Context Badge */}
            <div className="text-[10px] text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
                <span className="text-amber-400">{nodeData.label || 'Untitled'}</span>
                <span className="text-slate-600"> • angleNode</span>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                    onClick={() => setActiveTab('setup')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'setup'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Setup
                </button>
                <button
                    onClick={() => setActiveTab('angles')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'angles'
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Angles ({angles.length})
                </button>
                <button
                    onClick={() => setActiveTab('variations')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'variations'
                        ? 'bg-yellow-600 text-white'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Variations
                </button>
            </div>

            {/* Setup Tab */}
            {activeTab === 'setup' && (
                <div className="space-y-4">
                    {/* Product/Content Name */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                            Product / Content Name
                        </label>
                        <input
                            type="text"
                            value={nodeData.product || ''}
                            onChange={(e) => updateNodeData({ product: e.target.value })}
                            placeholder="e.g., AI Writing Course, SaaS Tool..."
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                        />
                    </div>

                    {/* Target Audience */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                            Target Audience
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {AUDIENCES.map((audience) => (
                                <button
                                    key={audience}
                                    onClick={() => updateNodeData({ targetAudience: audience })}
                                    className={`p-2 text-xs rounded-lg border transition-all ${nodeData.targetAudience === audience
                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    {audience}
                                </button>
                            ))}
                        </div>
                        {nodeData.targetAudience === 'Custom' && (
                            <input
                                type="text"
                                value={customAudience}
                                onChange={(e) => setCustomAudience(e.target.value)}
                                placeholder="Describe your audience..."
                                className="w-full mt-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                            />
                        )}
                    </div>

                    {/* Platform Selection */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                            Target Platforms
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PLATFORMS.map((platform) => (
                                <button
                                    key={platform.id}
                                    onClick={() => togglePlatform(platform.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${selectedPlatforms.includes(platform.id)
                                        ? 'text-white'
                                        : 'bg-slate-900 border border-slate-700 text-slate-500 hover:border-slate-600'
                                        }`}
                                    style={selectedPlatforms.includes(platform.id) ? {
                                        backgroundColor: `${platform.color}30`,
                                        borderColor: `${platform.color}50`,
                                        color: platform.color
                                    } : {}}
                                >
                                    {platform.icon}
                                    {platform.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Connected Sources */}
                    {sourceNodes.length > 0 && (
                        <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                                Connected Sources ({sourceNodes.length})
                            </div>
                            <div className="space-y-1">
                                {sourceNodes.map((sn) => (
                                    <div key={sn.id} className="text-xs text-slate-400">
                                        • {(sn.data as { label?: string }).label || sn.type}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerateAngles}
                        disabled={isGenerating || !nodeData.product}
                        className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating Angles...
                            </>
                        ) : (
                            <>
                                <Megaphone className="w-4 h-4" />
                                Generate Marketing Angles
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Angles Tab */}
            {activeTab === 'angles' && (
                <div className="space-y-3">
                    {angles.length === 0 ? (
                        <div className="p-6 bg-slate-900/30 rounded-xl border border-dashed border-slate-700 text-center">
                            <Megaphone className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <div className="text-sm text-slate-500 mb-1">No angles generated yet</div>
                            <div className="text-[10px] text-slate-600">Go to Setup tab to generate</div>
                        </div>
                    ) : (
                        angles.map((angle) => {
                            const typeConfig = ANGLE_TYPES.find(t => t.id === angle.type) || ANGLE_TYPES[1];
                            const isExpanded = expandedAngle === angle.id;

                            return (
                                <div
                                    key={angle.id}
                                    className="rounded-xl border overflow-hidden transition-all"
                                    style={{
                                        backgroundColor: `${typeConfig.color}08`,
                                        borderColor: `${typeConfig.color}30`
                                    }}
                                >
                                    {/* Angle Header */}
                                    <button
                                        onClick={() => setExpandedAngle(isExpanded ? null : angle.id)}
                                        className="w-full p-3 flex items-center gap-3 text-left"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
                                        >
                                            {typeConfig.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-200">{angle.title}</div>
                                            <div className="text-[10px] text-slate-500">{typeConfig.label}</div>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-slate-500" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-slate-500" />
                                        )}
                                    </button>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="px-3 pb-3 space-y-3">
                                            {/* Hook */}
                                            <div className="p-3 bg-slate-900/50 rounded-lg">
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                                                    Hook
                                                </div>
                                                <div className="text-sm text-slate-300">{angle.hook}</div>
                                            </div>

                                            {/* Platforms */}
                                            <div className="flex flex-wrap gap-1">
                                                {angle.platforms?.map((platform) => {
                                                    const pConfig = PLATFORMS.find(p => p.id === platform);
                                                    if (!pConfig) return null;
                                                    return (
                                                        <span
                                                            key={platform}
                                                            className="text-[10px] px-2 py-1 rounded-full flex items-center gap-1"
                                                            style={{
                                                                backgroundColor: `${pConfig.color}20`,
                                                                color: pConfig.color
                                                            }}
                                                        >
                                                            {pConfig.icon}
                                                            {pConfig.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>

                                            {/* Variations Preview */}
                                            {angle.variations?.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                        Copy Variations ({angle.variations.length})
                                                    </div>
                                                    {angle.variations.map((v) => (
                                                        <div
                                                            key={v.id}
                                                            className="p-2 bg-slate-900/50 rounded-lg flex items-start gap-2"
                                                        >
                                                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                                                                {v.label}
                                                            </span>
                                                            <p className="flex-1 text-xs text-slate-400 line-clamp-2">{v.copy}</p>
                                                            <button
                                                                onClick={() => handleCopyVariation(v.copy, v.id)}
                                                                className="p-1 hover:bg-slate-700 rounded transition-colors"
                                                            >
                                                                {copiedId === v.id ? (
                                                                    <Check className="w-3 h-3 text-green-400" />
                                                                ) : (
                                                                    <Copy className="w-3 h-3 text-slate-500" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDeleteAngle(angle.id)}
                                                className="w-full py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Remove Angle
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {/* Regenerate Button */}
                    {angles.length > 0 && (
                        <button
                            onClick={handleGenerateAngles}
                            disabled={isGenerating}
                            className="w-full py-2 text-xs text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors flex items-center justify-center gap-1 border border-amber-500/30"
                        >
                            <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                            Regenerate All Angles
                        </button>
                    )}
                </div>
            )}

            {/* Variations Tab */}
            {activeTab === 'variations' && (
                <div className="space-y-3">
                    {angles.length === 0 ? (
                        <div className="p-6 bg-slate-900/30 rounded-xl border border-dashed border-slate-700 text-center">
                            <Megaphone className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <div className="text-sm text-slate-500">Generate angles first</div>
                        </div>
                    ) : (
                        angles.flatMap((angle) =>
                            angle.variations?.map((v) => {
                                const typeConfig = ANGLE_TYPES.find(t => t.id === angle.type) || ANGLE_TYPES[1];
                                return (
                                    <div
                                        key={v.id}
                                        className="p-3 rounded-xl border transition-all"
                                        style={{
                                            backgroundColor: `${typeConfig.color}05`,
                                            borderColor: `${typeConfig.color}20`
                                        }}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span
                                                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                                style={{
                                                    backgroundColor: `${typeConfig.color}20`,
                                                    color: typeConfig.color
                                                }}
                                            >
                                                {v.label}
                                            </span>
                                            <span className="text-[10px] text-slate-500">{angle.title}</span>
                                            <button
                                                onClick={() => handleCopyVariation(v.copy, v.id)}
                                                className="ml-auto p-1 hover:bg-slate-700 rounded transition-colors"
                                            >
                                                {copiedId === v.id ? (
                                                    <Check className="w-4 h-4 text-green-400" />
                                                ) : (
                                                    <Copy className="w-4 h-4 text-slate-500" />
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-sm text-slate-300">{v.copy}</p>
                                        {/* A/B Test Button */}
                                        <button
                                            onClick={() => handleCreateABVariant(angle.id, v.id, v.copy)}
                                            disabled={regeneratingId === v.id}
                                            className="mt-2 w-full py-1.5 text-[10px] text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors flex items-center justify-center gap-1 border border-purple-500/30"
                                        >
                                            {regeneratingId === v.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Shuffle className="w-3 h-3" />
                                            )}
                                            Create A/B Variant
                                        </button>
                                        {/* Platform badges */}
                                        <div className="flex gap-1 mt-2">
                                            {angle.platforms?.slice(0, 3).map((platform) => {
                                                const pConfig = PLATFORMS.find(p => p.id === platform);
                                                if (!pConfig) return null;
                                                return (
                                                    <span
                                                        key={platform}
                                                        className="text-[8px] px-1.5 py-0.5 rounded"
                                                        style={{
                                                            backgroundColor: `${pConfig.color}20`,
                                                            color: pConfig.color
                                                        }}
                                                    >
                                                        {pConfig.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            }) || []
                        )
                    )}
                </div>
            )}
        </div>
    );
}
