import React, { memo } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { Video, Film, Sparkles } from 'lucide-react';

interface VideoNodeData extends Record<string, unknown> {
    url: string;
    label: string;
    metadata?: {
        transcription?: {
            summary?: string;
            transcript?: string;
        };
    };
}

type CustomVideoNode = Node<VideoNodeData>;

const VideoNode = ({ data, selected }: NodeProps<CustomVideoNode>) => {
    const hasTranscription = !!data.metadata?.transcription;

    return (
        <div
            className={`
                relative group rounded-xl overflow-hidden bg-slate-900 border-2 transition-all w-80
                ${selected ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-slate-700 hover:border-slate-500'}
            `}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-blue-500 !w-3 !h-3 !border-2 !border-slate-900"
            />

            {/* Video Player Section */}
            <div className="bg-black">
                {data.url ? (
                    <video
                        controls
                        className="w-full aspect-video object-cover"
                        preload="metadata"
                    >
                        <source src={data.url} type="video/mp4" />
                        <source src={data.url} type="video/webm" />
                        <source src={data.url} type="video/ogg" />
                        Your browser does not support the video element.
                    </video>
                ) : (
                    <div className="w-full aspect-video flex items-center justify-center bg-slate-950">
                        <Video className="w-12 h-12 text-slate-700" />
                    </div>
                )}

                {/* Overlay Labels */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-xs text-white truncate font-medium">{data.label}</p>
                    </div>
                </div>

                {/* Transcription Badge */}
                {hasTranscription && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/90 border border-green-400 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-white" />
                        <span className="text-[8px] text-white font-bold uppercase">Transcribed</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-2 bg-slate-950 border-t border-slate-800">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] text-blue-400 uppercase tracking-widest font-bold flex items-center gap-1">
                        <Film className="w-2.5 h-2.5" />
                        Video Asset
                    </span>
                    {hasTranscription && (
                        <span className="text-[8px] text-green-500/50 uppercase">AI Processed</span>
                    )}
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-blue-500 !w-3 !h-3 !border-2 !border-slate-900"
            />
        </div>
    );
};

export default memo(VideoNode);
