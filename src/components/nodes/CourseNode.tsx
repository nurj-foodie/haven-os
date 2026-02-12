'use client';
import React from 'react';
import { useReactFlow, Handle, Position, NodeProps } from '@xyflow/react';
import { BookOpen, Plus, Play, TrendingUp } from 'lucide-react';

export default function CourseNode({ id, data }: NodeProps) {
    const { setNodes } = useReactFlow();
    const metadata = typeof data.metadata === 'object' && data.metadata !== null
        ? data.metadata as Record<string, any>
        : {};
    const courseData = metadata.courseData || {};
    const children = courseData.modules?.flatMap((m: any) => m.nodeIds || []) || [];
    const masteryLevel = metadata.masteryLevel || 0;
    const lastStudied = metadata.lastStudied;

    const getMasteryColor = (level: number) => {
        if (level >= 80) return 'text-green-400 bg-green-500/10';
        if (level >= 50) return 'text-yellow-400 bg-yellow-500/10';
        return 'text-slate-500 bg-slate-800';
    };

    const daysSinceStudy = lastStudied
        ? Math.floor((Date.now() - new Date(lastStudied).getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-2 border-purple-500/30 rounded-xl p-4 min-w-[280px] shadow-2xl backdrop-blur-sm">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-slate-200">{String(data.label || 'Untitled Course')}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Learning Module</div>
                </div>
            </div>

            {/* Course Details */}
            {courseData.description && (
                <div className="text-xs text-slate-400 mb-3 line-clamp-2">
                    {courseData.description}
                </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-2 mb-3">
                <div className={`flex-1 px-2 py-1.5 rounded text-center ${getMasteryColor(masteryLevel)}`}>
                    <div className="text-[10px] font-semibold">{masteryLevel}%</div>
                    <div className="text-[8px] opacity-70">Mastery</div>
                </div>
                <div className="flex-1 px-2 py-1.5 rounded text-center bg-slate-800 text-slate-400">
                    <div className="text-[10px] font-semibold">{courseData.modules?.length || 0}</div>
                    <div className="text-[8px] opacity-70">Modules</div>
                </div>
                <div className="flex-1 px-2 py-1.5 rounded text-center bg-slate-800 text-slate-400">
                    <div className="text-[10px] font-semibold">{children.length}</div>
                    <div className="text-[8px] opacity-70">Items</div>
                </div>
            </div>

            {/* Modules Preview */}
            {courseData.modules && courseData.modules.length > 0 && (
                <div className="space-y-1 mb-3">
                    {courseData.modules.slice(0, 3).map((module: any, idx: number) => (
                        <div key={idx} className="text-[10px] text-slate-400 flex items-center gap-2 p-1.5 rounded bg-slate-900/50">
                            <span className="text-purple-500 font-mono">{module.moduleNumber}.</span>
                            <span className="truncate">{module.title}</span>
                        </div>
                    ))}
                    {courseData.modules.length > 3 && (
                        <div className="text-[9px] text-slate-600 text-center">+{courseData.modules.length - 3} more</div>
                    )}
                </div>
            )}

            {/* Last Studied */}
            {daysSinceStudy !== null && (
                <div className="text-[9px] text-slate-600 mb-2">
                    Last studied {daysSinceStudy === 0 ? 'today' : `${daysSinceStudy}d ago`}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // Update metadata to trigger Study Mode in Inspector
                        setNodes((nds) => nds.map((n) => {
                            if (n.id === id) {
                                return {
                                    ...n,
                                    data: {
                                        ...n.data,
                                        metadata: {
                                            ...(typeof n.data.metadata === 'object' ? n.data.metadata : {}),
                                            activeTab: 'study'
                                        }
                                    }
                                };
                            }
                            return n;
                        }));
                    }}
                    className="flex-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded text-[10px] font-semibold transition-colors flex items-center justify-center gap-1 border border-emerald-500/20"
                    title="Start Deep Dive Study Session"
                >
                    <BookOpen className="w-3 h-3" />
                    Deep Dive
                </button>
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
        </div>
    );
}
