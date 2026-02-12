import React, { memo } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { Sparkles, Bot, Loader2 } from 'lucide-react';

interface AINodeData extends Record<string, unknown> {
    status: 'idle' | 'processing' | 'done' | 'error';
    result?: string;
}

type CustomAINode = Node<AINodeData>;

const AINode = ({ data, selected }: NodeProps<CustomAINode>) => {
    return (
        <div
            className={`
        relative group rounded-xl overflow-hidden bg-slate-900 border-2 transition-all w-80 shadow-xl
        ${selected ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-slate-700 hover:border-slate-500'}
      `}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-slate-900"
            />

            {/* Header */}
            <div className="bg-slate-950 p-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                        <Bot className="w-4 h-4 text-yellow-500" />
                    </div>
                    <span className="text-sm font-bold text-slate-200">Gemini 1.5 Pro</span>
                </div>
                {data.status === 'processing' && (
                    <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                )}
                {data.status === 'done' && (
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                )}
            </div>

            {/* Content Area */}
            <div className="p-4 min-h-[100px] bg-slate-900/50">
                {data.status === 'idle' && (
                    <div className="text-xs text-slate-500 text-center py-4">
                        Connect an image to analyze
                    </div>
                )}

                {data.status === 'processing' && (
                    <div className="text-xs text-yellow-500 animate-pulse text-center py-4">
                        Analyzing visual data...
                    </div>
                )}

                {data.status === 'done' && data.result && (
                    <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                        {data.result}
                    </div>
                )}

                {data.status === 'error' && (
                    <div className="text-xs text-red-400 text-center py-4">
                        Analysis Failed
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-2 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Analysis Unit</span>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                </div>
            </div>

        </div>
    );
};

export default memo(AINode);
