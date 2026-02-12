'use client';
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Target, Megaphone, Zap, Sparkles, BookOpen, Trophy, Clock, HelpCircle } from 'lucide-react';

// Marketing angle types with their visual configs
const ANGLE_TYPES = {
    'pain-point': { icon: <Zap className="w-3 h-3" />, label: 'Pain Point', color: '#ef4444' },
    'benefit': { icon: <Sparkles className="w-3 h-3" />, label: 'Benefit', color: '#22c55e' },
    'story': { icon: <BookOpen className="w-3 h-3" />, label: 'Story', color: '#8b5cf6' },
    'authority': { icon: <Trophy className="w-3 h-3" />, label: 'Authority', color: '#f59e0b' },
    'urgency': { icon: <Clock className="w-3 h-3" />, label: 'Urgency', color: '#ec4899' },
    'curiosity': { icon: <HelpCircle className="w-3 h-3" />, label: 'Curiosity', color: '#06b6d4' },
};

// Platform badges
const PLATFORMS = {
    linkedin: { label: 'LI', color: '#0077b5' },
    twitter: { label: 'X', color: '#1da1f2' },
    instagram: { label: 'IG', color: '#e4405f' },
    email: { label: '📧', color: '#6366f1' },
    ads: { label: 'Ad', color: '#f97316' },
};

export interface CopyVariation {
    id: string;
    label: string;
    copy: string;
}

export interface MarketingAngle {
    id: string;
    type: 'pain-point' | 'benefit' | 'story' | 'authority' | 'urgency' | 'curiosity';
    title: string;
    hook: string;
    platforms: ('linkedin' | 'twitter' | 'instagram' | 'email' | 'ads')[];
    variations: CopyVariation[];
}

export interface AngleNodeData {
    label?: string;
    product?: string;
    targetAudience?: string;
    angles?: MarketingAngle[];
}

export default function AngleNode({ data }: NodeProps) {
    const angleData = data as AngleNodeData;
    const angles = angleData.angles || [];
    const totalVariations = angles.reduce((sum, a) => sum + (a.variations?.length || 0), 0);

    // Get unique angle types for summary
    const angleTypeCounts = angles.reduce((acc, angle) => {
        acc[angle.type] = (acc[angle.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-2 border-amber-500/30 rounded-xl p-4 min-w-[280px] shadow-2xl backdrop-blur-sm">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500" />

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Target className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-slate-200">
                        {angleData.label || 'Marketing Angles'}
                    </div>
                    {angleData.product && (
                        <div className="text-[10px] text-amber-400/70 mt-0.5 truncate max-w-[180px]">
                            {angleData.product}
                        </div>
                    )}
                    {angleData.targetAudience && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                            🎯 {angleData.targetAudience}
                        </div>
                    )}
                </div>
            </div>

            {/* Angles Preview Grid */}
            {angles.length > 0 ? (
                <div className="space-y-2 mb-3">
                    {angles.slice(0, 4).map((angle) => {
                        const typeConfig = ANGLE_TYPES[angle.type] || ANGLE_TYPES['benefit'];
                        return (
                            <div
                                key={angle.id}
                                className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <div
                                        className="w-5 h-5 rounded flex items-center justify-center"
                                        style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
                                    >
                                        {typeConfig.icon}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-300 flex-1 truncate">
                                        {angle.title}
                                    </span>
                                    {angle.variations?.length > 1 && (
                                        <span className="text-[8px] px-1.5 py-0.5 bg-slate-700 rounded text-slate-400">
                                            {angle.variations.length} vars
                                        </span>
                                    )}
                                </div>
                                {/* Platform badges */}
                                <div className="flex gap-1 mt-1">
                                    {angle.platforms?.slice(0, 4).map((platform) => {
                                        const platformConfig = PLATFORMS[platform];
                                        return (
                                            <span
                                                key={platform}
                                                className="text-[8px] px-1 py-0.5 rounded font-bold"
                                                style={{
                                                    backgroundColor: `${platformConfig.color}20`,
                                                    color: platformConfig.color
                                                }}
                                            >
                                                {platformConfig.label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    {angles.length > 4 && (
                        <div className="text-[10px] text-slate-500 text-center">
                            +{angles.length - 4} more angles
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-4 rounded-lg bg-slate-900/30 border border-dashed border-slate-700 mb-3">
                    <div className="text-center">
                        <Megaphone className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                        <div className="text-[10px] text-slate-500">
                            No angles generated yet
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Stats */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-700/50">
                <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-amber-500" />
                    <span>{angles.length} angles</span>
                </div>
                {totalVariations > 0 && (
                    <div className="flex items-center gap-1">
                        <span>{totalVariations} variations</span>
                    </div>
                )}
            </div>

            {/* Angle Type Summary */}
            {Object.keys(angleTypeCounts).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(angleTypeCounts).map(([type, count]) => {
                        const typeConfig = ANGLE_TYPES[type as keyof typeof ANGLE_TYPES];
                        if (!typeConfig) return null;
                        return (
                            <span
                                key={type}
                                className="text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-1"
                                style={{
                                    backgroundColor: `${typeConfig.color}15`,
                                    color: typeConfig.color,
                                    border: `1px solid ${typeConfig.color}30`
                                }}
                            >
                                {typeConfig.icon}
                                {count}
                            </span>
                        );
                    })}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500" />
        </div>
    );
}
