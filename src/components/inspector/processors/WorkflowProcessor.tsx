'use client';
import React, { useState, useMemo } from 'react';
import { Node, useReactFlow, useEdges, useNodes } from '@xyflow/react';
import {
    Workflow, Plus, Save, Trash2, ChevronRight, CheckCircle2,
    Lightbulb, Hammer, Rocket, Play, RotateCcw, Sparkles,
    Link2, FileText, BookOpen, HelpCircle, Image, Video, Mic, ExternalLink
} from 'lucide-react';

interface ProcessorProps {
    node: Node | null;
}

// Pre-built templates
const DEFAULT_TEMPLATES = [
    {
        id: 'app-development',
        name: 'App Development',
        description: 'From idea to launch',
        stages: [
            { id: 'ideation', name: 'Ideation', icon: 'lightbulb', color: '#eab308' },
            { id: 'design', name: 'Design', icon: 'default', color: '#a855f7' },
            { id: 'build', name: 'Build', icon: 'hammer', color: '#3b82f6' },
            { id: 'test', name: 'Test', icon: 'default', color: '#f97316' },
            { id: 'launch', name: 'Launch', icon: 'rocket', color: '#22c55e' },
        ]
    },
    {
        id: 'digital-course',
        name: 'Digital Course',
        description: 'Create and sell online courses',
        stages: [
            { id: 'outline', name: 'Outline', icon: 'lightbulb', color: '#eab308' },
            { id: 'record', name: 'Record', icon: 'default', color: '#ef4444' },
            { id: 'edit', name: 'Edit', icon: 'hammer', color: '#3b82f6' },
            { id: 'publish', name: 'Publish', icon: 'rocket', color: '#22c55e' },
            { id: 'market', name: 'Market', icon: 'default', color: '#ec4899' },
        ]
    },
    {
        id: 'content-launch',
        name: 'Content Launch',
        description: 'Plan and execute content campaigns',
        stages: [
            { id: 'draft', name: 'Draft', icon: 'lightbulb', color: '#eab308' },
            { id: 'review', name: 'Review', icon: 'default', color: '#a855f7' },
            { id: 'schedule', name: 'Schedule', icon: 'default', color: '#3b82f6' },
            { id: 'publish', name: 'Publish', icon: 'rocket', color: '#22c55e' },
            { id: 'promote', name: 'Promote', icon: 'default', color: '#ec4899' },
        ]
    },
];

// Node type icons
const getNodeIcon = (type: string) => {
    switch (type) {
        case 'noteNode': return <FileText className="w-3 h-3 text-blue-400" />;
        case 'courseNode': return <BookOpen className="w-3 h-3 text-purple-400" />;
        case 'quizNode': return <HelpCircle className="w-3 h-3 text-blue-400" />;
        case 'imageNode': return <Image className="w-3 h-3 text-pink-400" />;
        case 'videoNode': return <Video className="w-3 h-3 text-red-400" />;
        case 'audioNode': return <Mic className="w-3 h-3 text-orange-400" />;
        case 'linkNode': return <ExternalLink className="w-3 h-3 text-cyan-400" />;
        default: return <FileText className="w-3 h-3 text-slate-400" />;
    }
};

export default function WorkflowProcessor({ node }: ProcessorProps) {
    const { setNodes } = useReactFlow();
    const edges = useEdges();
    const allNodes = useNodes();
    const [activeTab, setActiveTab] = useState<'manage' | 'templates' | 'sources'>('manage');

    if (!node) return null;

    // Find all incoming connections (source materials)
    const incomingEdges = edges.filter(e => e.target === node.id);
    const sourceNodes = useMemo(() => {
        return incomingEdges
            .map(edge => allNodes.find(n => n.id === edge.source))
            .filter((n): n is Node => n !== undefined);
    }, [incomingEdges, allNodes]);

    const stages = (node.data.stages as any[]) || [];
    const currentStage = node.data.currentStage as string || stages[0]?.id;
    const completedStages = (node.data.completedStages as string[]) || [];
    const sourceNodeIds = (node.data.sourceNodeIds as string[]) || sourceNodes.map(n => n.id);

    const updateNodeData = (updates: Record<string, any>) => {
        setNodes((nds) =>
            nds.map((n) =>
                n.id === node.id
                    ? { ...n, data: { ...n.data, ...updates } }
                    : n
            )
        );
    };

    // Auto-sync source nodes when edges change
    React.useEffect(() => {
        if (sourceNodes.length > 0) {
            const newSourceIds = sourceNodes.map(n => n.id);
            const existingIds = (node.data.sourceNodeIds as string[]) || [];

            // Only update if changed
            if (JSON.stringify(newSourceIds) !== JSON.stringify(existingIds)) {
                updateNodeData({ sourceNodeIds: newSourceIds });
            }
        }
    }, [sourceNodes.length]);

    const handleCompleteStage = (stageId: string) => {
        const newCompleted = [...completedStages];
        if (!newCompleted.includes(stageId)) {
            newCompleted.push(stageId);
        }

        // Auto-advance to next stage
        const currentIndex = stages.findIndex(s => s.id === stageId);
        const nextStage = stages[currentIndex + 1]?.id;

        updateNodeData({
            completedStages: newCompleted,
            currentStage: nextStage || stageId
        });
    };

    const handleUncompleteStage = (stageId: string) => {
        updateNodeData({
            completedStages: completedStages.filter(id => id !== stageId),
            currentStage: stageId
        });
    };

    const handleApplyTemplate = (template: typeof DEFAULT_TEMPLATES[0]) => {
        // Build context description from source nodes
        const contextDescription = sourceNodes.length > 0
            ? `Based on: ${sourceNodes.map(n => n.data.label || n.type).join(', ')}`
            : template.description;

        updateNodeData({
            templateName: template.name,
            description: contextDescription,
            stages: template.stages,
            currentStage: template.stages[0]?.id,
            completedStages: [],
            sourceNodeIds: sourceNodes.map(n => n.id)
        });
        setActiveTab('manage');
    };

    const handleResetProgress = () => {
        updateNodeData({
            currentStage: stages[0]?.id,
            completedStages: []
        });
    };

    const progress = stages.length > 0
        ? Math.round((completedStages.length / stages.length) * 100)
        : 0;

    // Suggest template based on connected content
    const suggestedTemplate = useMemo(() => {
        if (sourceNodes.length === 0) return null;

        const allContent = sourceNodes
            .map(n => `${n.data.label || ''} ${n.data.content || ''}`.toLowerCase())
            .join(' ');

        if (allContent.includes('app') || allContent.includes('software') || allContent.includes('code')) {
            return 'app-development';
        }
        if (allContent.includes('course') || allContent.includes('teach') || allContent.includes('learn')) {
            return 'digital-course';
        }
        if (allContent.includes('content') || allContent.includes('article') || allContent.includes('post')) {
            return 'content-launch';
        }
        return null;
    }, [sourceNodes]);

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <Workflow className="w-3 h-3 text-emerald-400" />
                Workflow Manager
            </div>

            {/* Source Materials Banner (if connected) */}
            {sourceNodes.length > 0 && (
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-2">
                        <Link2 className="w-3 h-3" />
                        Source Materials ({sourceNodes.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {sourceNodes.slice(0, 5).map((srcNode) => (
                            <div
                                key={srcNode.id}
                                className="flex items-center gap-1.5 px-2 py-1 bg-slate-900/80 rounded text-[10px] text-slate-300"
                            >
                                {getNodeIcon(srcNode.type || 'noteNode')}
                                <span className="truncate max-w-[100px]">
                                    {(srcNode.data.label as string) || srcNode.type}
                                </span>
                            </div>
                        ))}
                        {sourceNodes.length > 5 && (
                            <div className="px-2 py-1 text-[10px] text-slate-500">
                                +{sourceNodes.length - 5} more
                            </div>
                        )}
                    </div>
                    {suggestedTemplate && stages.length === 0 && (
                        <div className="mt-2 text-[10px] text-amber-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Suggested: {DEFAULT_TEMPLATES.find(t => t.id === suggestedTemplate)?.name}
                        </div>
                    )}
                </div>
            )}

            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                    onClick={() => setActiveTab('manage')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'manage'
                        ? 'bg-slate-700 text-slate-200'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Manage
                </button>
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'templates'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Templates
                </button>
                {sourceNodes.length > 0 && (
                    <button
                        onClick={() => setActiveTab('sources')}
                        className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'sources'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                            }`}
                    >
                        Sources
                    </button>
                )}
            </div>

            {activeTab === 'manage' && (
                <>
                    {/* Progress Overview */}
                    <div className="bg-slate-900 rounded-lg p-3 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400">Progress</span>
                            <span className={`text-sm font-bold ${progress === 100 ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                {progress}%
                            </span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="text-[10px] text-slate-600 mt-2 text-center">
                            {completedStages.length} of {stages.length} stages complete
                        </div>
                    </div>

                    {/* Stages List */}
                    {stages.length > 0 ? (
                        <div className="space-y-2">
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                Stages
                            </div>
                            {stages.map((stage: any, idx: number) => {
                                const isCompleted = completedStages.includes(stage.id);
                                const isCurrent = currentStage === stage.id;

                                return (
                                    <div
                                        key={stage.id}
                                        className={`p-3 rounded-lg border transition-all ${isCompleted
                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                            : isCurrent
                                                ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/30'
                                                : 'bg-slate-900 border-slate-800'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted
                                                ? 'bg-emerald-500 text-white'
                                                : isCurrent
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-slate-700 text-slate-400'
                                                }`}>
                                                {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className={`text-sm font-bold ${isCompleted ? 'text-emerald-400' :
                                                    isCurrent ? 'text-amber-400' : 'text-slate-400'
                                                    }`}>
                                                    {stage.name}
                                                </div>
                                            </div>
                                            {isCurrent && !isCompleted && (
                                                <button
                                                    onClick={() => handleCompleteStage(stage.id)}
                                                    className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase rounded transition-colors"
                                                >
                                                    Complete
                                                </button>
                                            )}
                                            {isCompleted && (
                                                <button
                                                    onClick={() => handleUncompleteStage(stage.id)}
                                                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                                                    title="Undo completion"
                                                >
                                                    <RotateCcw className="w-3 h-3 text-slate-500" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-500">
                            <Workflow className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <div className="text-xs">No stages defined</div>
                            <div className="text-[10px] text-slate-600 mt-1">
                                {sourceNodes.length > 0
                                    ? 'Choose a template to start building from your sources'
                                    : 'Connect notes to this workflow, then choose a template'}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    {stages.length > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleResetProgress}
                                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold uppercase rounded border border-slate-700 transition-colors flex items-center justify-center gap-1"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Reset
                            </button>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'templates' && (
                <div className="space-y-3">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Product Templates
                    </div>

                    {DEFAULT_TEMPLATES.map((template) => {
                        const isSuggested = template.id === suggestedTemplate;
                        return (
                            <button
                                key={template.id}
                                onClick={() => handleApplyTemplate(template)}
                                className={`w-full p-3 bg-slate-900 hover:bg-slate-800 border rounded-lg text-left transition-all group ${isSuggested
                                    ? 'border-amber-500/50 ring-1 ring-amber-500/20'
                                    : 'border-slate-800 hover:border-emerald-500/30'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSuggested
                                        ? 'bg-amber-500/20 border border-amber-500/40'
                                        : 'bg-emerald-500/20 border border-emerald-500/40 group-hover:bg-emerald-500/30'
                                        }`}>
                                        <Workflow className={`w-4 h-4 ${isSuggested ? 'text-amber-400' : 'text-emerald-400'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                            {template.name}
                                            {isSuggested && (
                                                <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded uppercase">
                                                    Suggested
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-500">{template.description}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-[9px] text-slate-600">
                                    {template.stages.map((stage, idx) => (
                                        <React.Fragment key={stage.id}>
                                            <span className="px-1.5 py-0.5 bg-slate-800 rounded">{stage.name}</span>
                                            {idx < template.stages.length - 1 && <ChevronRight className="w-2 h-2" />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {activeTab === 'sources' && (
                <div className="space-y-3">
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-blue-400" />
                        Connected Source Materials
                    </div>

                    <div className="text-[10px] text-slate-500 bg-slate-900/50 rounded p-2 border border-slate-800">
                        These nodes are connected TO this workflow and provide context for Haven Intelligence.
                    </div>

                    {sourceNodes.map((srcNode) => (
                        <div
                            key={srcNode.id}
                            className="p-3 bg-slate-900 border border-slate-800 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                    {getNodeIcon(srcNode.type || 'noteNode')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-slate-200 truncate">
                                        {(srcNode.data.label as string) || 'Untitled'}
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase">
                                        {srcNode.type?.replace('Node', '')}
                                    </div>
                                </div>
                            </div>
                            {typeof srcNode.data.content === 'string' && srcNode.data.content && (
                                <div className="mt-2 text-[10px] text-slate-400 line-clamp-2 pl-11">
                                    {srcNode.data.content.substring(0, 150)}...
                                </div>
                            )}
                        </div>
                    ))}

                    {sourceNodes.length === 0 && (
                        <div className="text-center py-6 text-slate-500">
                            <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <div className="text-xs">No sources connected</div>
                            <div className="text-[10px] text-slate-600 mt-1">
                                Draw an edge from a Note/Course to this Workflow
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
