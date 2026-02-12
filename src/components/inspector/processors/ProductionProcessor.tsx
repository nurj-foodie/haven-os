'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { ProcessorProps } from './types';
import { Factory, CheckSquare, Square, Sparkles, Plus, Save } from 'lucide-react';

interface Task {
    id: string;
    name: string;
    completed: boolean;
}

interface Phase {
    name: string;
    tasks: Task[];
}

const PROJECT_TEMPLATES = [
    { id: 'app', name: 'App Development', icon: '📱' },
    { id: 'merch', name: 'Merchandise', icon: '👕' },
    { id: 'poster', name: 'Poster Design', icon: '🖼️' },
    { id: 'logo', name: 'Logo Redesign', icon: '🎨' },
    { id: 'generic', name: 'Custom Project', icon: '🏭' }
];

export default function ProductionProcessor({ node }: ProcessorProps) {
    const { setNodes } = useReactFlow();
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('generic');
    const [projectPrompt, setProjectPrompt] = useState('');

    if (!node || node.type !== 'productionNode') return null;

    const metadata = node.data?.metadata as Record<string, any> | undefined;
    const productionData = metadata?.productionData || {};
    const phases: Phase[] = productionData.phases || [];
    const projectType = productionData.projectType || 'generic';

    // Calculate progress
    const allTasks = phases.flatMap(p => p.tasks || []);
    const completedTasks = allTasks.filter(t => t.completed).length;
    const totalTasks = allTasks.length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const handleGeneratePlan = async () => {
        if (!projectPrompt.trim()) return;

        setIsGenerating(true);
        try {
            const response = await fetch('/api/agents/production', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectName: node.data.label || 'Untitled Project',
                    projectType: selectedTemplate,
                    description: projectPrompt
                })
            });

            const result = await response.json();

            if (result.success) {
                const generatedData = result.result;

                setNodes((nds) =>
                    nds.map((n) => {
                        if (n.id !== node.id) return n;
                        return {
                            ...n,
                            data: {
                                ...n.data,
                                label: generatedData.projectTitle || n.data.label,
                                metadata: {
                                    ...metadata,
                                    productionData: {
                                        ...generatedData,
                                        projectType: selectedTemplate
                                    }
                                }
                            }
                        };
                    })
                );
            }
        } catch (error) {
            console.error('[ProductionProcessor] Error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleTaskCompletion = (phaseIndex: number, taskId: string) => {
        const updatedPhases = [...phases];
        const task = updatedPhases[phaseIndex]?.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;

            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id !== node.id) return n;
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            metadata: {
                                ...metadata,
                                productionData: {
                                    ...productionData,
                                    phases: updatedPhases
                                }
                            }
                        }
                    };
                })
            );
        }
    };

    // No plan yet - show generator
    if (phases.length === 0) {
        return (
            <div className="animate-in fade-in duration-500 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
                        <Factory className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-200">{String(node.data.label || 'New Project')}</div>
                        <div className="text-xs text-slate-500">Production Manager</div>
                    </div>
                </div>

                {/* Template Selection */}
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">Project Type</label>
                    <div className="grid grid-cols-2 gap-2">
                        {PROJECT_TEMPLATES.map(template => (
                            <button
                                key={template.id}
                                onClick={() => setSelectedTemplate(template.id)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${selectedTemplate === template.id
                                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 border'
                                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                <span>{template.icon}</span>
                                <span>{template.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Project Description */}
                <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">What do you want to build?</label>
                    <textarea
                        value={projectPrompt}
                        onChange={(e) => setProjectPrompt(e.target.value)}
                        placeholder="Describe your project... (e.g., A mobile app for tracking daily habits with gamification)"
                        rows={4}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 resize-none"
                    />
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGeneratePlan}
                    disabled={isGenerating || !projectPrompt.trim()}
                    className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        <>
                            <Sparkles className="w-4 h-4 animate-spin" />
                            Generating Plan...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Generate Production Plan
                        </>
                    )}
                </button>
            </div>
        );
    }

    // Has plan - show task list
    return (
        <div className="animate-in fade-in duration-500 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-xl">
                    {PROJECT_TEMPLATES.find(t => t.id === projectType)?.icon || '🏭'}
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-slate-200">{String(node.data.label || 'Project')}</div>
                    <div className="text-xs text-slate-500">{PROJECT_TEMPLATES.find(t => t.id === projectType)?.name}</div>
                </div>
            </div>

            {/* Progress */}
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Progress</span>
                    <span className="text-sm font-bold text-orange-400">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="mt-2 text-[10px] text-slate-600">
                    {completedTasks} of {totalTasks} tasks completed
                </div>
            </div>

            {/* Phases and Tasks */}
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {phases.map((phase, phaseIdx) => (
                    <div key={phaseIdx} className="bg-slate-900/50 rounded-lg border border-slate-800 overflow-hidden">
                        <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-700">
                            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                <span className="text-orange-500">Phase {phaseIdx + 1}:</span>
                                {phase.name}
                            </div>
                        </div>
                        <div className="p-2 space-y-1">
                            {phase.tasks.map((task) => (
                                <button
                                    key={task.id}
                                    onClick={() => toggleTaskCompletion(phaseIdx, task.id)}
                                    className={`w-full flex items-center gap-2 p-2 rounded text-left text-xs transition-colors ${task.completed
                                        ? 'bg-green-900/20 text-green-400'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                                        }`}
                                >
                                    {task.completed ? (
                                        <CheckSquare className="w-4 h-4 text-green-400 flex-shrink-0" />
                                    ) : (
                                        <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                    )}
                                    <span className={task.completed ? 'line-through opacity-70' : ''}>{task.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Regenerate Button */}
            <button
                onClick={() => {
                    setNodes((nds) =>
                        nds.map((n) => {
                            if (n.id !== node.id) return n;
                            return {
                                ...n,
                                data: {
                                    ...n.data,
                                    metadata: {
                                        ...metadata,
                                        productionData: {}
                                    }
                                }
                            };
                        })
                    );
                }}
                className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs transition-colors"
            >
                Regenerate Plan
            </button>
        </div>
    );
}
