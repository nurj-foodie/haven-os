'use client';
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Workflow, Lightbulb, Hammer, Rocket, CheckCircle2, Circle, ChevronRight } from 'lucide-react';

// Default stage icons mapping
const stageIcons: Record<string, React.ReactNode> = {
    lightbulb: <Lightbulb className="w-3 h-3" />,
    hammer: <Hammer className="w-3 h-3" />,
    rocket: <Rocket className="w-3 h-3" />,
    check: <CheckCircle2 className="w-3 h-3" />,
    default: <Circle className="w-3 h-3" />,
};

interface Stage {
    id: string;
    name: string;
    icon?: string;
    color?: string;
}

interface WorkflowNodeData {
    label?: string;
    templateName?: string;
    description?: string;
    stages?: Stage[];
    currentStage?: string;
    completedStages?: string[];
    assignedNodes?: Record<string, string[]>; // stageId -> nodeIds
    sourceNodeIds?: string[]; // Connected source materials
    metadata?: any;
}

export default function WorkflowNode({ data }: NodeProps) {
    const workflowData = data as WorkflowNodeData;
    const stages: Stage[] = workflowData.stages || [
        { id: 'ideation', name: 'Ideation', icon: 'lightbulb', color: '#eab308' },
        { id: 'production', name: 'Production', icon: 'hammer', color: '#3b82f6' },
        { id: 'launch', name: 'Launch', icon: 'rocket', color: '#22c55e' },
    ];

    const currentStage = workflowData.currentStage || stages[0]?.id;
    const completedStages = workflowData.completedStages || [];
    const assignedNodes = workflowData.assignedNodes || {};
    const sourceCount = workflowData.sourceNodeIds?.length || 0;

    const getStageStatus = (stageId: string) => {
        if (completedStages.includes(stageId)) return 'completed';
        if (currentStage === stageId) return 'active';
        return 'pending';
    };

    const totalAssigned = Object.values(assignedNodes).flat().length;
    const completedCount = completedStages.length;
    const progress = stages.length > 0 ? Math.round((completedCount / stages.length) * 100) : 0;

    return (
        <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-2 border-emerald-500/30 rounded-xl p-4 min-w-[300px] shadow-2xl backdrop-blur-sm">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-emerald-500" />

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <Workflow className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-slate-200">{workflowData.label || 'Untitled Workflow'}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {workflowData.templateName || 'Custom Workflow'}
                    </div>
                </div>
                {sourceCount > 0 && (
                    <div className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-[9px] text-blue-400 font-bold">
                        {sourceCount} source{sourceCount > 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Description */}
            {workflowData.description && (
                <div className="text-xs text-slate-400 mb-3 line-clamp-2">
                    {workflowData.description}
                </div>
            )}

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span>Progress</span>
                    <span className="text-emerald-400 font-bold">{progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Stages Pipeline */}
            <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
                {stages.map((stage, idx) => {
                    const status = getStageStatus(stage.id);
                    const nodeCount = assignedNodes[stage.id]?.length || 0;

                    return (
                        <React.Fragment key={stage.id}>
                            <div
                                className={`flex-shrink-0 flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all ${status === 'completed'
                                    ? 'bg-emerald-500/20 border border-emerald-500/40'
                                    : status === 'active'
                                        ? 'bg-amber-500/20 border border-amber-500/40 ring-2 ring-amber-500/30'
                                        : 'bg-slate-800/50 border border-slate-700/50'
                                    }`}
                                title={`${stage.name}: ${nodeCount} items`}
                            >
                                <div className={`${status === 'completed' ? 'text-emerald-400' :
                                    status === 'active' ? 'text-amber-400' : 'text-slate-500'
                                    }`}>
                                    {status === 'completed'
                                        ? <CheckCircle2 className="w-3 h-3" />
                                        : stageIcons[stage.icon || 'default']
                                    }
                                </div>
                                <div className={`text-[8px] font-bold uppercase tracking-wider ${status === 'completed' ? 'text-emerald-400' :
                                    status === 'active' ? 'text-amber-400' : 'text-slate-500'
                                    }`}>
                                    {stage.name.substring(0, 4)}
                                </div>
                                {nodeCount > 0 && (
                                    <div className="text-[8px] text-slate-500 bg-slate-900 px-1 rounded">
                                        {nodeCount}
                                    </div>
                                )}
                            </div>
                            {idx < stages.length - 1 && (
                                <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 px-2 py-1.5 rounded text-center bg-slate-800 text-slate-400">
                    <div className="text-[10px] font-semibold">{stages.length}</div>
                    <div className="text-[8px] opacity-70">Stages</div>
                </div>
                <div className={`flex-1 px-2 py-1.5 rounded text-center ${sourceCount > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                    <div className="text-[10px] font-semibold">{sourceCount}</div>
                    <div className="text-[8px] opacity-70">Sources</div>
                </div>
                <div className={`flex-1 px-2 py-1.5 rounded text-center ${progress === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                    <div className="text-[10px] font-semibold">{completedCount}/{stages.length}</div>
                    <div className="text-[8px] opacity-70">Done</div>
                </div>
            </div>

            {/* Current Stage Label */}
            {currentStage && (
                <div className="text-[9px] text-slate-600 text-center">
                    Current: <span className="text-amber-400 font-bold">
                        {stages.find(s => s.id === currentStage)?.name || currentStage}
                    </span>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500" />
        </div>
    );
}
