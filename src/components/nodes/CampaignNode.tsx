'use client';
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Megaphone, Calendar, Linkedin, Twitter, Instagram, Mail, DollarSign, Clock, CheckCircle2, Circle } from 'lucide-react';

// Platform configurations
const PLATFORMS = {
    linkedin: { icon: <Linkedin className="w-3 h-3" />, label: 'LinkedIn', color: '#0077b5' },
    twitter: { icon: <Twitter className="w-3 h-3" />, label: 'Twitter/X', color: '#1da1f2' },
    instagram: { icon: <Instagram className="w-3 h-3" />, label: 'Instagram', color: '#e4405f' },
    email: { icon: <Mail className="w-3 h-3" />, label: 'Email', color: '#6366f1' },
    ads: { icon: <DollarSign className="w-3 h-3" />, label: 'Ads', color: '#f97316' },
};

export interface CampaignPost {
    id: string;
    platform: 'linkedin' | 'twitter' | 'instagram' | 'email' | 'ads';
    content: string;
    scheduledAt?: string;
    status: 'draft' | 'scheduled' | 'published';
}

export interface CampaignNodeData {
    label?: string;
    campaignName?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    posts?: CampaignPost[];
    template?: 'product-launch' | 'content-series' | 'event-promotion' | 'awareness' | 'custom';
}

export default function CampaignNode({ data }: NodeProps) {
    const campaignData = data as CampaignNodeData;
    const posts = campaignData.posts || [];

    // Platform post counts
    const platformCounts = posts.reduce((acc, post) => {
        acc[post.platform] = (acc[post.platform] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Status counts
    const statusCounts = {
        draft: posts.filter(p => p.status === 'draft').length,
        scheduled: posts.filter(p => p.status === 'scheduled').length,
        published: posts.filter(p => p.status === 'published').length,
    };

    const completionRate = posts.length > 0
        ? Math.round((statusCounts.published / posts.length) * 100)
        : 0;

    return (
        <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-2 border-emerald-500/30 rounded-xl p-4 min-w-[280px] shadow-2xl backdrop-blur-sm">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-emerald-500" />

            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-bold text-slate-200">
                        {campaignData.campaignName || campaignData.label || 'New Campaign'}
                    </div>
                    {campaignData.template && (
                        <div className="text-[10px] text-emerald-400/70 mt-0.5 capitalize">
                            {campaignData.template.replace('-', ' ')}
                        </div>
                    )}
                </div>
            </div>

            {/* Date Range */}
            {(campaignData.startDate || campaignData.endDate) && (
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
                    <Calendar className="w-3 h-3 text-emerald-500" />
                    {campaignData.startDate && new Date(campaignData.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {campaignData.startDate && campaignData.endDate && ' → '}
                    {campaignData.endDate && new Date(campaignData.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
            )}

            {/* Platform Distribution */}
            {posts.length > 0 ? (
                <div className="mb-3">
                    <div className="flex flex-wrap gap-1 mb-2">
                        {Object.entries(platformCounts).map(([platform, count]) => {
                            const config = PLATFORMS[platform as keyof typeof PLATFORMS];
                            if (!config) return null;
                            return (
                                <span
                                    key={platform}
                                    className="text-[10px] px-2 py-1 rounded-full flex items-center gap-1"
                                    style={{
                                        backgroundColor: `${config.color}20`,
                                        color: config.color
                                    }}
                                >
                                    {config.icon}
                                    {count}
                                </span>
                            );
                        })}
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 text-right">
                        {completionRate}% published
                    </div>
                </div>
            ) : (
                <div className="p-4 rounded-lg bg-slate-900/30 border border-dashed border-slate-700 mb-3">
                    <div className="text-center">
                        <Calendar className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                        <div className="text-[10px] text-slate-500">
                            No posts planned yet
                        </div>
                    </div>
                </div>
            )}

            {/* Status Summary */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                        <Circle className="w-2.5 h-2.5 text-slate-500" />
                        {statusCounts.draft}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-amber-500" />
                        {statusCounts.scheduled}
                    </span>
                    <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                        {statusCounts.published}
                    </span>
                </div>
                <span>{posts.length} posts</span>
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500" />
        </div>
    );
}
