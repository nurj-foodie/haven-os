import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { Globe, ExternalLink, Loader2 } from 'lucide-react';

interface LinkNodeData extends Record<string, unknown> {
    label: string;
    url: string;
}

interface OpenGraphData {
    title: string;
    description: string;
    image: string | null;
    siteName: string;
    url: string;
}

type CustomLinkNode = Node<LinkNodeData>;

const LinkNode = ({ data, selected }: NodeProps<CustomLinkNode>) => {
    const [ogData, setOgData] = useState<OpenGraphData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchOpenGraph = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/opengraph', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: data.url })
                });
                const result = await res.json();

                if (result.fallback || result.error) {
                    setError(true);
                } else {
                    setOgData(result);
                }
            } catch (err) {
                console.error('[LinkNode] Failed to fetch OG data:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchOpenGraph();
    }, [data.url]);

    return (
        <div
            className={`
                relative group rounded-xl overflow-hidden bg-slate-900 border-2 transition-all w-72
                ${selected ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-slate-700 hover:border-slate-500'}
            `}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-blue-500 !w-3 !h-3 !border-2 !border-slate-900"
            />

            {/* OpenGraph Preview */}
            {loading && (
                <div className="p-4 flex items-center justify-center gap-2 bg-slate-900">
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                    <span className="text-xs text-slate-500">Loading preview...</span>
                </div>
            )}

            {!loading && !error && ogData && (
                <>
                    {/* Preview Image */}
                    {ogData.image && (
                        <div className="w-full h-32 bg-slate-950 overflow-hidden">
                            <img
                                src={ogData.image}
                                alt={ogData.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-4 bg-slate-900">
                        <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <h3 className="text-xs font-bold text-slate-200 line-clamp-1">{ogData.title}</h3>
                        </div>
                        {ogData.description && (
                            <p className="text-[10px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                                {ogData.description}
                            </p>
                        )}
                        <a
                            href={data.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 text-[9px] text-blue-400 hover:bg-slate-800 transition-colors group/link"
                        >
                            <span className="truncate flex-1">{ogData.siteName}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                    </div>
                </>
            )}

            {/* Fallback UI (error or no OG data) */}
            {!loading && error && (
                <div className="p-4 bg-slate-900">
                    <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <h3 className="text-xs font-bold text-slate-200 truncate">{data.label}</h3>
                    </div>
                    <a
                        href={data.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-blue-400 hover:bg-slate-800 transition-colors group/link"
                    >
                        <span className="truncate flex-1">{data.url}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                </div>
            )}

            <div className="p-2 bg-slate-950 border-t border-slate-800">
                <span className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">External Resource</span>
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-blue-500 !w-3 !h-3 !border-2 !border-slate-900"
            />
        </div>
    );
};

export default memo(LinkNode);
