'use client';
import React, { useState, useMemo } from 'react';
import { Node, useReactFlow, useEdges, useNodes } from '@xyflow/react';
import {
    Megaphone, Calendar, Linkedin, Twitter, Instagram, Mail, DollarSign,
    ChevronDown, ChevronRight, Loader2, Plus, Trash2, Copy, Check,
    Clock, CheckCircle2, Circle, Rocket, BookOpen, Zap, Users, Sparkles
} from 'lucide-react';

interface ProcessorProps {
    node: Node | null;
}

// Platform configurations
const PLATFORMS = [
    { id: 'linkedin', icon: <Linkedin className="w-4 h-4" />, label: 'LinkedIn', color: '#0077b5' },
    { id: 'twitter', icon: <Twitter className="w-4 h-4" />, label: 'Twitter/X', color: '#1da1f2' },
    { id: 'instagram', icon: <Instagram className="w-4 h-4" />, label: 'Instagram', color: '#e4405f' },
    { id: 'email', icon: <Mail className="w-4 h-4" />, label: 'Email', color: '#6366f1' },
    { id: 'ads', icon: <DollarSign className="w-4 h-4" />, label: 'Ads', color: '#f97316' },
];

// Campaign templates
const TEMPLATES = [
    {
        id: 'product-launch',
        icon: <Rocket className="w-4 h-4" />,
        label: 'Product Launch',
        color: '#8b5cf6',
        description: 'Teaser → Announcement → Features → Social Proof',
        posts: [
            { platform: 'twitter', day: -7, content: 'Coming soon teaser' },
            { platform: 'linkedin', day: 0, content: 'Launch announcement' },
            { platform: 'instagram', day: 0, content: 'Visual reveal' },
            { platform: 'email', day: 0, content: 'Launch email' },
            { platform: 'twitter', day: 1, content: 'Feature highlight 1' },
            { platform: 'twitter', day: 3, content: 'Feature highlight 2' },
            { platform: 'linkedin', day: 7, content: 'Customer testimonial' },
        ]
    },
    {
        id: 'content-series',
        icon: <BookOpen className="w-4 h-4" />,
        label: 'Content Series',
        color: '#06b6d4',
        description: 'Educational thread across 5 days',
        posts: [
            { platform: 'twitter', day: 0, content: 'Day 1: Introduction' },
            { platform: 'linkedin', day: 0, content: 'Long-form intro' },
            { platform: 'twitter', day: 1, content: 'Day 2: Deep dive' },
            { platform: 'twitter', day: 2, content: 'Day 3: Examples' },
            { platform: 'twitter', day: 3, content: 'Day 4: Tips & tricks' },
            { platform: 'twitter', day: 4, content: 'Day 5: Summary & CTA' },
            { platform: 'email', day: 4, content: 'Newsletter recap' },
        ]
    },
    {
        id: 'event-promotion',
        icon: <Calendar className="w-4 h-4" />,
        label: 'Event Promotion',
        color: '#ec4899',
        description: 'Countdown → Live → Recap',
        posts: [
            { platform: 'linkedin', day: -14, content: 'Save the date' },
            { platform: 'email', day: -7, content: 'Early bird reminder' },
            { platform: 'twitter', day: -3, content: 'Countdown begins' },
            { platform: 'instagram', day: -1, content: 'Tomorrow teaser' },
            { platform: 'twitter', day: 0, content: 'We are live!' },
            { platform: 'linkedin', day: 1, content: 'Event recap' },
            { platform: 'email', day: 2, content: 'Thank you + resources' },
        ]
    },
    {
        id: 'awareness',
        icon: <Users className="w-4 h-4" />,
        label: 'Brand Awareness',
        color: '#f59e0b',
        description: 'Consistent multi-platform presence',
        posts: [
            { platform: 'linkedin', day: 0, content: 'Expert insight' },
            { platform: 'twitter', day: 1, content: 'Quick tip' },
            { platform: 'instagram', day: 2, content: 'Behind the scenes' },
            { platform: 'twitter', day: 3, content: 'Industry news react' },
            { platform: 'linkedin', day: 4, content: 'Thought leadership' },
            { platform: 'instagram', day: 5, content: 'User spotlight' },
            { platform: 'twitter', day: 6, content: 'Weekly roundup' },
        ]
    },
];

interface CampaignPost {
    id: string;
    platform: string;
    content: string;
    scheduledAt?: string;
    status: 'draft' | 'scheduled' | 'published';
}

export default function CampaignProcessor({ node }: ProcessorProps) {
    const { setNodes } = useReactFlow();
    const edges = useEdges();
    const nodes = useNodes();
    const [activeTab, setActiveTab] = useState<'setup' | 'posts' | 'timeline'>('setup');
    const [isGenerating, setIsGenerating] = useState(false);
    const [expandedPost, setExpandedPost] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    if (!node) return null;

    const nodeData = node.data as {
        label?: string;
        campaignName?: string;
        description?: string;
        startDate?: string;
        endDate?: string;
        posts?: CampaignPost[];
        template?: string;
    };

    const posts = nodeData.posts || [];

    // Find connected angle nodes for content
    const connectedAngleNodes = useMemo(() => {
        const incomingEdges = edges.filter(e => e.target === node.id);
        return incomingEdges
            .map(e => nodes.find(n => n.id === e.source && n.type === 'angleNode'))
            .filter(Boolean) as Node[];
    }, [edges, nodes, node.id]);

    const updateNodeData = (updates: Partial<typeof nodeData>) => {
        setNodes((nds) =>
            nds.map((n) =>
                n.id === node.id
                    ? { ...n, data: { ...n.data, ...updates } }
                    : n
            )
        );
    };

    const handleApplyTemplate = (template: typeof TEMPLATES[0]) => {
        const startDate = nodeData.startDate || new Date().toISOString().split('T')[0];
        const baseDate = new Date(startDate);

        const generatedPosts: CampaignPost[] = template.posts.map((p, i) => {
            const postDate = new Date(baseDate);
            postDate.setDate(postDate.getDate() + p.day);

            return {
                id: `post-${Date.now()}-${i}`,
                platform: p.platform,
                content: p.content,
                scheduledAt: postDate.toISOString(),
                status: 'draft' as const
            };
        });

        // Calculate end date
        const maxDay = Math.max(...template.posts.map(p => p.day));
        const endDate = new Date(baseDate);
        endDate.setDate(endDate.getDate() + maxDay);

        updateNodeData({
            template: template.id as typeof nodeData.template,
            posts: generatedPosts,
            endDate: endDate.toISOString().split('T')[0]
        });

        setActiveTab('posts');
    };

    const handleAddPost = (platform: string) => {
        const newPost: CampaignPost = {
            id: `post-${Date.now()}`,
            platform,
            content: '',
            status: 'draft'
        };
        updateNodeData({ posts: [...posts, newPost] });
        setExpandedPost(newPost.id);
    };

    const handleUpdatePost = (postId: string, updates: Partial<CampaignPost>) => {
        updateNodeData({
            posts: posts.map(p => p.id === postId ? { ...p, ...updates } : p)
        });
    };

    const handleDeletePost = (postId: string) => {
        updateNodeData({
            posts: posts.filter(p => p.id !== postId)
        });
    };

    const handleCopy = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleGenerateFromAngles = async () => {
        if (connectedAngleNodes.length === 0) return;
        setIsGenerating(true);

        try {
            // Get angles from connected nodes
            const allAngles = connectedAngleNodes.flatMap(n => {
                const data = n.data as { angles?: Array<{ title: string; hook: string; variations: Array<{ copy: string }> }> };
                return data.angles || [];
            });

            // Create posts from angle variations
            const generatedPosts: CampaignPost[] = [];
            const platformsToUse = ['linkedin', 'twitter', 'instagram'];

            allAngles.slice(0, 4).forEach((angle, i) => {
                platformsToUse.forEach((platform, j) => {
                    const variation = angle.variations?.[j % angle.variations.length];
                    if (variation) {
                        generatedPosts.push({
                            id: `post-${Date.now()}-${i}-${j}`,
                            platform,
                            content: variation.copy || angle.hook,
                            status: 'draft'
                        });
                    }
                });
            });

            updateNodeData({ posts: [...posts, ...generatedPosts] });
            setActiveTab('posts');
        } finally {
            setIsGenerating(false);
        }
    };

    // Group posts by date for timeline
    const postsByDate = useMemo(() => {
        const grouped: Record<string, CampaignPost[]> = {};
        posts.forEach(post => {
            const date = post.scheduledAt
                ? new Date(post.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Unscheduled';
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(post);
        });
        return grouped;
    }, [posts]);

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <Megaphone className="w-3 h-3 text-emerald-400" />
                Campaign Builder
            </div>

            {/* Context Badge */}
            <div className="text-[10px] text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
                <span className="text-emerald-400">{nodeData.campaignName || nodeData.label || 'Untitled'}</span>
                <span className="text-slate-600"> • campaignNode</span>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                    onClick={() => setActiveTab('setup')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'setup'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Setup
                </button>
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'posts'
                            ? 'bg-teal-600 text-white'
                            : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Posts ({posts.length})
                </button>
                <button
                    onClick={() => setActiveTab('timeline')}
                    className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${activeTab === 'timeline'
                            ? 'bg-cyan-600 text-white'
                            : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800'
                        }`}
                >
                    Timeline
                </button>
            </div>

            {/* Setup Tab */}
            {activeTab === 'setup' && (
                <div className="space-y-4">
                    {/* Campaign Name */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                            Campaign Name
                        </label>
                        <input
                            type="text"
                            value={nodeData.campaignName || ''}
                            onChange={(e) => updateNodeData({ campaignName: e.target.value })}
                            placeholder="e.g., Q1 Product Launch..."
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                        />
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={nodeData.startDate || ''}
                                onChange={(e) => updateNodeData({ startDate: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={nodeData.endDate || ''}
                                onChange={(e) => updateNodeData({ endDate: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                            />
                        </div>
                    </div>

                    {/* Templates */}
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">
                            Campaign Templates
                        </label>
                        <div className="space-y-2">
                            {TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => handleApplyTemplate(template)}
                                    className={`w-full p-3 rounded-xl border text-left transition-all hover:scale-[1.01] ${nodeData.template === template.id
                                            ? 'border-emerald-500/50'
                                            : 'border-slate-700 hover:border-slate-600'
                                        }`}
                                    style={{
                                        backgroundColor: nodeData.template === template.id
                                            ? `${template.color}15`
                                            : 'rgb(15, 23, 42)'
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${template.color}20`, color: template.color }}
                                        >
                                            {template.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-200">{template.label}</div>
                                            <div className="text-[10px] text-slate-500">{template.description}</div>
                                        </div>
                                        <span className="text-[10px] text-slate-500">
                                            {template.posts.length} posts
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate from Angles */}
                    {connectedAngleNodes.length > 0 && (
                        <button
                            onClick={handleGenerateFromAngles}
                            disabled={isGenerating}
                            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            Generate from {connectedAngleNodes.length} Angle Node(s)
                        </button>
                    )}
                </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
                <div className="space-y-3">
                    {/* Add Post Buttons */}
                    <div className="flex flex-wrap gap-1">
                        {PLATFORMS.map((platform) => (
                            <button
                                key={platform.id}
                                onClick={() => handleAddPost(platform.id)}
                                className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900 transition-all"
                                style={{ color: platform.color }}
                            >
                                {platform.icon}
                                <Plus className="w-3 h-3" />
                            </button>
                        ))}
                    </div>

                    {/* Posts List */}
                    {posts.length === 0 ? (
                        <div className="p-6 bg-slate-900/30 rounded-xl border border-dashed border-slate-700 text-center">
                            <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <div className="text-sm text-slate-500 mb-1">No posts yet</div>
                            <div className="text-[10px] text-slate-600">Apply a template or add posts manually</div>
                        </div>
                    ) : (
                        posts.map((post) => {
                            const platform = PLATFORMS.find(p => p.id === post.platform);
                            const isExpanded = expandedPost === post.id;

                            return (
                                <div
                                    key={post.id}
                                    className="rounded-xl border overflow-hidden transition-all"
                                    style={{
                                        backgroundColor: platform ? `${platform.color}08` : 'transparent',
                                        borderColor: platform ? `${platform.color}30` : 'rgb(51, 65, 85)'
                                    }}
                                >
                                    {/* Post Header */}
                                    <button
                                        onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                                        className="w-full p-3 flex items-center gap-3 text-left"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{
                                                backgroundColor: platform ? `${platform.color}20` : 'rgb(51, 65, 85)',
                                                color: platform?.color || 'white'
                                            }}
                                        >
                                            {platform?.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm text-slate-300 line-clamp-1">
                                                {post.content || 'Empty post...'}
                                            </div>
                                            <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                                {post.scheduledAt && (
                                                    <span>{new Date(post.scheduledAt).toLocaleDateString()}</span>
                                                )}
                                                <span className={`px-1.5 py-0.5 rounded ${post.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        post.status === 'scheduled' ? 'bg-amber-500/20 text-amber-400' :
                                                            'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    {post.status}
                                                </span>
                                            </div>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-slate-500" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-slate-500" />
                                        )}
                                    </button>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="px-3 pb-3 space-y-3">
                                            <textarea
                                                value={post.content}
                                                onChange={(e) => handleUpdatePost(post.id, { content: e.target.value })}
                                                placeholder="Write your post content..."
                                                rows={4}
                                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                                            />

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] text-slate-500 block mb-1">Schedule</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={post.scheduledAt?.slice(0, 16) || ''}
                                                        onChange={(e) => handleUpdatePost(post.id, {
                                                            scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                                                            status: e.target.value ? 'scheduled' : 'draft'
                                                        })}
                                                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-slate-500 block mb-1">Status</label>
                                                    <select
                                                        value={post.status}
                                                        onChange={(e) => handleUpdatePost(post.id, { status: e.target.value as CampaignPost['status'] })}
                                                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200"
                                                    >
                                                        <option value="draft">Draft</option>
                                                        <option value="scheduled">Scheduled</option>
                                                        <option value="published">Published</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleCopy(post.content, post.id)}
                                                    className="flex-1 py-2 text-xs text-slate-400 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                                                >
                                                    {copiedId === post.id ? (
                                                        <Check className="w-3 h-3 text-emerald-400" />
                                                    ) : (
                                                        <Copy className="w-3 h-3" />
                                                    )}
                                                    Copy
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="py-2 px-3 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
                <div className="space-y-3">
                    {Object.keys(postsByDate).length === 0 ? (
                        <div className="p-6 bg-slate-900/30 rounded-xl border border-dashed border-slate-700 text-center">
                            <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <div className="text-sm text-slate-500">No posts scheduled</div>
                        </div>
                    ) : (
                        Object.entries(postsByDate).map(([date, datePosts]) => (
                            <div key={date} className="space-y-2">
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    {date}
                                    <span className="text-slate-600">({datePosts.length})</span>
                                </div>
                                <div className="pl-4 border-l-2 border-slate-700 space-y-2">
                                    {datePosts.map((post) => {
                                        const platform = PLATFORMS.find(p => p.id === post.platform);
                                        return (
                                            <div
                                                key={post.id}
                                                className="p-2 rounded-lg flex items-start gap-2"
                                                style={{
                                                    backgroundColor: platform ? `${platform.color}10` : 'transparent'
                                                }}
                                            >
                                                <div style={{ color: platform?.color }}>
                                                    {platform?.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-slate-300 line-clamp-2">{post.content}</div>
                                                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                                                        {post.status === 'published' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                                        {post.status === 'scheduled' && <Clock className="w-3 h-3 text-amber-500" />}
                                                        {post.status === 'draft' && <Circle className="w-3 h-3 text-slate-500" />}
                                                        {post.status}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
