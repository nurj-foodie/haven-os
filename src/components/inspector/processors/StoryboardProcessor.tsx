'use client';
import React, { useState, useMemo } from 'react';
import { Node, useReactFlow, useEdges, useNodes } from '@xyflow/react';
import {
    Film, Sparkles, Camera, Move, Eye, Type, Image as ImageIcon,
    ChevronDown, ChevronRight, Loader2, Plus, Trash2, Clock,
    Layers, GripVertical, RefreshCw, Maximize2, Minimize2
} from 'lucide-react';

interface ProcessorProps {
    node: Node | null;
}

// Visual styles
const VISUAL_STYLES = [
    { id: 'cinematic', name: 'Cinematic', desc: 'Film-like compositions, dramatic lighting', icon: <Film className="w-3 h-3" />, color: '#8b5cf6' },
    { id: 'minimalist', name: 'Minimalist', desc: 'Clean, simple, focused visuals', icon: <Eye className="w-3 h-3" />, color: '#06b6d4' },
    { id: 'dynamic', name: 'Dynamic', desc: 'Movement, energy, action shots', icon: <Move className="w-3 h-3" />, color: '#f59e0b' },
    { id: 'hand-drawn', name: 'Sketch', desc: 'Illustrated, artistic, hand-drawn feel', icon: <ImageIcon className="w-3 h-3" />, color: '#10b981' },
    { id: 'corporate', name: 'Corporate', desc: 'Professional, polished, business-ready', icon: <Type className="w-3 h-3" />, color: '#6366f1' },
];

// Framing options
const FRAMING_OPTIONS = [
    { id: 'wide', name: 'Wide Shot', abbr: 'WS', desc: 'Full scene view' },
    { id: 'medium', name: 'Medium Shot', abbr: 'MS', desc: 'Waist up' },
    { id: 'close-up', name: 'Close-up', abbr: 'CU', desc: 'Face/detail focus' },
    { id: 'extreme-close-up', name: 'Extreme CU', abbr: 'ECU', desc: 'Eyes/small detail' },
];

// Camera movement options
const CAMERA_MOVEMENTS = [
    { id: 'static', name: 'Static', desc: 'No movement' },
    { id: 'pan', name: 'Pan', desc: 'Horizontal sweep' },
    { id: 'zoom', name: 'Zoom', desc: 'In or out' },
    { id: 'dolly', name: 'Dolly', desc: 'Move toward/away' },
    { id: 'tilt', name: 'Tilt', desc: 'Vertical sweep' },
];

// Shot types with colors
const SHOT_TYPES = [
    { id: 'a-roll', name: 'A-Roll', color: '#3b82f6', desc: 'Main footage' },
    { id: 'b-roll', name: 'B-Roll', color: '#22c55e', desc: 'Cutaway' },
    { id: 'text-overlay', name: 'Text', color: '#f97316', desc: 'On-screen text' },
    { id: 'transition', name: 'Transition', color: '#a855f7', desc: 'Scene change' },
];

interface StoryboardScene {
    id: string;
    sceneNumber: number;
    shotType: string;
    framing: string;
    cameraMovement: string;
    description: string;
    visualComposition: string;
    textOverlay?: string;
    duration: number;
    referenceKeywords: string[];
    referenceImage?: string;
    notes?: string;
}

export default function StoryboardProcessor({ node }: ProcessorProps) {
    const { setNodes } = useReactFlow();
    const edges = useEdges();
    const allNodes = useNodes();
    const [activeTab, setActiveTab] = useState<'style' | 'scenes' | 'timeline'>('style');
    const [isGenerating, setIsGenerating] = useState(false);
    const [expandedScene, setExpandedScene] = useState<string | null>(null);

    if (!node) return null;

    // Find incoming Script connections
    const incomingEdges = edges.filter(e => e.target === node.id);
    const sourceNodes = useMemo(() => {
        return incomingEdges
            .map(edge => allNodes.find(n => n.id === edge.source))
            .filter((n): n is Node => n !== undefined && n.type === 'scriptNode');
    }, [incomingEdges, allNodes]);

    // Node data
    const visualStyle = (node.data.visualStyle as string) || 'cinematic';
    const scenes = (node.data.scenes as StoryboardScene[]) || [];
    const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 0), 0);

    const updateNodeData = (updates: Record<string, any>) => {
        setNodes((nds) =>
            nds.map((n) =>
                n.id === node.id
                    ? { ...n, data: { ...n.data, ...updates } }
                    : n
            )
        );
    };

    // Generate storyboard from connected script
    const handleGenerateStoryboard = async () => {
        setIsGenerating(true);
        try {
            // Gather script content from connected nodes
            const scriptContent = sourceNodes.map(n => ({
                hook: n.data.hook || '',
                contentBlocks: n.data.contentBlocks || [],
                scenes: n.data.scenes || [],
                cta: n.data.cta || '',
            }));

            const response = await fetch('/api/agents/storyboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visualStyle,
                    scriptContent: scriptContent[0] || {},
                    nodeLabel: node.data.label,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                updateNodeData({
                    scenes: result.scenes,
                    totalDuration: result.totalDuration,
                    sourceScriptId: sourceNodes[0]?.id,
                });
            }
        } catch (error) {
            console.error('Storyboard generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Scene management
    const handleAddScene = () => {
        const newScene: StoryboardScene = {
            id: `scene-${Date.now()}`,
            sceneNumber: scenes.length + 1,
            shotType: 'a-roll',
            framing: 'medium',
            cameraMovement: 'static',
            description: '',
            visualComposition: '',
            duration: 5,
            referenceKeywords: [],
        };
        updateNodeData({ scenes: [...scenes, newScene] });
        setExpandedScene(newScene.id);
    };

    const handleUpdateScene = (sceneId: string, updates: Partial<StoryboardScene>) => {
        updateNodeData({
            scenes: scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s)
        });
    };

    const handleDeleteScene = (sceneId: string) => {
        updateNodeData({
            scenes: scenes
                .filter(s => s.id !== sceneId)
                .map((s, idx) => ({ ...s, sceneNumber: idx + 1 }))
        });
    };

    const handleMoveScene = (sceneId: string, direction: 'up' | 'down') => {
        const idx = scenes.findIndex(s => s.id === sceneId);
        if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === scenes.length - 1)) return;

        const newScenes = [...scenes];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        [newScenes[idx], newScenes[swapIdx]] = [newScenes[swapIdx], newScenes[idx]];
        updateNodeData({
            scenes: newScenes.map((s, i) => ({ ...s, sceneNumber: i + 1 }))
        });
    };

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <Film className="w-3 h-3 text-violet-400" />
                Storyboard Designer
            </div>

            {/* Connected Script Banner */}
            {sourceNodes.length > 0 ? (
                <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-lg p-2">
                    <div className="text-[10px] text-violet-400 font-bold uppercase">
                        Connected to: {sourceNodes[0].data.label as string || 'Script'}
                    </div>
                </div>
            ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-500">
                        Connect to a Script node for AI generation
                    </div>
                </div>
            )}

            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                    onClick={() => setActiveTab('style')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'style'
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Style
                </button>
                <button
                    onClick={() => setActiveTab('scenes')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'scenes'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Scenes ({scenes.length})
                </button>
                <button
                    onClick={() => setActiveTab('timeline')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'timeline'
                        ? 'bg-fuchsia-600 text-white'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Timeline
                </button>
            </div>

            {/* Style Tab */}
            {activeTab === 'style' && (
                <>
                    <div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">
                            Visual Style
                        </div>
                        <div className="space-y-2">
                            {VISUAL_STYLES.map((vs) => (
                                <button
                                    key={vs.id}
                                    onClick={() => updateNodeData({ visualStyle: vs.id })}
                                    className={`w-full p-3 rounded-lg border text-left transition-all ${visualStyle === vs.id
                                        ? 'border-violet-500/50 bg-violet-500/10'
                                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${vs.color}20`, color: vs.color }}
                                        >
                                            {vs.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-bold text-slate-300">{vs.name}</div>
                                            <div className="text-[9px] text-slate-500">{vs.desc}</div>
                                        </div>
                                        {visualStyle === vs.id && (
                                            <div className="w-2 h-2 rounded-full bg-violet-400" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerateStoryboard}
                        disabled={isGenerating || sourceNodes.length === 0}
                        className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating Storyboard...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate Storyboard
                            </>
                        )}
                    </button>
                </>
            )}

            {/* Scenes Tab */}
            {activeTab === 'scenes' && (
                <>
                    {/* Stats Summary */}
                    <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">Total Duration</span>
                            </div>
                            <span className="text-lg font-bold text-violet-400">
                                {totalDuration}s
                            </span>
                        </div>
                    </div>

                    {/* Scene List */}
                    <div className="space-y-2">
                        {scenes.map((scene) => (
                            <div
                                key={scene.id}
                                className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden"
                            >
                                {/* Scene Header */}
                                <div
                                    className="flex items-center gap-2 p-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
                                    onClick={() => setExpandedScene(expandedScene === scene.id ? null : scene.id)}
                                >
                                    <GripVertical className="w-4 h-4 text-slate-600" />
                                    <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                        style={{
                                            backgroundColor: SHOT_TYPES.find(st => st.id === scene.shotType)?.color + '20',
                                            color: SHOT_TYPES.find(st => st.id === scene.shotType)?.color
                                        }}
                                    >
                                        {scene.sceneNumber}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs text-slate-300 font-medium truncate">
                                            {scene.description || 'Untitled scene'}
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] text-slate-500">
                                            <span>{FRAMING_OPTIONS.find(f => f.id === scene.framing)?.abbr}</span>
                                            <span>•</span>
                                            <span>{scene.cameraMovement}</span>
                                            <span>•</span>
                                            <span>{scene.duration}s</span>
                                        </div>
                                    </div>
                                    {expandedScene === scene.id ? (
                                        <ChevronDown className="w-4 h-4 text-slate-500" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-500" />
                                    )}
                                </div>

                                {/* Expanded Scene Details */}
                                {expandedScene === scene.id && (
                                    <div className="p-3 pt-0 space-y-3 border-t border-slate-800">
                                        {/* Shot Type */}
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Shot Type</div>
                                            <div className="flex gap-1">
                                                {SHOT_TYPES.map(st => (
                                                    <button
                                                        key={st.id}
                                                        onClick={() => handleUpdateScene(scene.id, { shotType: st.id })}
                                                        className={`flex-1 px-2 py-1.5 rounded text-[9px] font-bold transition-all ${scene.shotType === st.id
                                                            ? 'text-white'
                                                            : 'text-slate-500 bg-slate-800 hover:bg-slate-700'
                                                            }`}
                                                        style={scene.shotType === st.id ? { backgroundColor: st.color } : {}}
                                                    >
                                                        {st.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Framing */}
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Framing</div>
                                            <div className="grid grid-cols-4 gap-1">
                                                {FRAMING_OPTIONS.map(f => (
                                                    <button
                                                        key={f.id}
                                                        onClick={() => handleUpdateScene(scene.id, { framing: f.id })}
                                                        className={`p-2 rounded text-center transition-all ${scene.framing === f.id
                                                            ? 'bg-violet-500/20 border border-violet-500/50 text-violet-400'
                                                            : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                                                            }`}
                                                    >
                                                        <div className="text-[10px] font-bold">{f.abbr}</div>
                                                        <div className="text-[8px] opacity-70">{f.name.split(' ')[0]}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Camera Movement */}
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Camera</div>
                                            <div className="flex flex-wrap gap-1">
                                                {CAMERA_MOVEMENTS.map(cm => (
                                                    <button
                                                        key={cm.id}
                                                        onClick={() => handleUpdateScene(scene.id, { cameraMovement: cm.id })}
                                                        className={`px-2 py-1 rounded text-[9px] transition-all ${scene.cameraMovement === cm.id
                                                            ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                                                            : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                                                            }`}
                                                    >
                                                        {cm.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Description</div>
                                            <textarea
                                                value={scene.description}
                                                onChange={(e) => handleUpdateScene(scene.id, { description: e.target.value })}
                                                placeholder="What happens in this scene..."
                                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 resize-none"
                                                rows={2}
                                            />
                                        </div>

                                        {/* Visual Composition */}
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Visual Composition</div>
                                            <textarea
                                                value={scene.visualComposition}
                                                onChange={(e) => handleUpdateScene(scene.id, { visualComposition: e.target.value })}
                                                placeholder="Lighting, colors, elements in frame..."
                                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 resize-none"
                                                rows={2}
                                            />
                                        </div>

                                        {/* Duration */}
                                        <div className="flex items-center gap-3">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase">Duration</div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="60"
                                                value={scene.duration}
                                                onChange={(e) => handleUpdateScene(scene.id, { duration: parseInt(e.target.value) })}
                                                className="flex-1 accent-violet-500"
                                            />
                                            <span className="text-xs text-violet-400 font-bold w-10 text-right">{scene.duration}s</span>
                                        </div>

                                        {/* Text Overlay */}
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Text Overlay (optional)</div>
                                            <input
                                                type="text"
                                                value={scene.textOverlay || ''}
                                                onChange={(e) => handleUpdateScene(scene.id, { textOverlay: e.target.value })}
                                                placeholder="On-screen text..."
                                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
                                            />
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                                            <button
                                                onClick={() => handleMoveScene(scene.id, 'up')}
                                                disabled={scene.sceneNumber === 1}
                                                className="p-1.5 hover:bg-slate-800 rounded transition-colors disabled:opacity-30"
                                            >
                                                <ChevronDown className="w-4 h-4 text-slate-400 rotate-180" />
                                            </button>
                                            <button
                                                onClick={() => handleMoveScene(scene.id, 'down')}
                                                disabled={scene.sceneNumber === scenes.length}
                                                className="p-1.5 hover:bg-slate-800 rounded transition-colors disabled:opacity-30"
                                            >
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            </button>
                                            <div className="flex-1" />
                                            <button
                                                onClick={() => handleDeleteScene(scene.id)}
                                                className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                )}
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
                </>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
                <>
                    {/* Duration Bar */}
                    <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-400">Total Duration</span>
                            <span className="text-sm font-bold text-violet-400">{totalDuration}s</span>
                        </div>
                        <div className="flex items-center h-6 rounded overflow-hidden">
                            {scenes.map((scene, idx) => {
                                const widthPercent = totalDuration > 0 ? (scene.duration / totalDuration) * 100 : 0;
                                const shotType = SHOT_TYPES.find(st => st.id === scene.shotType);
                                return (
                                    <div
                                        key={scene.id}
                                        className="h-full flex items-center justify-center text-[8px] font-bold text-white relative group cursor-pointer"
                                        style={{
                                            width: `${widthPercent}%`,
                                            backgroundColor: shotType?.color || '#6366f1',
                                            minWidth: '20px'
                                        }}
                                        title={`Scene ${scene.sceneNumber}: ${scene.description || 'Untitled'} (${scene.duration}s)`}
                                    >
                                        {widthPercent > 8 && scene.sceneNumber}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Horizontal Timeline Scroll */}
                    <div className="overflow-x-auto pb-2">
                        <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
                            {scenes.map((scene) => {
                                const shotType = SHOT_TYPES.find(st => st.id === scene.shotType);
                                return (
                                    <div
                                        key={scene.id}
                                        className="w-32 flex-shrink-0 bg-slate-900 rounded-lg border border-slate-800 overflow-hidden"
                                    >
                                        {/* Thumbnail Area */}
                                        <div
                                            className="h-16 flex items-center justify-center"
                                            style={{ backgroundColor: `${shotType?.color}15` }}
                                        >
                                            <Camera className="w-6 h-6" style={{ color: shotType?.color }} />
                                        </div>
                                        {/* Info */}
                                        <div className="p-2">
                                            <div className="flex items-center gap-1 mb-1">
                                                <span
                                                    className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                                                    style={{ backgroundColor: shotType?.color }}
                                                >
                                                    {scene.sceneNumber}
                                                </span>
                                                <span className="text-[9px] text-slate-400 truncate">
                                                    {FRAMING_OPTIONS.find(f => f.id === scene.framing)?.abbr}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-300 truncate">
                                                {scene.description || 'Untitled'}
                                            </div>
                                            <div className="text-[9px] text-slate-500 mt-1">
                                                {scene.duration}s
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Shot Type Legend */}
                    <div className="grid grid-cols-2 gap-2">
                        {SHOT_TYPES.map((st) => (
                            <div key={st.id} className="flex items-center gap-2 text-[10px]">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: st.color }}
                                />
                                <span className="font-bold text-slate-400">{st.name}:</span>
                                <span className="text-slate-500">{st.desc}</span>
                            </div>
                        ))}
                    </div>

                    {/* Regenerate */}
                    {sourceNodes.length > 0 && (
                        <button
                            onClick={handleGenerateStoryboard}
                            disabled={isGenerating}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                            Regenerate from Script
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
