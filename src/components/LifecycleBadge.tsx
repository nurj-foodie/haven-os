'use client';
import React from 'react';
import { Clock, Sparkles } from 'lucide-react';

interface LifecycleBadgeProps {
    createdAt: string;
    lifecycleState?: 'fresh' | 'aging' | 'archived';
}

export default function LifecycleBadge({ createdAt, lifecycleState }: LifecycleBadgeProps) {
    const created = new Date(createdAt);
    const now = new Date();
    const ageInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

    // Determine visual state
    const isFresh = ageInDays <= 7 || lifecycleState === 'fresh';
    const isAging = (ageInDays > 7 && ageInDays <= 30) || lifecycleState === 'aging';

    if (lifecycleState === 'archived') {
        return (
            <div className="flex items-center gap-1 text-[10px] text-slate-600">
                <Clock className="w-3 h-3" />
                <span>Archived</span>
            </div>
        );
    }

    if (isFresh) {
        return (
            <div className="flex items-center gap-1 text-[10px] text-yellow-500">
                <Sparkles className="w-3 h-3" />
                <span className="font-semibold">New</span>
            </div>
        );
    }

    if (isAging) {
        return (
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Clock className="w-3 h-3" />
                <span>{ageInDays}d old</span>
            </div>
        );
    }

    return null;
}
