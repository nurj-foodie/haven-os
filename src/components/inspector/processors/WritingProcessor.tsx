'use client';
import React, { useState, useEffect } from 'react';
import { PenTool, Sparkles, Wand2, Repeat, Mail, Video, Linkedin, Twitter, Instagram, User, ChevronDown, ChevronUp, Save, FolderOpen, Trash2, Zap, Film, Clock, FileOutput, MessageSquare, FileText, BookOpen, HelpCircle } from 'lucide-react';
import { ProcessorProps } from './types';
import { useReactFlow } from '@xyflow/react';
import HistoryPanel from '../HistoryPanel';

interface VoiceProfile {
    samples: string;
    rules: string;
    enabled: boolean;
}

interface SavedProfile {
    name: string;
    samples: string;
    rules: string;
}

const STORAGE_KEY = 'haven-voice-profiles';

// Helper functions for localStorage
const getSavedProfiles = (): SavedProfile[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

const saveProfilesToStorage = (profiles: SavedProfile[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
};

export default function WritingProcessor({ node }: ProcessorProps) {
    const { setNodes } = useReactFlow();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [voiceExpanded, setVoiceExpanded] = useState(false);
    const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>({
        samples: '',
        rules: '',
        enabled: false
    });
    const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
    const [newProfileName, setNewProfileName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [languageMode, setLanguageMode] = useState<'EN' | 'MS'>('EN');

    // Load saved profiles from localStorage on mount
    useEffect(() => {
        setSavedProfiles(getSavedProfiles());
    }, []);

    useEffect(() => {
        if (node && (node.type === 'noteNode' || node.type === 'docNode')) {
            setContent((node.data.content as string) || '');
            const savedVoice = node.data.voiceProfile as VoiceProfile | undefined;
            if (savedVoice) {
                setVoiceProfile(savedVoice);
            }
        }
    }, [node?.id, node?.data?.content, node?.data?.voiceProfile]);

    if (!node) return null;

    const updateNodeContent = (newContent: string) => {
        setContent(newContent);
        setNodes((nodes) =>
            nodes.map((n) => {
                if (n.id === node.id) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            content: newContent
                        }
                    };
                }
                return n;
            })
        );
    };

    const updateVoiceProfile = (updates: Partial<VoiceProfile>) => {
        const newProfile = { ...voiceProfile, ...updates };
        setVoiceProfile(newProfile);
        setNodes((nodes) =>
            nodes.map((n) => {
                if (n.id === node.id) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            voiceProfile: newProfile
                        }
                    };
                }
                return n;
            })
        );
    };

    const saveCurrentProfile = () => {
        if (!newProfileName.trim()) return;
        const newProfile: SavedProfile = {
            name: newProfileName.trim(),
            samples: voiceProfile.samples,
            rules: voiceProfile.rules
        };
        const updated = [...savedProfiles.filter(p => p.name !== newProfile.name), newProfile];
        setSavedProfiles(updated);
        saveProfilesToStorage(updated);
        setNewProfileName('');
        setShowSaveInput(false);
    };

    const loadProfile = (profile: SavedProfile) => {
        updateVoiceProfile({
            samples: profile.samples,
            rules: profile.rules,
            enabled: true
        });
    };

    const deleteProfile = (name: string) => {
        const updated = savedProfiles.filter(p => p.name !== name);
        setSavedProfiles(updated);
        saveProfilesToStorage(updated);
    };

    const getVoicePayload = () => {
        if (!voiceProfile.enabled) return undefined;
        if (!voiceProfile.samples.trim() && !voiceProfile.rules.trim()) return undefined;
        return {
            samples: voiceProfile.samples,
            rules: voiceProfile.rules
        };
    };

    const handleAIAction = async (action: string) => {
        if (!content.trim()) return;
        setLoading(true);

        try {
            const res = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'write',
                    content: content,
                    prompt: action,
                    voiceProfile: getVoicePayload(),
                    languageMode
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            updateNodeContent(data.text);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRepurpose = async (action: string, platform?: string) => {
        if (!content.trim()) return;
        setLoading(true);
        setLoadingAction(action);

        try {
            const res = await fetch('/api/ai/repurpose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    content,
                    platform,
                    voiceProfile: getVoicePayload(),
                    languageMode,
                    sourceNodeId: node.id // Pass source node ID for edge creation
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Save current version to history before updating
            const currentHistory = (node.data.history as any[]) || [];
            const newHistory = [
                {
                    timestamp: Date.now(),
                    content: content,
                    transformationType: action,
                    platform: platform
                },
                ...currentHistory
            ];

            // Update node with new content and history
            setNodes((nodes) =>
                nodes.map((n) => {
                    if (n.id === node.id) {
                        return {
                            ...n,
                            data: {
                                ...n.data,
                                content: data.content,
                                history: newHistory
                            }
                        };
                    }
                    return n;
                })
            );

            setContent(data.content);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setLoadingAction(null);
        }
    };

    // Chain workflow handler - creates multiple nodes at once
    const handleChainWorkflow = async (workflowType: 'ATOMIZE' | 'VIDEO_PIPELINE') => {
        if (!content.trim()) return;
        setLoading(true);
        setLoadingAction(workflowType);

        try {
            let transformations: { action: string; platform?: string }[] = [];

            if (workflowType === 'ATOMIZE') {
                // Content Atomization: LinkedIn + Twitter + Instagram
                transformations = [
                    { action: 'FORMAT_PLATFORM', platform: 'linkedin' },
                    { action: 'FORMAT_PLATFORM', platform: 'twitter' },
                    { action: 'FORMAT_PLATFORM', platform: 'instagram' }
                ];
            } else if (workflowType === 'VIDEO_PIPELINE') {
                // Video Pipeline: Newsletter → Script
                transformations = [
                    { action: 'TWEET_TO_NEWSLETTER' },
                    { action: 'NEWSLETTER_TO_SCRIPT' }
                ];
            }

            // Execute transformations sequentially
            for (const transformation of transformations) {
                const res = await fetch('/api/ai/repurpose', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: transformation.action,
                        content,
                        platform: transformation.platform,
                        voiceProfile: getVoicePayload(),
                        languageMode,
                        sourceNodeId: node.id
                    }),
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                // Dispatch event for each node creation
                const event = new CustomEvent('createRepurposedNode', {
                    detail: {
                        sourceNodeId: node.id,
                        content: data.content,
                        label: data.label,
                        nodeType: data.nodeType,
                        transformationType: transformation.action,
                        platform: transformation.platform,
                        metadata: data.metadata,
                        isChainWorkflow: true,
                        chainIndex: transformations.indexOf(transformation)
                    }
                });
                window.dispatchEvent(event);

                // Small delay to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setLoadingAction(null);
        }
    };

    // Create a new noteNode from current content
    const handleCreateNote = () => {
        if (!content.trim()) return;

        // Generate a label from the first line or first 30 chars
        const firstLine = content.split('\n')[0].trim();
        const label = firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine || 'Polished Content';

        const event = new CustomEvent('createNoteFromContent', {
            detail: {
                sourceNodeId: node.id,
                content: content,
                label: label
            }
        });
        window.dispatchEvent(event);
    };

    // Transform content into different formats
    const handleTransform = async (transformType: 'NEWSLETTER' | 'THREAD' | 'SCRIPT') => {
        if (!content.trim()) return;
        setLoading(true);
        setLoadingAction(transformType);

        try {
            let action = '';
            if (transformType === 'NEWSLETTER') action = 'CONTENT_TO_NEWSLETTER';
            else if (transformType === 'THREAD') action = 'CONTENT_TO_THREAD';
            else if (transformType === 'SCRIPT') action = 'CONTENT_TO_SCRIPT';

            const res = await fetch('/api/ai/repurpose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    content,
                    voiceProfile: getVoicePayload(),
                    languageMode,
                    sourceNodeId: node.id
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // Create a new note node with the transformed content
            const event = new CustomEvent('createNoteFromContent', {
                detail: {
                    sourceNodeId: node.id,
                    content: data.content,
                    label: data.label || `${transformType} Version`
                }
            });
            window.dispatchEvent(event);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setLoadingAction(null);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 border-t border-slate-800 pt-4 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <PenTool className="w-3 h-3" />
                    Writing Agent
                </div>
                {/* Language Toggle */}
                <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                    <button
                        onClick={() => setLanguageMode('EN')}
                        className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors ${languageMode === 'EN' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLanguageMode('MS')}
                        className={`px-2 py-0.5 text-[9px] font-bold rounded transition-colors ${languageMode === 'MS' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        BM
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col space-y-4 min-h-0">

                {/* Voice Profile Section */}
                <div className="bg-gradient-to-r from-violet-900/20 to-purple-900/20 border border-violet-700/30 rounded-lg">
                    <button
                        onClick={() => setVoiceExpanded(!voiceExpanded)}
                        className="w-full px-3 py-2 flex items-center justify-between text-xs text-slate-300 hover:bg-violet-900/20 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-violet-400" />
                            <span className="font-bold uppercase tracking-wider">Voice Profile</span>
                            {voiceProfile.enabled && (
                                <span className="px-1.5 py-0.5 bg-violet-500/30 text-violet-300 text-[9px] rounded">ACTIVE</span>
                            )}
                        </div>
                        {voiceExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {voiceExpanded && (
                        <div className="p-3 space-y-3 border-t border-violet-700/30">
                            {/* Load Saved Profile */}
                            {savedProfiles.length > 0 && (
                                <div>
                                    <label className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 block">
                                        Load Saved Profile
                                    </label>
                                    <div className="flex flex-wrap gap-1">
                                        {savedProfiles.map((p) => (
                                            <div key={p.name} className="flex items-center gap-1">
                                                <button
                                                    onClick={() => loadProfile(p)}
                                                    className="px-2 py-1 bg-violet-900/40 hover:bg-violet-800/50 text-violet-200 text-[9px] rounded border border-violet-700/50 transition-colors flex items-center gap-1"
                                                >
                                                    <FolderOpen className="w-2.5 h-2.5" />
                                                    {p.name}
                                                </button>
                                                <button
                                                    onClick={() => deleteProfile(p.name)}
                                                    className="p-1 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Enable Toggle */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={voiceProfile.enabled}
                                    onChange={(e) => updateVoiceProfile({ enabled: e.target.checked })}
                                    className="w-3 h-3 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                                />
                                <span className="text-[10px] text-slate-400">Enable voice for this node</span>
                            </label>

                            {/* Writing Samples */}
                            <div>
                                <label className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 block">
                                    Writing Samples (paste 3-5 examples)
                                </label>
                                <textarea
                                    value={voiceProfile.samples}
                                    onChange={(e) => updateVoiceProfile({ samples: e.target.value })}
                                    placeholder="Paste your writing samples here, one per paragraph..."
                                    className="w-full h-20 bg-slate-900/50 border border-slate-700 rounded p-2 text-[10px] text-slate-300 resize-none focus:outline-none focus:border-violet-500 custom-scrollbar"
                                />
                            </div>

                            {/* Style Rules */}
                            <div>
                                <label className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 block">
                                    Style Rules (explicit instructions)
                                </label>
                                <textarea
                                    value={voiceProfile.rules}
                                    onChange={(e) => updateVoiceProfile({ rules: e.target.value })}
                                    placeholder="e.g. Mix BM slang with English, never use 'anda', keep it casual..."
                                    className="w-full h-16 bg-slate-900/50 border border-slate-700 rounded p-2 text-[10px] text-slate-300 resize-none focus:outline-none focus:border-violet-500 custom-scrollbar"
                                />
                            </div>

                            {/* Save Profile */}
                            <div className="pt-2 border-t border-slate-700/50">
                                {showSaveInput ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newProfileName}
                                            onChange={(e) => setNewProfileName(e.target.value)}
                                            placeholder="Profile name..."
                                            className="flex-1 px-2 py-1 bg-slate-900/50 border border-slate-700 rounded text-[10px] text-slate-300 focus:outline-none focus:border-violet-500"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && saveCurrentProfile()}
                                        />
                                        <button
                                            onClick={saveCurrentProfile}
                                            disabled={!newProfileName.trim()}
                                            className="px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[9px] rounded transition-colors disabled:opacity-50"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => { setShowSaveInput(false); setNewProfileName(''); }}
                                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[9px] rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowSaveInput(true)}
                                        disabled={!voiceProfile.samples.trim() && !voiceProfile.rules.trim()}
                                        className="px-3 py-1.5 bg-violet-900/40 hover:bg-violet-800/50 text-violet-200 text-[9px] font-bold uppercase tracking-wider rounded border border-violet-700/50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        <Save className="w-3 h-3" />
                                        Save as Preset
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* History Button */}
                {Array.isArray(node.data.history) && node.data.history.length > 0 && (
                    <button
                        onClick={() => setShowHistory(true)}
                        className="px-3 py-2 bg-blue-900/20 hover:bg-blue-900/30 text-blue-300 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-800/50 transition-colors flex items-center justify-center gap-2"
                    >
                        <Clock className="w-3 h-3" />
                        View History ({node.data.history.length})
                    </button>
                )}

                {/* Editor Area */}
                <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden focus-within:border-slate-600 transition-colors min-h-[120px]">
                    <textarea
                        className="flex-1 w-full bg-transparent p-3 text-xs text-slate-200 resize-none focus:outline-none custom-scrollbar leading-relaxed"
                        placeholder="Start typing..."
                        value={content}
                        onChange={(e) => updateNodeContent(e.target.value)}
                    />
                </div>

                {/* STEP 1: POLISH */}
                <div className="space-y-2">
                    <div className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold">Step 1: Polish</div>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => handleAIAction('expand')}
                            disabled={loading || !content}
                            className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                            <Wand2 className="w-3 h-3 text-purple-400" />
                            Expand
                        </button>
                        <button
                            onClick={() => handleAIAction('simplify')}
                            disabled={loading || !content}
                            className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                            <Sparkles className="w-3 h-3 text-blue-400" />
                            Simplify
                        </button>
                        <button
                            onClick={() => handleAIAction('fix_grammar')}
                            disabled={loading || !content}
                            className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                            <Sparkles className="w-3 h-3 text-green-400" />
                            Polish
                        </button>
                    </div>
                </div>

                {/* STEP 2: CREATE NOTE */}
                <div className="space-y-2 border-t border-slate-800 pt-4">
                    <div className="text-[9px] text-amber-400 uppercase tracking-widest font-bold">Step 2: Create Note</div>
                    <button
                        onClick={handleCreateNote}
                        disabled={loading || !content}
                        className="w-full px-3 py-2.5 bg-gradient-to-r from-amber-900/40 to-orange-900/40 hover:from-amber-800/50 hover:to-orange-800/50 text-amber-200 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-700/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <FileOutput className="w-4 h-4" />
                        Create Note from Content
                    </button>
                    <p className="text-[9px] text-slate-600 text-center">Spawns a new noteNode you can connect to other agents</p>
                </div>

                {/* STEP 3: TRANSFORM */}
                <div className="space-y-2 border-t border-slate-800 pt-4">
                    <div className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold">Step 3: Transform</div>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => handleTransform('NEWSLETTER')}
                            disabled={loading || !content}
                            className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                        >
                            <Mail className="w-4 h-4 text-amber-400" />
                            {loadingAction === 'NEWSLETTER' ? '...' : 'Newsletter'}
                        </button>
                        <button
                            onClick={() => handleTransform('THREAD')}
                            disabled={loading || !content}
                            className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                        >
                            <MessageSquare className="w-4 h-4 text-sky-400" />
                            {loadingAction === 'THREAD' ? '...' : 'Thread'}
                        </button>
                        <button
                            onClick={() => handleTransform('SCRIPT')}
                            disabled={loading || !content}
                            className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                        >
                            <Video className="w-4 h-4 text-rose-400" />
                            {loadingAction === 'SCRIPT' ? '...' : 'Script'}
                        </button>
                    </div>
                    <p className="text-[9px] text-slate-600 text-center">Creates a new noteNode with transformed content</p>
                </div>

                {/* STEP 4: FORMAT FOR PLATFORM */}
                <div className="space-y-2 border-t border-slate-800 pt-4">
                    <div className="text-[9px] text-violet-400 uppercase tracking-widest font-bold">Step 4: Format for Platform</div>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => handleRepurpose('FORMAT_PLATFORM', 'linkedin')}
                            disabled={loading || !content}
                            className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                            <Linkedin className="w-3 h-3 text-blue-500" />
                            LinkedIn
                        </button>
                        <button
                            onClick={() => handleRepurpose('FORMAT_PLATFORM', 'twitter')}
                            disabled={loading || !content}
                            className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                            <Twitter className="w-3 h-3 text-sky-400" />
                            Twitter
                        </button>
                        <button
                            onClick={() => handleRepurpose('FORMAT_PLATFORM', 'instagram')}
                            disabled={loading || !content}
                            className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                            <Instagram className="w-3 h-3 text-pink-400" />
                            Instagram
                        </button>
                    </div>
                </div>

                {/* STEP 5: CHAIN WORKFLOWS */}
                <div className="space-y-2 border-t border-slate-800 pt-4">
                    <div className="text-[9px] text-purple-400 uppercase tracking-widest font-bold">Step 5: Chain Workflows</div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleChainWorkflow('ATOMIZE')}
                            disabled={loading || !content}
                            className="px-3 py-2 bg-gradient-to-r from-purple-900/30 to-blue-900/30 hover:from-purple-800/40 hover:to-blue-800/40 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-purple-700/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Zap className="w-3 h-3 text-purple-400" />
                            {loadingAction === 'ATOMIZE' ? 'Creating 3 nodes...' : 'Atomize (3x)'}
                        </button>
                        <button
                            onClick={() => handleChainWorkflow('VIDEO_PIPELINE')}
                            disabled={loading || !content}
                            className="px-3 py-2 bg-gradient-to-r from-cyan-900/30 to-teal-900/30 hover:from-cyan-800/40 hover:to-teal-800/40 text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded border border-cyan-700/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Film className="w-3 h-3 text-cyan-400" />
                            {loadingAction === 'VIDEO_PIPELINE' ? 'Building...' : 'Video Pipeline'}
                        </button>
                    </div>
                </div>

                {/* STEP 6: TEACH */}
                <div className="space-y-2 border-t border-slate-800 pt-4">
                    <div className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold">Step 6: Teach</div>
                    <div className="text-[9px] text-slate-600 mb-2">Turn your content into learning materials</div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => {
                                const event = new CustomEvent('createCourseFromContent', {
                                    detail: {
                                        sourceNodeId: node.id,
                                        content: content,
                                        label: 'Course: ' + (node.data.label || 'Learning Module').toString().substring(0, 30)
                                    }
                                });
                                window.dispatchEvent(event);
                            }}
                            disabled={loading || !content}
                            className="px-3 py-2.5 bg-purple-900/20 hover:bg-purple-900/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider rounded border border-purple-600/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <BookOpen className="w-4 h-4" />
                            Create Course
                        </button>
                        <button
                            onClick={() => {
                                const event = new CustomEvent('createQuizFromContent', {
                                    detail: {
                                        sourceNodeId: node.id,
                                        content: content,
                                        label: 'Quiz: ' + (node.data.label || 'Knowledge Test').toString().substring(0, 30)
                                    }
                                });
                                window.dispatchEvent(event);
                            }}
                            disabled={loading || !content}
                            className="px-3 py-2.5 bg-blue-900/20 hover:bg-blue-900/30 text-blue-300 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-600/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <HelpCircle className="w-4 h-4" />
                            Create Quiz
                        </button>
                    </div>
                </div>

                {loading && (
                    <div className="text-center text-xs text-slate-500 animate-pulse">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        {loadingAction ? 'Repurposing content...' : 'Refining content...'}
                    </div>
                )}
            </div>

            {/* History Panel */}
            {showHistory && (
                <HistoryPanel
                    history={(node.data.history as any[]) || []}
                    currentContent={content}
                    onRestore={(restoredContent) => {
                        updateNodeContent(restoredContent);
                        setShowHistory(false);
                    }}
                    onClose={() => setShowHistory(false)}
                />
            )}
        </div>
    );
}
