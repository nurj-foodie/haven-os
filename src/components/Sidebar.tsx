import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import {
    LogIn,
    Loader2,
    Image as ImageIcon,
    Box,
    UploadCloud,
    Sparkles,
    Globe,
    FileText,
    BookOpen,
    Trash2,
    GripHorizontal,
    Search,
    ArrowUpDown,
    Music,
    Video,
    Archive,
    RotateCcw
} from 'lucide-react';
import LifecycleBadge from './LifecycleBadge';

interface Asset {
    id: string;
    public_url: string | null;
    filename: string;
    type: string;
    metadata?: any;
    storage_path?: string | null;
}

interface StagingItem {
    id: string;
    type: 'text' | 'link' | 'file';
    content: string | null;
    asset_id: string | null;
    metadata: any;
    created_at: string;
    lifecycle_state?: 'fresh' | 'aging' | 'archived';
    archived_at?: string;
    last_interacted_at?: string;
    asset?: Asset;
}

interface ArchivedItem {
    id: string;
    user_id: string;
    original_staging_id: string;
    type: 'text' | 'link' | 'file';
    content: string | null;
    asset_id: string | null;
    metadata: any;
    created_at: string;
    archived_at: string;
    asset?: Asset;
}

interface SidebarProps {
    user: User | null;
    loading: boolean;
    assets: Asset[];
    stagingItems: StagingItem[];
    archivedItems?: ArchivedItem[];
    showArchive?: boolean;
    onLogin: () => void;
    onUpload: (file: File) => Promise<void>;
    onSendText: (text: string) => Promise<void>;
    onCategorizeItem?: (itemId: string) => Promise<void>;
    onMoveToVault?: (itemId: string, suggestion: any) => Promise<void>;
    onCategorizeAll?: () => Promise<void>;
    onDeleteAsset?: (assetId: string) => Promise<void>;
    onDeleteStagingItem?: (itemId: string) => Promise<void>;
    onArchiveItem?: (itemId: string) => Promise<void>;
    onRestoreFromArchive?: (archivedId: string) => Promise<void>;
    onToggleArchive?: (show: boolean) => void;
}

const SPLIT_RATIO_KEY = 'haven-vault-split-ratio';
const DEFAULT_SPLIT = 0.5; // 50/50 default

export default function Sidebar({
    user,
    loading,
    assets,
    stagingItems,
    archivedItems = [],
    showArchive = false,
    onLogin,
    onUpload,
    onSendText,
    onCategorizeItem,
    onMoveToVault,
    onCategorizeAll,
    onDeleteAsset,
    onDeleteStagingItem,
    onArchiveItem,
    onRestoreFromArchive,
    onToggleArchive
}: SidebarProps) {
    const [isDragging, setIsDragging] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [inputText, setInputText] = React.useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // New: Draggable resizer state
    const [splitRatio, setSplitRatio] = React.useState(DEFAULT_SPLIT);
    const [isResizing, setIsResizing] = React.useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // New: Sorting & Filtering state
    const [sortBy, setSortBy] = React.useState<'newest' | 'oldest' | 'az' | 'za'>('newest');
    const [searchQuery, setSearchQuery] = React.useState('');

    // Semantic Search state
    const [semanticResults, setSemanticResults] = React.useState<Asset[] | null>(null);
    const [isSearching, setIsSearching] = React.useState(false);
    const [isSemanticMode, setIsSemanticMode] = React.useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load split ratio from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(SPLIT_RATIO_KEY);
        if (saved) {
            const parsed = parseFloat(saved);
            if (!isNaN(parsed) && parsed >= 0.2 && parsed <= 0.8) {
                setSplitRatio(parsed);
            }
        }
    }, []);

    // Persist split ratio to localStorage
    useEffect(() => {
        localStorage.setItem(SPLIT_RATIO_KEY, splitRatio.toString());
    }, [splitRatio]);

    // Debounced semantic search
    useEffect(() => {
        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Reset if query is empty
        if (!searchQuery.trim()) {
            setSemanticResults(null);
            setIsSemanticMode(false);
            setIsSearching(false);
            return;
        }

        // Debounce: wait 500ms after user stops typing
        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: searchQuery,
                        userId: user?.id,
                        limit: 50
                    })
                });

                const data = await response.json();

                if (data.fallback) {
                    // Semantic search not available, use text fallback
                    setSemanticResults(null);
                    setIsSemanticMode(false);
                } else if (data.results && data.results.length > 0) {
                    // Use semantic results
                    setSemanticResults(data.results);
                    setIsSemanticMode(true);
                } else {
                    // No semantic results, fallback to text
                    setSemanticResults(null);
                    setIsSemanticMode(false);
                }
            } catch (error) {
                console.error('Semantic search failed:', error);
                setSemanticResults(null);
                setIsSemanticMode(false);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, user?.id]);

    // Resizer drag handlers
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    useEffect(() => {
        const handleResizeMove = (e: MouseEvent) => {
            if (!isResizing || !sidebarRef.current) return;
            const sidebar = sidebarRef.current;
            const rect = sidebar.getBoundingClientRect();
            const headerHeight = 56; // approx header height
            const footerHeight = user ? 40 : 0;
            const availableHeight = rect.height - headerHeight - footerHeight;
            const mouseY = e.clientY - rect.top - headerHeight;
            let newRatio = mouseY / availableHeight;
            newRatio = Math.max(0.2, Math.min(0.8, newRatio)); // Clamp between 20% and 80%
            setSplitRatio(newRatio);
        };

        const handleResizeEnd = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, user]);

    // Filtered and sorted assets (hybrid: semantic first, then text fallback)
    const filteredAssets = useMemo(() => {
        // If semantic search returned results, use those
        if (semanticResults && semanticResults.length > 0) {
            // Semantic results are already ranked by similarity
            return semanticResults;
        }

        let result = [...assets];

        // Text-based filter (fallback)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(a =>
                a.filename.toLowerCase().includes(query) ||
                a.metadata?.title?.toLowerCase().includes(query) ||
                a.metadata?.summary?.toLowerCase().includes(query)
            );
        }

        // Sort (only for non-semantic results)
        result.sort((a, b) => {
            switch (sortBy) {
                case 'oldest':
                    return (a.metadata?.created_at || a.id).localeCompare(b.metadata?.created_at || b.id);
                case 'az':
                    return a.filename.localeCompare(b.filename);
                case 'za':
                    return b.filename.localeCompare(a.filename);
                case 'newest':
                default:
                    return (b.metadata?.created_at || b.id).localeCompare(a.metadata?.created_at || a.id);
            }
        });

        return result;
    }, [assets, searchQuery, sortBy, semanticResults]);


    const onDragStart = (event: React.DragEvent, asset: Asset) => {
        let nodeType = 'imageNode';
        if (asset.type === 'note') nodeType = 'noteNode';
        if (asset.type === 'link') nodeType = 'linkNode';
        if (asset.type === 'document') nodeType = 'docNode';
        if (asset.type === 'audio') nodeType = 'audioNode';
        if (asset.type === 'video') nodeType = 'videoNode';

        // For links, the URL is in metadata.raw_content, not public_url
        const url = asset.type === 'link'
            ? (asset.metadata?.raw_content || '')
            : (asset.public_url || '');

        event.dataTransfer.setData('application/reactflow', JSON.stringify({
            type: nodeType,
            url: url,
            label: asset.filename,
            content: asset.metadata?.raw_content || asset.filename,
            assetId: asset.id,
            metadata: asset.metadata
        }));
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0 && user) {
            setUploading(true);
            try {
                await onUpload(files[0]);
            } catch (error) {
                console.error("Upload failed", error);
            } finally {
                setUploading(false);
            }
        }
    }, [onUpload, user]);

    const handleSend = async () => {
        if (!inputText.trim()) return;
        const text = inputText;
        setInputText('');
        await onSendText(text);
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0 && user) {
            setUploading(true);
            try {
                await onUpload(files[0]);
            } catch (error) {
                console.error("Upload failed", error);
            } finally {
                setUploading(false);
            }
        }
    };

    const renderAISuggestion = (item: StagingItem) => {
        const suggestion = item.metadata?.ai_suggestion;
        const isCategorizing = item.metadata?.is_categorizing;

        if (isCategorizing) {
            return (
                <div className="flex items-center gap-2 text-[9px] text-yellow-500/50 bg-slate-900/50 p-2 rounded-lg ml-4">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Oracle is analyzing...
                </div>
            );
        }

        if (!suggestion) {
            return (
                <button
                    onClick={() => onCategorizeItem?.(item.id)}
                    className="flex items-center gap-2 text-[9px] text-slate-600 hover:text-yellow-500/70 p-1 px-2 transition-colors ml-4"
                >
                    <Sparkles className="w-2.5 h-2.5" />
                    Categorize
                </button>
            );
        }

        return (
            <div className="bg-slate-900/80 border border-yellow-500/20 p-2 rounded-xl ml-4 animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[8px] font-bold text-yellow-500/70 uppercase">{suggestion.category}</span>
                    <button
                        onClick={() => onMoveToVault?.(item.id, suggestion)}
                        className="text-green-500 hover:text-green-400 transition-colors"
                    >
                        <Box className="w-3 h-3" />
                    </button>
                </div>
                <div className="text-[10px] font-medium text-slate-200 truncate">{suggestion.title}</div>
                <div className="text-[9px] text-slate-500 leading-tight mt-0.5">{suggestion.summary}</div>
            </div>
        );
    };

    return (
        <aside
            ref={sidebarRef}
            className={`w-[320px] flex-shrink-0 border-r border-slate-800 bg-[#020617] flex flex-col h-screen z-20 relative transition-colors ${isDragging ? 'bg-slate-900 border-yellow-500/50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Overlay for Drop */}
            {isDragging && user && (
                <div className="absolute inset-0 z-50 bg-yellow-500/10 backdrop-blur-sm flex items-center justify-center border-2 border-yellow-500 border-dashed m-2 rounded-lg pointer-events-none">
                    <div className="text-yellow-500 font-bold flex flex-col items-center gap-2">
                        <UploadCloud className="w-8 h-8" />
                        <span>Drop to Staging</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Vault OS</h2>
                    <div className="text-[10px] text-slate-600 flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {user ? 'Secured' : 'Offline'}
                    </div>
                </div>
                <Box className="w-4 h-4 text-slate-700" />
            </div>

            {/* STAGING AREA (Dynamic height based on splitRatio) */}
            <div style={{ flex: splitRatio }} className="flex flex-col overflow-hidden">
                <div className="px-4 py-2 bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {showArchive ? (
                            <><Archive className="w-3 h-3 text-slate-600" /> Archive</>
                        ) : (
                            <><Sparkles className="w-3 h-3 text-yellow-500/50" /> Staging Area</>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {user && !showArchive && stagingItems.length > 0 && (
                            <button
                                onClick={() => onCategorizeAll?.()}
                                className="p-1 hover:text-yellow-500 transition-colors group relative"
                                title="AI Categorize All"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                            </button>
                        )}
                        {user && (
                            <button
                                onClick={() => onToggleArchive?.(!showArchive)}
                                className={`p-1 hover:text-blue-500 transition-colors ${showArchive ? 'text-blue-400' : 'text-slate-600'}`}
                                title={showArchive ? "Back to Staging" : "View Archive"}
                            >
                                {showArchive ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {!user ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                            <button onClick={onLogin} className="text-xs bg-yellow-500 text-black px-4 py-2 rounded font-bold">Authenticate</button>
                        </div>
                    ) : showArchive ? (
                        /* ARCHIVE VIEW */
                        <>
                            {archivedItems.length === 0 ? (
                                <div className="text-center py-8 text-slate-700 italic text-xs">
                                    No archived items yet.
                                </div>
                            ) : (
                                archivedItems.map((item) => (
                                    <div key={item.id} className="animate-in fade-in duration-300">
                                        <div className="bg-slate-900/50 border border-slate-800/50 p-3 rounded-lg text-sm text-slate-400 relative group">
                                            <div className="flex items-start gap-2">
                                                <Archive className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    {item.type === 'link' ? (
                                                        <div className="text-blue-400/50 underline break-all text-xs">{item.content}</div>
                                                    ) : item.type === 'file' ? (
                                                        <div className="text-xs">{item.asset?.filename || 'File'}</div>
                                                    ) : (
                                                        <div className="text-xs">{item.content}</div>
                                                    )}
                                                    <div className="text-[9px] text-slate-600 mt-1">
                                                        Archived {new Date(item.archived_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => onRestoreFromArchive?.(item.id)}
                                                    className="p-1 text-slate-600 hover:text-green-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Restore to Staging"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    ) : (
                        /* STAGING VIEW */
                        <>
                            {stagingItems.length === 0 && !uploading && (
                                <div className="text-center py-8 text-slate-700 italic text-xs">
                                    "Catch" an idea, link, or file here...
                                </div>
                            )}
                            {stagingItems.map((item) => {
                                const isFresh = item.lifecycle_state === 'fresh' || !item.lifecycle_state;
                                const isAging = item.lifecycle_state === 'aging';
                                return (
                                    <div
                                        key={item.id}
                                        className={`animate-in slide-in-from-bottom-2 duration-300 group ${isFresh ? 'shadow-[0_0_20px_rgba(251,191,36,0.15)]' : ''
                                            } ${isAging ? 'opacity-60' : ''}`}
                                    >
                                        {item.type === 'text' || item.type === 'link' ? (
                                            <div className="flex flex-col gap-2 max-w-[90%]">
                                                <div className={`bg-slate-900 border p-3 rounded-2xl rounded-tl-none text-sm text-slate-300 shadow-sm relative group/item ${isFresh ? 'border-yellow-500/20' : 'border-slate-800'
                                                    }`}>
                                                    {item.type === 'link' ? (
                                                        <a href={item.content || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline break-all flex items-center gap-2">
                                                            <Globe className="w-3 h-3" />
                                                            {item.content}
                                                        </a>
                                                    ) : (
                                                        item.content
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <LifecycleBadge createdAt={item.created_at} lifecycleState={item.lifecycle_state} />
                                                    </div>
                                                    <button
                                                        onClick={() => onDeleteStagingItem?.(item.id)}
                                                        className="absolute -right-2 -top-2 p-1 bg-slate-950 border border-slate-800 rounded-full text-slate-600 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all shadow-xl"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                    {isAging && (
                                                        <button
                                                            onClick={() => onArchiveItem?.(item.id)}
                                                            className="absolute -right-2 -bottom-2 p-1 bg-slate-950 border border-slate-800 rounded-full text-slate-600 hover:text-blue-400 opacity-0 group-hover/item:opacity-100 transition-all shadow-xl"
                                                            title="Archive Now"
                                                        >
                                                            <Archive className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                {renderAISuggestion(item)}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2 max-w-[80%]">
                                                <div className={`bg-slate-900 border p-2 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3 relative group/item ${isFresh ? 'border-yellow-500/20' : 'border-slate-800'
                                                    }`}>
                                                    <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center text-slate-600 overflow-hidden border border-slate-800">
                                                        {item.asset?.type === 'image' && item.asset.public_url ? (
                                                            <img src={item.asset.public_url} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <ImageIcon className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[11px] text-slate-300 font-medium truncate">{item.asset?.filename}</div>
                                                        <LifecycleBadge createdAt={item.created_at} lifecycleState={item.lifecycle_state} />
                                                    </div>
                                                    <button
                                                        onClick={() => onDeleteStagingItem?.(item.id)}
                                                        className="absolute -right-2 -top-2 p-1 bg-slate-950 border border-slate-800 rounded-full text-slate-600 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all shadow-xl"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                    {isAging && (
                                                        <button
                                                            onClick={() => onArchiveItem?.(item.id)}
                                                            className="absolute -right-2 -bottom-2 p-1 bg-slate-950 border border-slate-800 rounded-full text-slate-600 hover:text-blue-400 opacity-0 group-hover/item:opacity-100 transition-all shadow-xl"
                                                            title="Archive Now"
                                                        >
                                                            <Archive className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                {renderAISuggestion(item)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {uploading && (
                                <div className="flex items-center gap-2 text-[10px] text-yellow-500/70 p-2 italic">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Encrypting...
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Staging Input Box (Pinned) */}
                {user && (
                    <div className="p-3 bg-slate-950/50">
                        <div className="relative flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-2 focus-within:border-yellow-500/30 transition-all">
                            <input
                                type="text"
                                placeholder="Type link or idea..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-200 placeholder:text-slate-700"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <button
                                onClick={handleFileClick}
                                className="p-1 text-slate-600 hover:text-yellow-500 transition-colors"
                            >
                                <UploadCloud className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RESIZER HANDLE */}
            <div
                onMouseDown={handleResizeStart}
                className={`h-2 flex items-center justify-center cursor-row-resize border-y border-slate-800 bg-slate-950 hover:bg-slate-900 transition-colors group ${isResizing ? 'bg-yellow-500/10 border-yellow-500/30' : ''}`}
            >
                <GripHorizontal className={`w-4 h-4 text-slate-700 group-hover:text-slate-500 ${isResizing ? 'text-yellow-500' : ''}`} />
            </div>

            {/* VAULT CATEGORIES (Dynamic height based on remaining space) */}
            <div style={{ flex: 1 - splitRatio }} className="flex flex-col overflow-hidden">
                {/* Header with Sort/Search */}
                <div className="px-4 py-2 bg-slate-950/50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-800/50">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            <span>Vault Categories</span>
                            {isSemanticMode && (
                                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[8px] rounded-full font-medium normal-case">
                                    AI
                                </span>
                            )}
                        </div>
                        <span className="text-[8px] text-slate-700 normal-case font-normal">
                            {isSearching ? 'Searching...' : `${filteredAssets.length} items`}
                        </span>
                    </div>
                    {/* Sort & Search Row */}
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                            {isSearching ? (
                                <Loader2 className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-purple-400 animate-spin" />
                            ) : (
                                <Search className={`absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 ${isSemanticMode ? 'text-purple-400' : 'text-slate-600'}`} />
                            )}
                            <input
                                type="text"
                                placeholder="Semantic search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-6 pr-2 py-1.5 text-[10px] bg-slate-900 border rounded text-slate-300 placeholder:text-slate-700 focus:outline-none transition-colors ${isSemanticMode ? 'border-purple-500/30' : 'border-slate-800 focus:border-yellow-500/30'}`}
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'az' | 'za')}
                            className="px-2 py-1.5 text-[10px] bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-yellow-500/30 cursor-pointer"
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="az">A-Z</option>
                            <option value="za">Z-A</option>
                        </select>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredAssets.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-800 text-center space-y-2 py-8">
                            <Box className="w-6 h-6 opacity-20" />
                            <span className="text-[10px] italic">{searchQuery ? 'No matches found.' : 'No categories mapped yet.'}</span>
                        </div>
                    ) : (
                        <div className="p-4 space-y-6">
                            {/* 1. IMAGES GRID */}
                            {filteredAssets.some(a => a.type === 'image') && (
                                <div>
                                    <h3 className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter mb-2 flex items-center gap-2">
                                        <ImageIcon className="w-2.5 h-2.5" /> Images
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {filteredAssets.filter(a => a.type === 'image').map((asset) => (
                                            <div
                                                key={asset.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, asset)}
                                                className="aspect-square relative group cursor-grab active:cursor-grabbing rounded border border-slate-800/50 hover:border-yellow-500/20 transition-colors bg-slate-900/30 overflow-hidden"
                                            >
                                                {asset.public_url && (
                                                    <img
                                                        src={asset.public_url}
                                                        alt={asset.filename}
                                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                                    />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="absolute bottom-1 left-1 right-1 text-[7px] text-slate-500 truncate pointer-events-none group-hover:text-slate-200">
                                                    {asset.filename}
                                                </div>
                                                <button
                                                    draggable={false}
                                                    onDragStart={(e) => e.preventDefault()}
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteAsset?.(asset.id); }}
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    className="absolute top-1 right-1 p-1 bg-black/50 rounded text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                                                >
                                                    <Trash2 className="w-2.5 h-2.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 2. NOTES & IDEAS */}
                            {filteredAssets.some(a => a.type === 'note') && (
                                <div>
                                    <h3 className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter mb-2 flex items-center gap-2">
                                        <BookOpen className="w-2.5 h-2.5" /> Notes & Ideas
                                    </h3>
                                    <div className="space-y-2">
                                        {filteredAssets.filter(a => a.type === 'note').map((asset) => (
                                            <div
                                                key={asset.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, asset)}
                                                className="p-2 rounded border border-slate-800/50 hover:border-yellow-500/20 transition-colors bg-slate-900/30 cursor-grab active:cursor-grabbing group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center text-slate-700 border border-slate-800 group-hover:text-yellow-500/50 transition-colors">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] font-medium text-slate-300 truncate">{asset.filename}</div>
                                                        <div className="text-[8px] text-slate-600 truncate">{asset.metadata?.summary || 'No summary'}</div>
                                                    </div>
                                                    <button
                                                        draggable={false}
                                                        onDragStart={(e) => e.preventDefault()}
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteAsset?.(asset.id); }}
                                                        onPointerDown={(e) => e.stopPropagation()}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        className="p-1 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 3. LINKS */}
                            {filteredAssets.some(a => a.type === 'link') && (
                                <div>
                                    <h3 className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter mb-2 flex items-center gap-2">
                                        <Globe className="w-2.5 h-2.5" /> Links
                                    </h3>
                                    <div className="space-y-2">
                                        {filteredAssets.filter(a => a.type === 'link').map((asset) => (
                                            <div
                                                key={asset.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, asset)}
                                                className="p-2 rounded border border-slate-800/50 hover:border-blue-500/20 transition-colors bg-slate-900/30 cursor-grab active:cursor-grabbing group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center text-slate-700 border border-slate-800 group-hover:text-blue-500/50 transition-colors">
                                                        <Globe className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] font-medium text-slate-300 truncate">{asset.filename}</div>
                                                        <div className="text-[8px] text-blue-500/50 truncate underline">{asset.metadata?.raw_content || 'View Link'}</div>
                                                    </div>
                                                    <button
                                                        draggable={false}
                                                        onDragStart={(e) => e.preventDefault()}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            onDeleteAsset?.(asset.id);
                                                        }}
                                                        onPointerDown={(e) => e.stopPropagation()}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        className="p-1 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 4. AUDIO */}
                            {filteredAssets.some(a => a.type === 'audio') && (
                                <div>
                                    <h3 className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter mb-2 flex items-center gap-2">
                                        <Music className="w-2.5 h-2.5" /> Audio
                                    </h3>
                                    <div className="space-y-2">
                                        {filteredAssets.filter(a => a.type === 'audio').map((asset) => (
                                            <div
                                                key={asset.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, asset)}
                                                className="p-2 rounded border border-slate-800/50 hover:border-purple-500/30 transition-colors bg-slate-900/30 cursor-grab active:cursor-grabbing group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                                        <Music className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] font-medium text-slate-300 truncate">{asset.filename}</div>
                                                        <div className="text-[8px] text-purple-400/70 uppercase">Audio</div>
                                                    </div>
                                                    <button
                                                        draggable={false}
                                                        onDragStart={(e) => e.preventDefault()}
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteAsset?.(asset.id); }}
                                                        onPointerDown={(e) => e.stopPropagation()}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        className="p-1 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 5. VIDEO */}
                            {filteredAssets.some(a => a.type === 'video') && (
                                <div>
                                    <h3 className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter mb-2 flex items-center gap-2">
                                        <Video className="w-2.5 h-2.5" /> Video
                                    </h3>
                                    <div className="space-y-2">
                                        {filteredAssets.filter(a => a.type === 'video').map((asset) => (
                                            <div
                                                key={asset.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, asset)}
                                                className="p-2 rounded border border-slate-800/50 hover:border-blue-500/30 transition-colors bg-slate-900/30 cursor-grab active:cursor-grabbing group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                                        <Video className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] font-medium text-slate-300 truncate">{asset.filename}</div>
                                                        <div className="text-[8px] text-blue-400/70 uppercase">Video</div>
                                                    </div>
                                                    <button
                                                        draggable={false}
                                                        onDragStart={(e) => e.preventDefault()}
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteAsset?.(asset.id); }}
                                                        onPointerDown={(e) => e.stopPropagation()}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        className="p-1 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 6. DOCUMENTS */}
                            {filteredAssets.some(a => a.type === 'document') && (
                                <div>
                                    <h3 className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter mb-2 flex items-center gap-2">
                                        <FileText className="w-2.5 h-2.5" /> Documents
                                    </h3>
                                    <div className="space-y-2">
                                        {filteredAssets.filter(a => a.type === 'document').map((asset) => (
                                            <div
                                                key={asset.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, asset)}
                                                className="p-2 rounded border border-slate-800/50 hover:border-slate-500 transition-colors bg-slate-900/30 cursor-grab active:cursor-grabbing group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center text-slate-700 border border-slate-800">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] font-medium text-slate-300 truncate">{asset.filename}</div>
                                                        <div className="text-[8px] text-slate-600 uppercase">Document</div>
                                                    </div>
                                                    <button
                                                        draggable={false}
                                                        onDragStart={(e) => e.preventDefault()}
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteAsset?.(asset.id); }}
                                                        onPointerDown={(e) => e.stopPropagation()}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        className="p-1 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            {
                user && (
                    <div className="p-2 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
                        <div className="text-[9px] text-slate-700 font-mono uppercase tracking-tighter">Secure Link Active</div>
                        <div className="text-[9px] text-slate-700 truncate max-w-[150px]">{user.email}</div>
                    </div>
                )
            }
        </aside >
    );
}
