'use client';
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
    Film, Clock, Layers, Camera, Move, Type,
    Image as ImageIcon, Sparkles, Eye
} from 'lucide-react';

// Visual style configurations
const STYLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    'cinematic': { label: 'Cinematic', color: '#8b5cf6', icon: <Film className="w-3 h-3" /> },
    'minimalist': { label: 'Minimalist', color: '#06b6d4', icon: <Eye className="w-3 h-3" /> },
    'dynamic': { label: 'Dynamic', color: '#f59e0b', icon: <Move className="w-3 h-3" /> },
    'hand-drawn': { label: 'Sketch', color: '#10b981', icon: <ImageIcon className="w-3 h-3" /> },
    'corporate': { label: 'Corporate', color: '#6366f1', icon: <Type className="w-3 h-3" /> },
};

// Shot type colors for scene thumbnails
const SHOT_COLORS: Record<string, string> = {
    'a-roll': '#3b82f6',
    'b-roll': '#22c55e',
    'text-overlay': '#f97316',
    'transition': '#a855f7',
};

// Framing icons
const FRAMING_LABELS: Record<string, string> = {
    'wide': 'WS',
    'medium': 'MS',
    'close-up': 'CU',
    'extreme-close-up': 'ECU',
};

interface StoryboardScene {
    id: string;
    sceneNumber: number;
    shotType: 'a-roll' | 'b-roll' | 'text-overlay' | 'transition';
    framing: 'wide' | 'medium' | 'close-up' | 'extreme-close-up';
    cameraMovement: 'static' | 'pan' | 'zoom' | 'dolly' | 'tilt';
    description: string;
    visualComposition: string;
    textOverlay?: string;
    duration: number;
    referenceKeywords: string[];
    referenceImage?: string;
    notes?: string;
}

interface StoryboardNodeData {
    label?: string;
    visualStyle?: 'cinematic' | 'minimalist' | 'dynamic' | 'hand-drawn' | 'corporate';
    scenes?: StoryboardScene[];
    totalDuration?: number;
    sourceScriptId?: string;
    metadata?: any;
}

export default function StoryboardNode({ data }: NodeProps) {
    const storyboardData = data as StoryboardNodeData;
    const style = storyboardData.visualStyle || 'cinematic';
    const styleConfig = STYLE_CONFIG[style] || STYLE_CONFIG['cinematic'];
    const scenes = storyboardData.scenes || [];
    const totalDuration = storyboardData.totalDuration || scenes.reduce((sum, s) => sum + (s.duration || 0), 0);

    // Calculate completion
    const completedScenes = scenes.filter(s => s.description && s.visualComposition).length;
    const completionPercent = scenes.length > 0 ? Math.round((completedScenes / scenes.length) * 100) : 0;

    // Format duration
    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    };

    // Get first 6 scenes for thumbnail grid
    const displayScenes = scenes.slice(0, 6);
    const hasMoreScenes = scenes.length > 6;

    return (
        <div className="bg-gradient-to-br from-violet-900/30 to-purple-900/30 border-2 border-violet-500/30 rounded-xl p-4 min-w-[280px] shadow-2xl backdrop-blur-sm">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-violet-500" />

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
                    <Film className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-slate-200">
                        {storyboardData.label || 'Untitled Storyboard'}
                    </div>
                    <div
                        className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-flex items-center gap-1 mt-1"
                        style={{
                            backgroundColor: `${styleConfig.color}20`,
                            color: styleConfig.color,
                            border: `1px solid ${styleConfig.color}40`
                        }}
                    >
                        {styleConfig.icon}
                        {styleConfig.label}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1">
                    <span>Completion</span>
                    <span className="text-violet-400 font-bold">{completionPercent}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${completionPercent}%` }}
                    />
                </div>
            </div>

            {/* Scene Thumbnail Grid */}
            {scenes.length > 0 ? (
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {displayScenes.map((scene, idx) => (
                        <div
                            key={scene.id}
                            className="aspect-video rounded-md flex items-center justify-center relative overflow-hidden"
                            style={{
                                backgroundColor: `${SHOT_COLORS[scene.shotType]}15`,
                                border: `1px solid ${SHOT_COLORS[scene.shotType]}40`
                            }}
                        >
                            {/* Scene Number */}
                            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded bg-slate-900/80 flex items-center justify-center text-[8px] font-bold text-slate-300">
                                {idx + 1}
                            </div>
                            {/* Framing Badge */}
                            <div
                                className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded text-[7px] font-bold"
                                style={{
                                    backgroundColor: `${SHOT_COLORS[scene.shotType]}30`,
                                    color: SHOT_COLORS[scene.shotType]
                                }}
                            >
                                {FRAMING_LABELS[scene.framing] || 'MS'}
                            </div>
                            {/* Icon */}
                            <Camera
                                className="w-4 h-4"
                                style={{ color: SHOT_COLORS[scene.shotType] }}
                            />
                        </div>
                    ))}
                    {/* More scenes indicator */}
                    {hasMoreScenes && (
                        <div className="aspect-video rounded-md bg-slate-800/50 border border-slate-700 flex items-center justify-center">
                            <span className="text-[10px] text-slate-500 font-bold">
                                +{scenes.length - 6}
                            </span>
                        </div>
                    )}
                </div>
            ) : (
                /* Empty State */
                <div className="text-center py-4 mb-3">
                    <Sparkles className="w-6 h-6 mx-auto text-violet-400/50 mb-2" />
                    <div className="text-[10px] text-slate-500">
                        Connect to Script and generate storyboard
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-2">
                <div className="flex-1 px-2 py-1.5 rounded text-center bg-slate-800/80 text-slate-400">
                    <div className="text-[10px] font-semibold flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {totalDuration > 0 ? formatDuration(totalDuration) : '--'}
                    </div>
                    <div className="text-[8px] opacity-70">Duration</div>
                </div>
                <div className="flex-1 px-2 py-1.5 rounded text-center bg-slate-800/80 text-slate-400">
                    <div className="text-[10px] font-semibold flex items-center justify-center gap-1">
                        <Layers className="w-3 h-3" />
                        {scenes.length}
                    </div>
                    <div className="text-[8px] opacity-70">Scenes</div>
                </div>
                <div className={`flex-1 px-2 py-1.5 rounded text-center ${completionPercent === 100 ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-800/80 text-slate-400'
                    }`}>
                    <div className="text-[10px] font-semibold">{completedScenes}/{scenes.length}</div>
                    <div className="text-[8px] opacity-70">Complete</div>
                </div>
            </div>

            {/* Shot Type Distribution */}
            {scenes.length > 0 && (
                <div className="flex items-center gap-1 justify-center mt-3">
                    {Object.entries(
                        scenes.reduce((acc, scene) => {
                            acc[scene.shotType] = (acc[scene.shotType] || 0) + 1;
                            return acc;
                        }, {} as Record<string, number>)
                    ).map(([type, count]) => (
                        <div
                            key={type}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px]"
                            style={{
                                backgroundColor: `${SHOT_COLORS[type]}15`,
                                color: SHOT_COLORS[type]
                            }}
                        >
                            <span className="font-bold">{count}</span>
                            <span className="opacity-70">{type.split('-')[0]}</span>
                        </div>
                    ))}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-violet-500" />
        </div>
    );
}
