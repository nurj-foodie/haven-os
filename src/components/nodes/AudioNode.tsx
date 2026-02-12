import React, { memo } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { Music, FileAudio, Sparkles } from 'lucide-react';

interface AudioNodeData extends Record<string, unknown> {
    url: string;
    label: string;
    metadata?: {
        transcription?: {
            summary?: string;
            transcript?: string;
        };
    };
}

type CustomAudioNode = Node<AudioNodeData>;

const AudioNode = ({ data, selected }: NodeProps<CustomAudioNode>) => {
    const hasTranscription = !!data.metadata?.transcription;

    return (
        <div
            className={`
                relative group rounded-xl overflow-hidden bg-slate-900 border-2 transition-all w-80
                ${selected ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'border-slate-700 hover:border-slate-500'}
            `}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-purple-500 !w-3 !h-3 !border-2 !border-slate-900"
            />

            {/* Audio Player Section */}
            <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-950">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <Music className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-bold text-slate-200 truncate">{data.label}</h3>
                        <p className="text-[9px] text-slate-500 uppercase mt-0.5 font-mono tracking-tighter flex items-center gap-1">
                            <FileAudio className="w-2.5 h-2.5" />
                            Audio Asset
                        </p>
                    </div>
                    {hasTranscription && (
                        <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                            <Sparkles className="w-3 h-3 text-green-400" />
                        </div>
                    )}
                </div>

                {/* HTML5 Audio Player */}
                {data.url && (
                    <audio
                        controls
                        className="w-full h-8"
                        style={{
                            filter: 'invert(0.9) hue-rotate(180deg)',
                            opacity: 0.8
                        }}
                    >
                        <source src={data.url} type="audio/mpeg" />
                        <source src={data.url} type="audio/wav" />
                        <source src={data.url} type="audio/ogg" />
                        Your browser does not support the audio element.
                    </audio>
                )}
            </div>

            {/* Footer */}
            <div className="p-2 bg-slate-950 border-t border-slate-800">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">
                        {hasTranscription ? 'Transcribed' : 'Audio Track'}
                    </span>
                    {hasTranscription && (
                        <span className="text-[8px] text-green-500/50 uppercase">AI Processed</span>
                    )}
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-purple-500 !w-3 !h-3 !border-2 !border-slate-900"
            />
        </div>
    );
};

export default memo(AudioNode);
