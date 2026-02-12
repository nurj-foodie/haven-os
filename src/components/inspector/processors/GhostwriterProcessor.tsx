'use client';
import React, { useState } from 'react';
import { Ghost, TreeDeciduous, Search, Zap, FileText, Lightbulb, Twitter, ChevronDown, ChevronUp, Sparkles, Copy, CheckCircle, Plus, X } from 'lucide-react';

interface NicheNode {
    id: string;
    name: string;
    subNiches: string[];
}

interface DecodedPattern {
    structure: string;
    hook: string;
    psychology: string;
    callToAction: string;
}

type GeneratorMode = 'titles' | 'deep-posts' | 'ideas';

export default function GhostwriterProcessor() {
    // Niche Tree State
    const [niches, setNiches] = useState<NicheNode[]>([
        { id: '1', name: '', subNiches: [''] },
        { id: '2', name: '', subNiches: [''] },
        { id: '3', name: '', subNiches: [''] },
    ]);
    const [nicheTreeExpanded, setNicheTreeExpanded] = useState(true);

    // Pattern Decoder State
    const [inputPosts, setInputPosts] = useState('');
    const [decodedPatterns, setDecodedPatterns] = useState<DecodedPattern[] | null>(null);
    const [decoding, setDecoding] = useState(false);

    // Generator State
    const [generatorMode, setGeneratorMode] = useState<GeneratorMode>('titles');
    const [generatedContent, setGeneratedContent] = useState('');
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    // Niche Tree Functions
    const updateNicheName = (id: string, name: string) => {
        setNiches(niches.map(n => n.id === id ? { ...n, name } : n));
    };

    const addSubNiche = (nicheId: string) => {
        setNiches(niches.map(n =>
            n.id === nicheId ? { ...n, subNiches: [...n.subNiches, ''] } : n
        ));
    };

    const updateSubNiche = (nicheId: string, index: number, value: string) => {
        setNiches(niches.map(n => {
            if (n.id === nicheId) {
                const newSubs = [...n.subNiches];
                newSubs[index] = value;
                return { ...n, subNiches: newSubs };
            }
            return n;
        }));
    };

    const removeSubNiche = (nicheId: string, index: number) => {
        setNiches(niches.map(n => {
            if (n.id === nicheId && n.subNiches.length > 1) {
                const newSubs = n.subNiches.filter((_, i) => i !== index);
                return { ...n, subNiches: newSubs };
            }
            return n;
        }));
    };

    const buildNicheContext = () => {
        const validNiches = niches.filter(n => n.name.trim());
        if (validNiches.length === 0) return '';

        return validNiches.map(n => {
            const subs = n.subNiches.filter(s => s.trim()).join(', ');
            return `${n.name}: [${subs || 'General'}]`;
        }).join(' | ');
    };

    // Pattern Decoder
    const handleDecode = async () => {
        if (!inputPosts.trim()) return;
        setDecoding(true);

        try {
            const res = await fetch('/api/ai/ghostwriter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'DECONSTRUCT',
                    content: inputPosts,
                    nicheContext: buildNicheContext(),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setDecodedPatterns(data.patterns);
        } catch (error) {
            console.error('Decode error:', error);
        } finally {
            setDecoding(false);
        }
    };

    // Content Generator
    const handleGenerate = async () => {
        if (!decodedPatterns) return;
        setGenerating(true);

        const actionMap: Record<GeneratorMode, string> = {
            'titles': 'GENERATE_TITLES',
            'deep-posts': 'GENERATE_DEEP',
            'ideas': 'GENERATE_IDEAS',
        };

        try {
            const res = await fetch('/api/ai/ghostwriter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: actionMap[generatorMode],
                    patterns: decodedPatterns,
                    nicheContext: buildNicheContext(),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setGeneratedContent(data.content);
        } catch (error) {
            console.error('Generate error:', error);
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(generatedContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col space-y-4 text-slate-200">
            {/* Header */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <Ghost className="w-4 h-4" />
                Ghostwriter Agent
            </div>

            {/* Niche Tree Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <button
                    onClick={() => setNicheTreeExpanded(!nicheTreeExpanded)}
                    className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 hover:bg-slate-800 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <TreeDeciduous className="w-3 h-3 text-green-500" />
                        Niche Tree
                    </div>
                    {nicheTreeExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {nicheTreeExpanded && (
                    <div className="p-3 border-t border-slate-800 space-y-3">
                        {niches.map((niche, idx) => (
                            <div key={niche.id} className="space-y-2">
                                <input
                                    type="text"
                                    placeholder={`Core Niche ${idx + 1} (e.g., Technology)`}
                                    value={niche.name}
                                    onChange={(e) => updateNicheName(niche.id, e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-500"
                                />
                                <div className="pl-3 space-y-1">
                                    {niche.subNiches.map((sub, subIdx) => (
                                        <div key={subIdx} className="flex items-center gap-1">
                                            <span className="text-slate-700 text-xs">└</span>
                                            <input
                                                type="text"
                                                placeholder="Sub-niche..."
                                                value={sub}
                                                onChange={(e) => updateSubNiche(niche.id, subIdx, e.target.value)}
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-slate-600"
                                            />
                                            {niche.subNiches.length > 1 && (
                                                <button
                                                    onClick={() => removeSubNiche(niche.id, subIdx)}
                                                    className="text-slate-700 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => addSubNiche(niche.id)}
                                        className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-slate-400 transition-colors pl-4"
                                    >
                                        <Plus className="w-2.5 h-2.5" /> Add sub-niche
                                    </button>
                                </div>
                            </div>
                        ))}
                        {buildNicheContext() && (
                            <div className="mt-2 p-2 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-500 font-mono">
                                <span className="text-slate-600">Context:</span> {buildNicheContext()}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Pattern Decoder Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Search className="w-3 h-3 text-purple-500" />
                    Pattern Decoder
                </div>
                <textarea
                    placeholder="Paste 3 high-performing posts here (separate with blank lines)..."
                    value={inputPosts}
                    onChange={(e) => setInputPosts(e.target.value)}
                    className="w-full h-24 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:border-slate-500 custom-scrollbar"
                />
                <button
                    onClick={handleDecode}
                    disabled={decoding || !inputPosts.trim()}
                    className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {decoding ? (
                        <><Sparkles className="w-3 h-3 animate-spin" /> Decoding...</>
                    ) : (
                        <><Zap className="w-3 h-3" /> Decode Patterns</>
                    )}
                </button>

                {decodedPatterns && (
                    <div className="p-2 bg-green-900/20 border border-green-800/30 rounded text-[10px] text-green-400">
                        ✓ {decodedPatterns.length} pattern(s) decoded. Ready to generate.
                    </div>
                )}
            </div>

            {/* Generator Section */}
            {decodedPatterns && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        Generator
                    </div>

                    {/* Mode Selector */}
                    <div className="grid grid-cols-3 gap-1">
                        <button
                            onClick={() => setGeneratorMode('titles')}
                            className={`px-2 py-1.5 text-[9px] font-bold uppercase rounded flex items-center justify-center gap-1 transition-all ${generatorMode === 'titles'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <FileText className="w-2.5 h-2.5" /> Titles
                        </button>
                        <button
                            onClick={() => setGeneratorMode('deep-posts')}
                            className={`px-2 py-1.5 text-[9px] font-bold uppercase rounded flex items-center justify-center gap-1 transition-all ${generatorMode === 'deep-posts'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Lightbulb className="w-2.5 h-2.5" /> Deep
                        </button>
                        <button
                            onClick={() => setGeneratorMode('ideas')}
                            className={`px-2 py-1.5 text-[9px] font-bold uppercase rounded flex items-center justify-center gap-1 transition-all ${generatorMode === 'ideas'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <Twitter className="w-2.5 h-2.5" /> Ideas
                        </button>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="w-full px-3 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {generating ? (
                            <><Sparkles className="w-3 h-3 animate-spin" /> Generating...</>
                        ) : (
                            <>Generate {generatorMode === 'titles' ? '20-30 Titles' : generatorMode === 'deep-posts' ? 'Deep Posts' : '60 Ideas'}</>
                        )}
                    </button>

                    {generatedContent && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Output</span>
                                <button
                                    onClick={handleCopy}
                                    className="text-slate-600 hover:text-slate-400 transition-colors"
                                >
                                    {copied ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 custom-scrollbar whitespace-pre-wrap">
                                {generatedContent}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
