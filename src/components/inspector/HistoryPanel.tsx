import React, { useState } from 'react';
import { Clock, RotateCcw, X } from 'lucide-react';

interface HistoryItem {
    timestamp: number;
    content: string;
    transformationType?: string;
    platform?: string;
}

interface HistoryPanelProps {
    history: HistoryItem[];
    currentContent: string;
    onRestore: (content: string) => void;
    onClose: () => void;
}

export default function HistoryPanel({ history, currentContent, onRestore, onClose }: HistoryPanelProps) {
    const getTransformationLabel = (item: HistoryItem) => {
        if (item.transformationType === 'TWEET_TO_NEWSLETTER') return 'Newsletter Expansion';
        if (item.transformationType === 'NEWSLETTER_TO_SCRIPT') return 'Script Conversion';
        if (item.transformationType === 'FORMAT_PLATFORM') {
            if (item.platform === 'linkedin') return 'LinkedIn Format';
            if (item.platform === 'twitter') return 'Twitter Format';
            if (item.platform === 'instagram') return 'Instagram Format';
        }
        return 'Manual Edit';
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-lg w-[600px] max-h-[80vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Version History</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-800 rounded transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-500" />
                    </button>
                </div>

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {/* Current Version */}
                    <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">Current Version</div>
                            <div className="text-[10px] text-slate-500">{formatTimestamp(Date.now())}</div>
                        </div>
                        <div className="text-xs text-slate-300 line-clamp-3 bg-slate-950/50 rounded p-2">
                            {currentContent.substring(0, 200)}...
                        </div>
                    </div>

                    {/* History Items */}
                    {history.length === 0 ? (
                        <div className="text-center text-xs text-slate-600 py-8">
                            No previous versions yet
                        </div>
                    ) : (
                        history.map((item, index) => (
                            <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 hover:border-slate-600 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs font-bold text-slate-400">
                                            {getTransformationLabel(item)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-[10px] text-slate-500">{formatTimestamp(item.timestamp)}</div>
                                        <button
                                            onClick={() => onRestore(item.content)}
                                            className="px-2 py-1 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 text-[10px] rounded border border-blue-800/50 flex items-center gap-1 transition-colors"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            Restore
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 line-clamp-2 bg-slate-950/30 rounded p-2">
                                    {item.content.substring(0, 150)}...
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
