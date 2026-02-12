'use client';
import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Download, Copy, Check, Globe, Database, FileStack, Brain, Search, FileOutput, BookOpen, HelpCircle } from 'lucide-react';
import { ProcessorProps } from './types';
import { useReactFlow } from '@xyflow/react';

interface ArticleSection {
    heading: string;
    brief: string;
    content?: string;
    expanded?: boolean;
}

interface ArticleOutline {
    title: string;
    sections: ArticleSection[];
    sources?: any[]; // For web sources and citations
}

interface VaultAsset {
    id: string;
    title: string;
    summary?: string;
    category: string;
}

interface WebSource {
    title: string;
    url: string;
    snippet: string;
}

const TEMPLATES = [
    { id: 'how-to', label: 'How-To Guide', desc: 'Step-by-step instructional' },
    { id: 'thought-leadership', label: 'Thought Leadership', desc: 'Opinion & insights' },
    { id: 'case-study', label: 'Case Study', desc: 'Real-world example' },
    { id: 'listicle', label: 'Listicle', desc: 'Numbered list format' }
];

const SOURCE_MODES = [
    { id: 'ai', label: 'AI Knowledge', icon: Brain, desc: 'Generate from AI training' },
    { id: 'canvas', label: 'Canvas Context', icon: FileStack, desc: 'Use selected nodes' },
    { id: 'vault', label: 'Vault Assets', icon: Database, desc: 'Search your vault' },
    { id: 'web', label: 'Web Search', icon: Globe, desc: 'External research + citations' }
];

export default function ArticleProcessor({ node }: ProcessorProps) {
    const { setNodes, getNodes, getEdges } = useReactFlow();
    const [topic, setTopic] = useState('');
    const [template, setTemplate] = useState('how-to');
    const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(['ai'])); // Multi-source selection
    const [outline, setOutline] = useState<ArticleOutline | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandingSection, setExpandingSection] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);

    // Vault search
    const [vaultQuery, setVaultQuery] = useState('');
    const [vaultAssets, setVaultAssets] = useState<VaultAsset[]>([]);
    const [selectedVaultAssets, setSelectedVaultAssets] = useState<Set<string>>(new Set());
    const [searchingVault, setSearchingVault] = useState(false);

    // Web search
    const [webSources, setWebSources] = useState<WebSource[]>([]);
    const [searchingWeb, setSearchingWeb] = useState(false);

    // Auto-populate topic from node content when Canvas Context is enabled
    useEffect(() => {
        if (node && selectedSources.has('canvas')) {
            const nodeContent = (node.data.content as string) || '';
            if (nodeContent && !topic) {
                // Use first line or first 50 chars as topic suggestion
                const firstLine = nodeContent.split('\n')[0].trim();
                const suggestion = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
                if (suggestion) setTopic(suggestion);
            }
        }
    }, [node?.id, selectedSources]);

    if (!node) return null;

    // Get content from the current node (for docNode or noteNode)
    const getNodeContent = () => {
        return (node.data.content as string) || '';
    };

    const getVoiceProfile = () => {
        const voiceProfile = node.data.voiceProfile as any;
        if (!voiceProfile?.enabled) return undefined;
        if (!voiceProfile.samples?.trim() && !voiceProfile.rules?.trim()) return undefined;
        return {
            samples: voiceProfile.samples,
            rules: voiceProfile.rules
        };
    };

    const searchVault = async () => {
        if (!vaultQuery.trim()) return;
        setSearchingVault(true);
        try {
            const res = await fetch('/api/vault/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: vaultQuery, userId: node.data.userId })
            });
            const data = await res.json();
            if (res.ok) setVaultAssets(data.assets || []);
        } catch (error) {
            console.error('Vault search failed:', error);
        } finally {
            setSearchingVault(false);
        }
    };

    const searchWeb = async () => {
        if (!topic.trim()) return;
        setSearchingWeb(true);
        try {
            const res = await fetch('/api/search/web', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: topic })
            });
            const data = await res.json();
            if (res.ok) setWebSources(data.sources || []);
        } catch (error) {
            console.error('Web search failed:', error);
        } finally {
            setSearchingWeb(false);
        }
    };

    const getCanvasContext = () => {
        if (!node) return '';

        const allNodes = getNodes();
        const allEdges = getEdges();
        const visited = new Set<string>();
        const results: { type: string; content: string }[] = [];

        // Graph traversal to find connected nodes
        const traverse = (currentId: string, depth: number, maxDepth: number = 2) => {
            if (depth > maxDepth || visited.has(currentId)) return;
            visited.add(currentId);

            // Find edges connected to this node
            const connectedEdges = allEdges.filter(e =>
                e.source === currentId || e.target === currentId
            );

            // Get the other nodes
            connectedEdges.forEach(edge => {
                const nextId = edge.source === currentId ? edge.target : edge.source;
                if (visited.has(nextId)) return;

                const nextNode = allNodes.find(n => n.id === nextId);
                if (nextNode) {
                    // Note Nodes - text content
                    if (nextNode.type === 'noteNode' && nextNode.data.content) {
                        results.push({
                            type: 'note',
                            content: `### ${nextNode.data.label || 'Connected Note'}\n${nextNode.data.content}`
                        });
                    }
                    // AI Vision Analysis
                    else if (nextNode.type === 'aiNode' && nextNode.data.result) {
                        results.push({
                            type: 'ai',
                            content: `### AI Vision Analysis\n${nextNode.data.result}`
                        });
                    }
                    // Image Descriptions
                    else if (nextNode.type === 'imageNode') {
                        results.push({
                            type: 'image',
                            content: `### Image: ${nextNode.data.label || 'Untitled'}\n[Visual Reference: ${nextNode.data.url}]`
                        });
                    }

                    traverse(nextId, depth + 1, maxDepth);
                }
            });
        };

        // Start traversal from current node
        traverse(node.id, 0);

        if (results.length === 0) return '';

        // Group by type
        const notes = results.filter(r => r.type === 'note');
        const aiAnalysis = results.filter(r => r.type === 'ai');
        const images = results.filter(r => r.type === 'image');

        let output = '';
        if (notes.length) output += notes.map(r => r.content).join('\n\n') + '\n\n';
        if (aiAnalysis.length) output += aiAnalysis.map(r => r.content).join('\n\n') + '\n\n';
        if (images.length) output += images.map(r => r.content).join('\n\n');

        return output.trim();
    };

    const generateOutline = async () => {
        if (!topic.trim()) return;

        // Auto-search web if web source is selected
        if (selectedSources.has('web') && webSources.length === 0) {
            await searchWeb();
        }

        setLoading(true);

        try {
            // Prepare payload with all selected sources
            let payload: any = {
                action: 'GENERATE_OUTLINE',
                topic,
                template,
                voiceProfile: getVoiceProfile(),
                sourceMode: 'multi' // Indicate multiple sources
            };

            // Collect context from all enabled sources
            if (selectedSources.has('canvas')) {
                // Include current node content first
                const currentNodeContent = getNodeContent();
                let contextParts: string[] = [];

                if (currentNodeContent) {
                    contextParts.push(`### Selected Node Content\n${currentNodeContent}`);
                }

                // Then add connected nodes
                const connectedContext = getCanvasContext();
                if (connectedContext) {
                    contextParts.push(connectedContext);
                }

                if (contextParts.length > 0) {
                    payload.canvasContext = contextParts.join('\n\n');
                }
            }

            if (selectedSources.has('vault')) {
                const assets = Array.from(selectedVaultAssets)
                    .map(id => vaultAssets.find(a => a.id === id))
                    .filter(Boolean);
                if (assets.length > 0) payload.vaultAssets = assets;
            }

            if (selectedSources.has('web')) {
                if (webSources.length > 0) payload.webSources = webSources;
            }

            const res = await fetch('/api/ai/article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setOutline({ ...data.outline, sources: webSources });
        } catch (error) {
            console.error('Outline generation failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const expandSection = async (index: number) => {
        if (!outline) return;
        setExpandingSection(index);

        try {
            const res = await fetch('/api/ai/article', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'EXPAND_SECTION',
                    section: outline.sections[index],
                    context: JSON.stringify(outline),
                    voiceProfile: getVoiceProfile()
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setOutline({
                ...outline,
                sections: outline.sections.map((s, i) =>
                    i === index ? { ...s, content: data.content, expanded: true } : s
                )
            });
        } catch (error) {
            console.error('Section expansion failed:', error);
        } finally {
            setExpandingSection(null);
        }
    };

    const getFullArticle = () => {
        if (!outline) return '';
        let article = `# ${outline.title}\n\n`;
        outline.sections.forEach((section) => {
            article += `## ${section.heading}\n\n`;
            if (section.content) {
                article += `${section.content}\n\n`;
            } else {
                article += `*${section.brief}*\n\n`;
            }
        });
        return article;
    };

    const formatForLinkedIn = () => {
        if (!outline) return '';
        let post = `${outline.title}\n\n`;

        outline.sections.forEach((section, i) => {
            if (section.content) {
                // Add section with line breaks for readability
                const content = section.content.split('\n\n').join('\n\n');
                post += `${i === 0 ? '' : '\n\n'}${section.heading.toUpperCase()}\n${content}`;
            }
        });

        // Add hashtags
        const hashtags = `\n\n#ThoughtLeadership #${template.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;
        return post + hashtags;
    };

    const formatForFacebook = () => {
        if (!outline) return '';
        let post = `📝 ${outline.title}\n\n`;

        outline.sections.forEach((section) => {
            if (section.content) {
                post += `${section.content}\n\n`;
            }
        });

        return post;
    };

    const copyToClipboard = (format: 'markdown' | 'linkedin' | 'facebook') => {
        let text = '';
        switch (format) {
            case 'markdown':
                text = getFullArticle();
                break;
            case 'linkedin':
                text = formatForLinkedIn();
                break;
            case 'facebook':
                text = formatForFacebook();
                break;
        }

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const createNoteFromArticle = () => {
        if (!outline) return;
        const article = getFullArticle();

        // Dispatch event to create new noteNode
        const event = new CustomEvent('createNoteFromContent', {
            detail: {
                sourceNodeId: node.id,
                content: article,
                label: outline.title || 'Article'
            }
        });
        window.dispatchEvent(event);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 border-t border-slate-800 pt-4 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <FileText className="w-3 h-3" />
                Article Builder
            </div>

            <div className="flex-1 flex flex-col space-y-4 min-h-0">
                {/* Topic Input */}
                <div>
                    <label className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 block">
                        Article Topic
                    </label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., How to build a personal brand on LinkedIn"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 focus:outline-none focus:border-slate-600"
                    />
                </div>

                {/* Source Mode Selector */}
                <div>
                    <label className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 block">
                        Sources ({selectedSources.size} selected)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {SOURCE_MODES.map((mode) => {
                            const Icon = mode.icon;
                            const isSelected = selectedSources.has(mode.id);
                            return (
                                <label
                                    key={mode.id}
                                    className={`px-2 py-1.5 text-xs rounded border transition-colors text-left flex items-center gap-1.5 cursor-pointer ${isSelected
                                        ? 'bg-blue-900/40 border-blue-700 text-blue-200'
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                            const newSources = new Set(selectedSources);
                                            if (e.target.checked) {
                                                newSources.add(mode.id);
                                            } else {
                                                newSources.delete(mode.id);
                                            }
                                            setSelectedSources(newSources);
                                        }}
                                        className="w-3 h-3"
                                    />
                                    <Icon className="w-3 h-3 flex-shrink-0" />
                                    <div className="flex-1">
                                        <div className="font-bold text-[10px]">{mode.label}</div>
                                        <div className="text-[8px] text-slate-500">{mode.desc}</div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Canvas Context Info */}
                {selectedSources.has('canvas') && (
                    <div className="bg-blue-900/20 border border-blue-700/30 rounded p-2 text-[10px] text-blue-200">
                        {(() => {
                            const nodeContent = getNodeContent();
                            const connectedContext = getCanvasContext();

                            // Count sources from current node
                            const hasCurrentNode = nodeContent.length > 0;

                            // Count connected nodes
                            const noteCount = (connectedContext.match(/### Connected Note/g) || []).length +
                                (connectedContext.match(/### [^A]\w+\n(?!AI Vision|Image:)/g) || []).length;
                            const aiCount = (connectedContext.match(/### AI Vision Analysis/g) || []).length;
                            const imageCount = (connectedContext.match(/### Image:/g) || []).length;

                            const parts = [];
                            if (hasCurrentNode) parts.push('current node content');
                            if (noteCount > 0) parts.push(`${noteCount} connected note${noteCount > 1 ? 's' : ''}`);
                            if (aiCount > 0) parts.push(`${aiCount} AI analysis`);
                            if (imageCount > 0) parts.push(`${imageCount} image${imageCount > 1 ? 's' : ''}`);

                            if (parts.length === 0) {
                                return '⚠️ No content found. Select a node with content.';
                            }
                            return `✓ Using ${parts.join(', ')}`;
                        })()}
                    </div>
                )}

                {/* Vault Search*/}
                {selectedSources.has('vault') && (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={vaultQuery}
                                onChange={(e) => setVaultQuery(e.target.value)}
                                placeholder="Search vault..."
                                className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 focus:outline-none focus:border-slate-600"
                            />
                            <button
                                onClick={searchVault}
                                disabled={searchingVault}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold uppercase rounded transition-colors disabled:opacity-50"
                            >
                                {searchingVault ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                        {vaultAssets.length > 0 && (
                            <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                {vaultAssets.map((asset) => (
                                    <label key={asset.id} className="flex items-start gap-2 p-2 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-300 cursor-pointer hover:border-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={selectedVaultAssets.has(asset.id)}
                                            onChange={(e) => {
                                                const newSet = new Set(selectedVaultAssets);
                                                e.target.checked ? newSet.add(asset.id) : newSet.delete(asset.id);
                                                setSelectedVaultAssets(newSet);
                                            }}
                                            className="w-3 h-3 mt-0.5"
                                        />
                                        <div className="flex-1">
                                            <div className="font-bold">{asset.title}</div>
                                            <div className="text-[9px] text-slate-500">{asset.category}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Web Search Results */}
                {selectedSources.has('web') && webSources.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">
                            Found {webSources.length} sources
                        </div>
                        {webSources.map((source, i) => (
                            <div key={i} className="p-2 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-300">
                                <div className="font-bold text-blue-300">[{i + 1}] {source.title}</div>
                                <div className="text-[9px] text-slate-500 truncate">{source.url}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Template Selector */}
                <div>
                    <label className="text-[9px] text-slate-500 uppercase tracking-wider mb-1 block">
                        Template
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {TEMPLATES.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTemplate(t.id)}
                                className={`px-3 py-2 text-xs rounded border transition-colors text-left ${template === t.id
                                    ? 'bg-violet-900/40 border-violet-700 text-violet-200'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                <div className="font-bold">{t.label}</div>
                                <div className="text-[9px] text-slate-500">{t.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={generateOutline}
                    disabled={loading || !topic.trim()}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Sparkles className="w-3 h-3" />
                    {loading ? 'Generating Outline...' : 'Generate Outline'}
                </button>

                {/* Outline Display */}
                {outline && (
                    <div className="space-y-3 border-t border-slate-700 pt-4">
                        <div className="text-sm font-bold text-slate-200">{outline.title}</div>

                        {outline.sections.map((section, index) => (
                            <div key={index} className="bg-slate-900 border border-slate-700 rounded p-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-slate-300">{section.heading}</div>
                                        <div className="text-[10px] text-slate-500 mt-1">{section.brief}</div>
                                    </div>
                                    {!section.expanded && (
                                        <button
                                            onClick={() => expandSection(index)}
                                            disabled={expandingSection === index}
                                            className="ml-2 px-2 py-1 bg-violet-900/40 hover:bg-violet-800/50 text-violet-200 text-[9px] rounded border border-violet-700/50 transition-colors disabled:opacity-50"
                                        >
                                            {expandingSection === index ? 'Expanding...' : 'Expand'}
                                        </button>
                                    )}
                                </div>

                                {section.content && (
                                    <div className="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-300 leading-relaxed">
                                        {section.content}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Export Panel */}
                        <div className="border-t border-slate-700 pt-3">
                            {/* Create Note - Primary Action */}
                            <button
                                onClick={createNoteFromArticle}
                                className="w-full mb-3 px-3 py-2.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-bold uppercase tracking-wider rounded border border-amber-600/50 transition-colors flex items-center justify-center gap-2"
                            >
                                <FileOutput className="w-4 h-4" />
                                Create Note from Article
                            </button>

                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Copy to Clipboard</div>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => copyToClipboard('markdown')}
                                    className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-1"
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    Markdown
                                </button>
                                <button
                                    onClick={() => copyToClipboard('linkedin')}
                                    className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-1"
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    LinkedIn
                                </button>
                                <button
                                    onClick={() => copyToClipboard('facebook')}
                                    className="px-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold uppercase tracking-wider rounded border border-slate-700 transition-colors flex items-center justify-center gap-1"
                                >
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    Facebook
                                </button>
                            </div>

                            {/* Teach Section */}
                            <div className="text-[9px] text-emerald-400 uppercase tracking-wider mt-4 mb-2 font-bold">Turn Into Teaching Material</div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => {
                                        if (!outline) return;
                                        const article = getFullArticle();
                                        const event = new CustomEvent('createCourseFromContent', {
                                            detail: {
                                                sourceNodeId: node.id,
                                                content: article,
                                                label: 'Course: ' + outline.title.substring(0, 30)
                                            }
                                        });
                                        window.dispatchEvent(event);
                                    }}
                                    className="px-2 py-2 bg-purple-900/20 hover:bg-purple-900/30 text-purple-300 text-[9px] font-bold uppercase tracking-wider rounded border border-purple-600/50 transition-colors flex items-center justify-center gap-1"
                                >
                                    <BookOpen className="w-3 h-3" />
                                    Create Course
                                </button>
                                <button
                                    onClick={() => {
                                        if (!outline) return;
                                        const article = getFullArticle();
                                        const event = new CustomEvent('createQuizFromContent', {
                                            detail: {
                                                sourceNodeId: node.id,
                                                content: article,
                                                label: 'Quiz: ' + outline.title.substring(0, 30)
                                            }
                                        });
                                        window.dispatchEvent(event);
                                    }}
                                    className="px-2 py-2 bg-blue-900/20 hover:bg-blue-900/30 text-blue-300 text-[9px] font-bold uppercase tracking-wider rounded border border-blue-600/50 transition-colors flex items-center justify-center gap-1"
                                >
                                    <HelpCircle className="w-3 h-3" />
                                    Create Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
