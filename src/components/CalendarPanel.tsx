'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Clock, FileText, Image, Video, Mic } from 'lucide-react';

interface ScheduledAsset {
    id: string;
    type: string;
    filename: string;
    scheduled_at: string;
    publication_status: 'draft' | 'scheduled' | 'published';
    metadata?: any;
}

interface CalendarPanelProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
}

export default function CalendarPanel({ isOpen, onClose, userId }: CalendarPanelProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [scheduledAssets, setScheduledAssets] = useState<ScheduledAsset[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

    // Fetch scheduled assets
    useEffect(() => {
        if (!isOpen) return;

        const fetchScheduled = async () => {
            setIsLoading(true);
            try {
                const startDate = new Date(currentDate);
                startDate.setDate(1);
                const endDate = new Date(currentDate);
                endDate.setMonth(endDate.getMonth() + 1);
                endDate.setDate(0);

                const params = new URLSearchParams({
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                });

                if (userId) {
                    params.append('userId', userId);
                }

                const res = await fetch(`/api/assets/schedule?${params}`);
                const data = await res.json();
                setScheduledAssets(data.scheduledAssets || []);
            } catch (error) {
                console.error('Failed to fetch scheduled assets:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchScheduled();
    }, [isOpen, currentDate, userId]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'image': return <Image className="w-3 h-3" />;
            case 'video': return <Video className="w-3 h-3" />;
            case 'audio': return <Mic className="w-3 h-3" />;
            default: return <FileText className="w-3 h-3" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-green-500/20 border-green-500/50 text-green-300';
            case 'scheduled': return 'bg-amber-500/20 border-amber-500/50 text-amber-300';
            default: return 'bg-slate-700 border-slate-600 text-slate-300';
        }
    };

    // Generate week days
    const getWeekDays = () => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            days.push(day);
        }
        return days;
    };

    // Get assets for a specific day
    const getAssetsForDay = (date: Date) => {
        return scheduledAssets.filter(asset => {
            const assetDate = new Date(asset.scheduled_at);
            return assetDate.toDateString() === date.toDateString();
        });
    };

    const weekDays = getWeekDays();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-200">Content Calendar</h2>
                            <p className="text-xs text-slate-500">View & manage scheduled content</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <button
                        onClick={() => {
                            const newDate = new Date(currentDate);
                            newDate.setDate(newDate.getDate() - 7);
                            setCurrentDate(newDate);
                        }}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <div className="text-center">
                        <div className="text-sm font-bold text-slate-200">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-slate-500">
                            Week of {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const newDate = new Date(currentDate);
                            newDate.setDate(newDate.getDate() + 7);
                            setCurrentDate(newDate);
                        }}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-2">
                            {/* Day Headers */}
                            {dayNames.map(day => (
                                <div key={day} className="text-center text-xs font-bold text-slate-500 uppercase pb-2">
                                    {day}
                                </div>
                            ))}

                            {/* Day Cells */}
                            {weekDays.map((day, idx) => {
                                const dayAssets = getAssetsForDay(day);
                                const isToday = day.toDateString() === new Date().toDateString();

                                return (
                                    <div
                                        key={idx}
                                        className={`min-h-[120px] p-2 rounded-lg border transition-colors ${isToday
                                                ? 'bg-amber-500/10 border-amber-500/30'
                                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className={`text-sm font-bold mb-2 ${isToday ? 'text-amber-400' : 'text-slate-400'
                                            }`}>
                                            {day.getDate()}
                                        </div>

                                        <div className="space-y-1">
                                            {dayAssets.slice(0, 3).map(asset => (
                                                <div
                                                    key={asset.id}
                                                    className={`p-1.5 rounded border text-[10px] truncate flex items-center gap-1 ${getStatusColor(asset.publication_status)}`}
                                                >
                                                    {getTypeIcon(asset.type)}
                                                    <span className="truncate">{asset.filename}</span>
                                                </div>
                                            ))}
                                            {dayAssets.length > 3 && (
                                                <div className="text-[10px] text-slate-500 text-center">
                                                    +{dayAssets.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Legend */}
                <div className="px-4 py-3 border-t border-slate-800 flex items-center gap-4">
                    <div className="text-xs text-slate-500">Status:</div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                        <span className="text-xs text-slate-400">Draft</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-xs text-slate-400">Scheduled</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-slate-400">Published</span>
                    </div>
                    <div className="ml-auto text-xs text-slate-600">
                        {scheduledAssets.length} items scheduled
                    </div>
                </div>
            </div>
        </div>
    );
}
