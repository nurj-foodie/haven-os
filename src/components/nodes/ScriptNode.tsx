'use client';
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
    Clapperboard, Clock, Layers, MessageSquare, Zap,
    PlayCircle, Camera, Type, Sparkles
} from 'lucide-react';

// Format configurations
const FORMAT_CONFIG: Record<string, { label: string; color: string; duration: string }> = {
    'tiktok': { label: 'TikTok', color: '#00f2ea', duration: '15-60s' },
    'reel': { label: 'Reel', color: '#E1306C', duration: '30-90s' },
    'youtube-short': { label: 'YT Short', color: '#FF0000', duration: '30-60s' },
    'youtube-long': { label: 'YouTube', color: '#FF0000', duration: '8-15m' },
    'custom': { label: 'Custom', color: '#6366f1', duration: 'Flexible' },
};

// Shot type icons
const SHOT_ICONS: Record<string, React.ReactNode> = {
    'a-roll': <Camera className="w-3 h-3" />,
    'b-roll': <PlayCircle className="w-3 h-3" />,
    'text-overlay': <Type className="w-3 h-3" />,
    'transition': <Zap className="w-3 h-3" />,
};

interface ContentBlock {
    id: string;
    type: 'talking-point' | 'story' | 'example' | 'transition';
    content: string;
    duration: number;
}

interface Scene {
    id: string;
    shotType: 'a-roll' | 'b-roll' | 'text-overlay' | 'transition';
    description: string;
    duration: number;
}

interface ScriptNodeData {
    label?: string;
    format?: 'tiktok' | 'reel' | 'youtube-short' | 'youtube-long' | 'custom';
    hookType?: 'question' | 'statement' | 'story' | 'shock';
    hook?: string;
    contentBlocks?: ContentBlock[];
    cta?: string;
    scenes?: Scene[];
    estimatedDuration?: number;
    voiceStyle?: 'casual' | 'professional' | 'energetic' | 'custom';
    customVoice?: string;
    sourceNodeIds?: string[];
    metadata?: any;
}

export default function ScriptNode({ data }: NodeProps) {
    const scriptData = data as ScriptNodeData;
    const format = scriptData.format || 'tiktok';
    const formatConfig = FORMAT_CONFIG[format] || FORMAT_CONFIG['custom'];
    const scenes = scriptData.scenes || [];
    const contentBlocks = scriptData.contentBlocks || [];
    const estimatedDuration = scriptData.estimatedDuration || 0;
    const sourceCount = scriptData.sourceNodeIds?.length || 0;

    // Calculate section completion
    const hasHook = !!scriptData.hook;
    const hasContent = contentBlocks.length > 0;
    const hasCTA = !!scriptData.cta;
    const completedSections = [hasHook, hasContent, hasCTA].filter(Boolean).length;

    // Format duration for display
    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    };

    return (
        <div className="bg-gradient-to-br from-rose-900/30 to-orange-900/30 border-2 border-rose-500/30 rounded-xl p-4 min-w-[280px] shadow-2xl backdrop-blur-sm">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-rose-500" />

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                    <Clapperboard className="w-5 h-5 text-rose-400" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-slate-200">
                        {scriptData.label || 'Untitled Script'}
                    </div>
                    <div
                        className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block mt-1"
                        style={{
                            backgroundColor: `${formatConfig.color}20`,
                            color: formatConfig.color,
                            border: `1px solid ${formatConfig.color}40`
                        }}
                    >
                        {formatConfig.label}
                    </div>
                </div>
                {sourceCount > 0 && (
                    <div className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-[9px] text-blue-400 font-bold">
                        {sourceCount} src
                    </div>
                )}
            </div>

            {/* Script Structure Indicator */}
            <div className="flex items-center gap-1 mb-3">
                <div className={`flex-1 h-1.5 rounded-full transition-all ${hasHook ? 'bg-amber-500' : 'bg-slate-700'
                    }`} title="Hook" />
                <div className={`flex-2 h-1.5 rounded-full transition-all ${hasContent ? 'bg-rose-500' : 'bg-slate-700'
                    }`} style={{ flex: 2 }} title="Content" />
                <div className={`flex-1 h-1.5 rounded-full transition-all ${hasCTA ? 'bg-emerald-500' : 'bg-slate-700'
                    }`} title="CTA" />
            </div>

            {/* Section Labels */}
            <div className="flex items-center justify-between text-[8px] uppercase tracking-wider mb-3">
                <span className={hasHook ? 'text-amber-400' : 'text-slate-600'}>Hook</span>
                <span className={hasContent ? 'text-rose-400' : 'text-slate-600'}>Content</span>
                <span className={hasCTA ? 'text-emerald-400' : 'text-slate-600'}>CTA</span>
            </div>

            {/* Hook Preview */}
            {scriptData.hook && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mb-3">
                    <div className="flex items-center gap-1 text-[9px] text-amber-400 font-bold uppercase mb-1">
                        <Zap className="w-3 h-3" />
                        {scriptData.hookType || 'Hook'}
                    </div>
                    <div className="text-[10px] text-slate-300 line-clamp-2">
                        "{scriptData.hook}"
                    </div>
                </div>
            )}

            {/* Voice Style Badge */}
            {scriptData.voiceStyle && (
                <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-3 h-3 text-slate-500" />
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                        {scriptData.voiceStyle === 'custom' ? scriptData.customVoice : scriptData.voiceStyle}
                    </span>
                </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 px-2 py-1.5 rounded text-center bg-slate-800/80 text-slate-400">
                    <div className="text-[10px] font-semibold flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {estimatedDuration > 0 ? formatDuration(estimatedDuration) : formatConfig.duration}
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
                <div className={`flex-1 px-2 py-1.5 rounded text-center ${completedSections === 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800/80 text-slate-400'
                    }`}>
                    <div className="text-[10px] font-semibold">{completedSections}/3</div>
                    <div className="text-[8px] opacity-70">Sections</div>
                </div>
            </div>

            {/* Scene Types Summary */}
            {scenes.length > 0 && (
                <div className="flex items-center gap-1 justify-center">
                    {Object.entries(
                        scenes.reduce((acc, scene) => {
                            acc[scene.shotType] = (acc[scene.shotType] || 0) + 1;
                            return acc;
                        }, {} as Record<string, number>)
                    ).map(([type, count]) => (
                        <div
                            key={type}
                            className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 rounded text-[9px] text-slate-400"
                            title={type}
                        >
                            {SHOT_ICONS[type]}
                            <span>{count}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!hasHook && !hasContent && !hasCTA && (
                <div className="text-center py-2">
                    <Sparkles className="w-5 h-5 mx-auto text-rose-400/50 mb-1" />
                    <div className="text-[10px] text-slate-500">
                        Use Story Builder to generate script
                    </div>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-rose-500" />
        </div>
    );
}
