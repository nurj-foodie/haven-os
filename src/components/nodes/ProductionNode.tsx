'use client';
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Factory, CheckSquare, Square, TrendingUp, Play } from 'lucide-react';

export default function ProductionNode({ data }: NodeProps) {
    const metadata = typeof data.metadata === 'object' && data.metadata !== null
        ? data.metadata as Record<string, any>
        : {};
    const productionData = metadata.productionData || {};
    const phases = productionData.phases || [];
    const projectType = productionData.projectType || 'generic';

    // Calculate progress
    const allTasks = phases.flatMap((p: any) => p.tasks || []);
    const completedTasks = allTasks.filter((t: any) => t.completed).length;
    const totalTasks = allTasks.length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'app': return '📱';
            case 'merch': return '👕';
            case 'poster': return '🖼️';
            default: return '🏭';
        }
    };

    const getProgressColor = (percent: number) => {
        if (percent >= 80) return 'from-green-500 to-emerald-500';
        if (percent >= 50) return 'from-yellow-500 to-amber-500';
        return 'from-blue-500 to-purple-500';
    };

    return (
        <div className="bg-gradient-to-br from-orange-900/30 to-amber-900/30 border-2 border-orange-500/30 rounded-xl p-4 min-w-[300px] shadow-2xl backdrop-blur-sm">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-orange-500" />

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-lg">
                    {getTypeIcon(projectType)}
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-slate-200">{String(data.label || 'Untitled Project')}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {projectType === 'app' ? 'App Development' :
                            projectType === 'merch' ? 'Merchandise' :
                                projectType === 'poster' ? 'Poster Design' : 'Production'}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-orange-400 font-bold">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-gradient-to-r ${getProgressColor(progressPercent)} transition-all duration-500`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 px-2 py-1.5 rounded text-center bg-slate-800 text-slate-400">
                    <div className="text-[10px] font-semibold">{phases.length}</div>
                    <div className="text-[8px] opacity-70">Phases</div>
                </div>
                <div className="flex-1 px-2 py-1.5 rounded text-center bg-slate-800 text-slate-400">
                    <div className="text-[10px] font-semibold">{completedTasks}/{totalTasks}</div>
                    <div className="text-[8px] opacity-70">Tasks</div>
                </div>
            </div>

            {/* Phases Preview */}
            {phases.length > 0 && (
                <div className="space-y-1 mb-3">
                    {phases.slice(0, 3).map((phase: any, idx: number) => {
                        const phaseTasks = phase.tasks || [];
                        const phaseCompleted = phaseTasks.filter((t: any) => t.completed).length;
                        const phaseTotal = phaseTasks.length;
                        return (
                            <div key={idx} className="text-[10px] text-slate-400 flex items-center justify-between gap-2 p-1.5 rounded bg-slate-900/50">
                                <div className="flex items-center gap-2 truncate">
                                    <span className="text-orange-500 font-mono">{idx + 1}.</span>
                                    <span className="truncate">{phase.name}</span>
                                </div>
                                <span className={`text-[9px] ${phaseCompleted === phaseTotal && phaseTotal > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                                    {phaseCompleted}/{phaseTotal}
                                </span>
                            </div>
                        );
                    })}
                    {phases.length > 3 && (
                        <div className="text-[9px] text-slate-600 text-center">+{phases.length - 3} more phases</div>
                    )}
                </div>
            )}

            {/* Action Button */}
            <button className="w-full px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded text-[10px] font-semibold transition-colors flex items-center justify-center gap-1">
                <Play className="w-3 h-3" />
                View Tasks
            </button>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-500" />
        </div>
    );
}
