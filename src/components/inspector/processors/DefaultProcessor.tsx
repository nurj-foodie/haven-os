'use client';
import React, { useState } from 'react';
import { Sparkles, BookOpen, HelpCircle, Ghost, PenTool, ChevronRight, Brain, Workflow, Clapperboard, Film, Target, Megaphone } from 'lucide-react';
import { ProcessorProps } from './types';
import GhostwriterProcessor from './GhostwriterProcessor';
import BrainstormProcessor from './BrainstormProcessor';

export default function DefaultProcessor({ node }: ProcessorProps) {
    const [showGhostwriter, setShowGhostwriter] = useState(false);
    const [showBrainstorm, setShowBrainstorm] = useState(false);

    if (node) return null;

    if (showBrainstorm) {
        return (
            <div className="animate-in fade-in duration-300">
                <button
                    onClick={() => setShowBrainstorm(false)}
                    className="mb-4 text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                >
                    ← Back to Tools
                </button>
                <BrainstormProcessor node={null} />
            </div>
        );
    }

    if (showGhostwriter) {
        return (
            <div className="animate-in fade-in duration-300">
                <button
                    onClick={() => setShowGhostwriter(false)}
                    className="mb-4 text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
                >
                    ← Back to Tools
                </button>
                <GhostwriterProcessor />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            {/* Processors Section */}
            <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Processors</div>
                <div
                    draggable
                    onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', JSON.stringify({
                            type: 'aiNode',
                            label: 'Gemini 2.0 Flash'
                        }));
                        event.dataTransfer.effectAllowed = 'move';
                    }}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-grab active:cursor-grabbing hover:border-yellow-500/50 hover:bg-slate-800 transition-all flex items-center gap-3"
                >
                    <div className="w-8 h-8 rounded-md bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-200">Gemini 2.0 Flash</div>
                        <div className="text-[10px] text-slate-500">Multimodal Vision Model</div>
                    </div>
                </div>
            </div>

            {/* Learning Section */}
            <div>
                <div className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <BookOpen className="w-3 h-3" />
                    Learning
                </div>

                {/* Course Node Creator */}
                <div
                    draggable
                    onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', JSON.stringify({
                            type: 'courseNode',
                            label: 'New Course'
                        }));
                        event.dataTransfer.effectAllowed = 'move';
                    }}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-grab active:cursor-grabbing hover:border-purple-500/50 hover:bg-slate-800 transition-all flex items-center gap-3 mb-2"
                >
                    <div className="w-8 h-8 rounded-md bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <BookOpen className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-200">Course Module</div>
                        <div className="text-[10px] text-slate-500">Learning path container</div>
                    </div>
                </div>

                {/* Quiz Node Creator */}
                <div
                    draggable
                    onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', JSON.stringify({
                            type: 'quizNode',
                            label: 'New Quiz'
                        }));
                        event.dataTransfer.effectAllowed = 'move';
                    }}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-grab active:cursor-grabbing hover:border-blue-500/50 hover:bg-slate-800 transition-all flex items-center gap-3"
                >
                    <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <HelpCircle className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-200">Quiz</div>
                        <div className="text-[10px] text-slate-500">Active recall questions</div>
                    </div>
                </div>

                {/* Brainstorm Tool */}
                <button
                    onClick={() => setShowBrainstorm(true)}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-purple-500/50 hover:bg-slate-800 transition-all flex items-center justify-between mt-2"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-bold text-slate-200">Brainstorm</div>
                            <div className="text-[10px] text-slate-500">Deep research partner</div>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
            </div>

            {/* Author Section */}
            <div>
                <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <PenTool className="w-3 h-3" />
                    Author
                </div>

                {/* Ghostwriter Tool */}
                <button
                    onClick={() => setShowGhostwriter(true)}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-orange-500/50 hover:bg-slate-800 transition-all flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <Ghost className="w-4 h-4 text-orange-400" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-bold text-slate-200">Ghostwriter</div>
                            <div className="text-[10px] text-slate-500">Dan Koe content engine</div>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
            </div>

            {/* Producer Section */}
            <div>
                <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Workflow className="w-3 h-3" />
                    Producer
                </div>

                {/* Workflow Node Creator */}
                <div
                    draggable
                    onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', JSON.stringify({
                            type: 'workflowNode',
                            label: 'New Workflow'
                        }));
                        event.dataTransfer.effectAllowed = 'move';
                    }}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-grab active:cursor-grabbing hover:border-emerald-500/50 hover:bg-slate-800 transition-all flex items-center gap-3"
                >
                    <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Workflow className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-200">Workflow</div>
                        <div className="text-[10px] text-slate-500">Project stage manager</div>
                    </div>
                </div>
            </div>

            {/* Director Section */}
            <div>
                <div className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clapperboard className="w-3 h-3" />
                    Director
                </div>

                {/* Script Node Creator */}
                <div
                    draggable
                    onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', JSON.stringify({
                            type: 'scriptNode',
                            label: 'New Script'
                        }));
                        event.dataTransfer.effectAllowed = 'move';
                    }}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-grab active:cursor-grabbing hover:border-rose-500/50 hover:bg-slate-800 transition-all flex items-center gap-3"
                >
                    <div className="w-8 h-8 rounded-md bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                        <Clapperboard className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-200">Script</div>
                        <div className="text-[10px] text-slate-500">Video story builder</div>
                    </div>
                </div>

                {/* Storyboard Node Creator */}
                <div
                    draggable
                    onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', JSON.stringify({
                            type: 'storyboardNode',
                            label: 'New Storyboard'
                        }));
                        event.dataTransfer.effectAllowed = 'move';
                    }}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-grab active:cursor-grabbing hover:border-violet-500/50 hover:bg-slate-800 transition-all flex items-center gap-3 mt-2"
                >
                    <div className="w-8 h-8 rounded-md bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                        <Film className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-200">Storyboard</div>
                        <div className="text-[10px] text-slate-500">Visual scene breakdown</div>
                    </div>
                </div>
            </div>

            {/* Marketer Section */}
            <div>
                <div className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Target className="w-3 h-3" />
                    Marketer
                </div>

                {/* Angle Generator Node Creator */}
                <div
                    draggable
                    onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', JSON.stringify({
                            type: 'angleNode',
                            label: 'Marketing Angles'
                        }));
                        event.dataTransfer.effectAllowed = 'move';
                    }}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-grab active:cursor-grabbing hover:border-amber-500/50 hover:bg-slate-800 transition-all flex items-center gap-3"
                >
                    <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Target className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-200">Angle Generator</div>
                        <div className="text-[10px] text-slate-500">Marketing angle factory</div>
                    </div>
                </div>

                {/* Campaign Builder Node Creator */}
                <div
                    draggable
                    onDragStart={(event) => {
                        event.dataTransfer.setData('application/reactflow', JSON.stringify({
                            type: 'campaignNode',
                            label: 'New Campaign'
                        }));
                        event.dataTransfer.effectAllowed = 'move';
                    }}
                    className="p-3 bg-slate-900 border border-slate-800 rounded-lg cursor-grab active:cursor-grabbing hover:border-emerald-500/50 hover:bg-slate-800 transition-all flex items-center gap-3 mt-2"
                >
                    <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <Megaphone className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-200">Campaign Builder</div>
                        <div className="text-[10px] text-slate-500">Multi-platform rollout</div>
                    </div>
                </div>
            </div>

            <div className="text-xs text-slate-600 border-t border-slate-800 pt-4">
                <p>Drag onto canvas to create nodes.</p>
            </div>
        </div>
    );
}

