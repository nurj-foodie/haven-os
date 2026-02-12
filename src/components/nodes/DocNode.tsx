import React, { memo } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { FileText, Download, Loader2, Check } from 'lucide-react';

interface DocNodeData extends Record<string, unknown> {
    label: string;
    url: string;
    content?: string;      // Extracted text content - the raw material for agents
    charCount?: number;    // Character count for display
    isExtracting?: boolean;
}

type CustomDocNode = Node<DocNodeData>;

const DocNode = ({ data, selected }: NodeProps<CustomDocNode>) => {
    const hasContent = (data.charCount || 0) > 0;

    return (
        <div
            className={`
                relative group rounded-xl overflow-hidden bg-slate-900 border-2 transition-all w-64
                ${selected ? 'border-slate-400 shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-slate-700 hover:border-slate-500'}
            `}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-slate-500 !w-3 !h-3 !border-2 !border-slate-900"
            />

            <div className="p-4 bg-slate-900 flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-slate-950 flex items-center justify-center text-slate-500 border border-slate-800">
                    <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-200 truncate">{data.label}</h3>
                    <p className="text-[9px] text-slate-500 uppercase mt-0.5 font-mono tracking-tighter">Document Asset</p>
                </div>
                {data.url && (
                    <a
                        href={data.url}
                        download
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                    </a>
                )}
            </div>

            {/* Content Status Bar */}
            <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                {data.isExtracting ? (
                    <>
                        <span className="text-[9px] text-amber-400 uppercase tracking-widest font-bold flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Extracting...
                        </span>
                    </>
                ) : hasContent ? (
                    <>
                        <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Ready
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                            {(data.charCount || 0).toLocaleString()} chars
                        </span>
                    </>
                ) : (
                    <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">Static Resource</span>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-slate-500 !w-3 !h-3 !border-2 !border-slate-900"
            />
        </div>
    );
};

export default memo(DocNode);

