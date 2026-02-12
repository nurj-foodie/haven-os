import React, { memo } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';

// Define the data type for the node
interface ImageNodeData extends Record<string, unknown> {
    url: string;
    label: string;
}

// Combine Node type with our custom data
type CustomImageNode = Node<ImageNodeData>;

const ImageNode = ({ data, selected }: NodeProps<CustomImageNode>) => {
    return (
        <div
            className={`
        relative group rounded-xl overflow-hidden bg-slate-900 border-2 transition-all w-64
        ${selected ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'border-slate-700 hover:border-slate-500'}
      `}
        >
            {/* Input Handle (Target) */}
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-slate-900"
            />

            <div className="aspect-video relative">
                <img
                    src={data.url as string || undefined}
                    alt={data.label as string || 'Image'}
                    className="w-full h-full object-cover pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-xs text-white truncate font-medium">{data.label as string}</p>
                </div>
            </div>

            <div className="p-2 bg-slate-950 border-t border-slate-800">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Image Asset</span>
                </div>
            </div>

            {/* Output Handle (Source) */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-slate-900"
            />
        </div>
    );
};

export default memo(ImageNode);
