import React, { memo, useState } from 'react';
import { Handle, Position, Node, NodeProps, useReactFlow } from '@xyflow/react';
import { BookOpen, Edit3, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NoteNodeData extends Record<string, unknown> {
    label: string;
    content: string;
}

type CustomNoteNode = Node<NoteNodeData>;

const NoteNode = ({ data, selected, id }: NodeProps<CustomNoteNode>) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(data.content);
    const { setNodes } = useReactFlow();

    const handleSave = () => {
        setNodes((nodes) =>
            nodes.map((node) =>
                node.id === id
                    ? { ...node, data: { ...node.data, content: editContent } }
                    : node
            )
        );
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditContent(data.content);
        setIsEditing(false);
    };

    return (
        <div
            className={`
                relative group rounded-xl overflow-hidden bg-slate-900 border-2 transition-all w-80
                ${selected ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-slate-700 hover:border-slate-500'}
            `}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-slate-900"
            />

            <div className="p-4 bg-slate-900">
                <div className="flex items-center gap-2 mb-3 justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <BookOpen className="w-4 h-4 text-yellow-500/70 flex-shrink-0" />
                        <h3 className="text-xs font-bold text-slate-200 truncate">{data.label}</h3>
                    </div>

                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-1 hover:bg-slate-800 rounded transition-colors"
                            title="Edit note"
                        >
                            <Edit3 className="w-3 h-3 text-slate-500 hover:text-yellow-500" />
                        </button>
                    ) : (
                        <div className="flex gap-1">
                            <button
                                onClick={handleSave}
                                className="p-1 hover:bg-green-900/30 rounded transition-colors"
                                title="Save"
                            >
                                <Check className="w-3 h-3 text-green-500" />
                            </button>
                            <button
                                onClick={handleCancel}
                                className="p-1 hover:bg-red-900/30 rounded transition-colors"
                                title="Cancel"
                            >
                                <X className="w-3 h-3 text-red-500" />
                            </button>
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-40 p-2 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-300 leading-relaxed resize-none focus:outline-none focus:border-yellow-500/50"
                        placeholder="Write your note... (Markdown supported)"
                        autoFocus
                    />
                ) : (
                    <div className="text-[11px] text-slate-400 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {data.content}
                        </ReactMarkdown>
                    </div>
                )}
            </div>

            <div className="p-2 bg-slate-950 border-t border-slate-800">
                <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">
                    {isEditing ? 'Editing...' : 'Thought Node'}
                </span>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-slate-900"
            />
        </div>
    );
};

export default memo(NoteNode);
