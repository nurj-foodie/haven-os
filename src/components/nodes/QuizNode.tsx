'use client';
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { HelpCircle, Award, Clock } from 'lucide-react';

export default function QuizNode({ data }: NodeProps) {
    const metadata = typeof data.metadata === 'object' && data.metadata !== null
        ? data.metadata as Record<string, any>
        : {};
    const quizData = metadata.quizData || {};
    const performance = metadata.performance || { attempts: 0, correct: 0, incorrect: 0 };
    const totalQuestions = quizData.questions?.length || 0;

    const scorePercentage = performance.attempts > 0
        ? Math.round((performance.correct / (performance.correct + performance.incorrect)) * 100)
        : null;

    const getScoreColor = (score: number | null) => {
        if (score === null) return 'text-slate-500 bg-slate-800';
        if (score >= 80) return 'text-green-400 bg-green-500/10';
        if (score >= 60) return 'text-yellow-400 bg-yellow-500/10';
        return 'text-red-400 bg-red-500/10';
    };

    return (
        <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-2 border-blue-500/30 rounded-xl p-4 min-w-[220px] shadow-xl backdrop-blur-sm">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-slate-200">{String(data.label || 'Quiz')}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {totalQuestions} Questions
                    </div>
                </div>
            </div>

            {/* Score Badge */}
            {scorePercentage !== null ? (
                <div className={`p-3 rounded-lg mb-3 ${getScoreColor(scorePercentage)}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold">{scorePercentage}%</div>
                            <div className="text-[10px] opacity-70">Last Score</div>
                        </div>
                        <Award className="w-6 h-6 opacity-50" />
                    </div>
                    <div className="mt-2 text-[10px] opacity-70">
                        {performance.correct}/{performance.correct + performance.incorrect} correct
                    </div>
                </div>
            ) : (
                <div className="p-3 rounded-lg mb-3 bg-slate-800 text-slate-400 text-center">
                    <HelpCircle className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <div className="text-[10px]">Not taken yet</div>
                </div>
            )}

            {/* Quiz Info */}
            <div className="space-y-2 mb-3">
                {quizData.courseInsights?.estimatedTime && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{quizData.courseInsights.estimatedTime}</span>
                    </div>
                )}
                {performance.attempts > 0 && (
                    <div className="text-[10px] text-slate-500">
                        Attempts: {performance.attempts}
                    </div>
                )}
            </div>

            {/* Action Button */}
            <button
                className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs font-semibold transition-colors"
                title={performance.attempts > 0 ? "Retake Quiz" : "Start Quiz"}
            >
                {performance.attempts > 0 ? "Retake" : "Start Quiz"}
            </button>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
        </div>
    );
}
