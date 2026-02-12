'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Send, CheckCircle, Edit3, AlertCircle } from 'lucide-react';
import { ProcessorProps } from './types';

type PublicationStatus = 'draft' | 'scheduled' | 'published';

interface ScheduleData {
    scheduledAt: string | null;
    status: PublicationStatus;
}

export default function CalendarProcessor({ node }: ProcessorProps) {
    const [scheduleData, setScheduleData] = useState<ScheduleData>({
        scheduledAt: null,
        status: 'draft'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // Load existing schedule data from node metadata
    useEffect(() => {
        if (node?.data?.metadata) {
            const meta = node.data.metadata as any;
            setScheduleData({
                scheduledAt: meta.scheduled_at || null,
                status: meta.publication_status || 'draft'
            });
        }
    }, [node]);

    const handleSave = async () => {
        if (!node) return;
        setIsSaving(true);
        setSaveMessage('');

        try {
            // Get asset_id from node metadata
            const assetId = (node.data.metadata as any)?.id || (node.data as any).assetId;

            if (!assetId) {
                // For nodes without asset_id, save to localStorage
                const savedSchedules = JSON.parse(localStorage.getItem('haven_schedules') || '{}');
                savedSchedules[node.id] = scheduleData;
                localStorage.setItem('haven_schedules', JSON.stringify(savedSchedules));
                setSaveMessage('Saved locally');
                return;
            }

            // Update asset in database
            const response = await fetch('/api/assets/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assetId,
                    scheduledAt: scheduleData.scheduledAt,
                    publicationStatus: scheduleData.status
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save schedule');
            }

            setSaveMessage('Saved!');
        } catch (error: any) {
            console.error('Schedule save error:', error);
            setSaveMessage('Error saving');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 2000);
        }
    };

    const statusConfig = {
        draft: { color: 'slate', icon: Edit3, label: 'Draft' },
        scheduled: { color: 'amber', icon: Clock, label: 'Scheduled' },
        published: { color: 'green', icon: CheckCircle, label: 'Published' }
    };

    const currentStatus = statusConfig[scheduleData.status];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                </div>
                <div>
                    <div className="text-sm font-bold text-slate-200">Content Calendar</div>
                    <div className="text-[10px] text-slate-500">Schedule & Publish</div>
                </div>
            </div>

            {/* Current Status Badge */}
            <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg">
                <span className="text-xs text-slate-400">Status</span>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${scheduleData.status === 'draft' ? 'bg-slate-700 text-slate-300' :
                        scheduleData.status === 'scheduled' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-green-500/20 text-green-300'
                    }`}>
                    <currentStatus.icon className="w-3 h-3" />
                    {currentStatus.label}
                </div>
            </div>

            {/* Date/Time Picker */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Schedule For
                </label>
                <input
                    type="datetime-local"
                    value={scheduleData.scheduledAt || ''}
                    onChange={(e) => setScheduleData(prev => ({
                        ...prev,
                        scheduledAt: e.target.value || null,
                        status: e.target.value ? 'scheduled' : 'draft'
                    }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
            </div>

            {/* Status Toggle */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Publication Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {(['draft', 'scheduled', 'published'] as PublicationStatus[]).map((status) => {
                        const config = statusConfig[status];
                        const isActive = scheduleData.status === status;
                        return (
                            <button
                                key={status}
                                onClick={() => setScheduleData(prev => ({ ...prev, status }))}
                                className={`p-2 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 ${isActive
                                        ? status === 'draft' ? 'bg-slate-700 border-slate-600 text-slate-200' :
                                            status === 'scheduled' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' :
                                                'bg-green-500/20 border-green-500/50 text-green-300'
                                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                    }`}
                            >
                                <config.icon className="w-4 h-4" />
                                {config.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Scheduled Date Display */}
            {scheduleData.scheduledAt && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="text-[10px] text-amber-400 uppercase font-bold mb-1">Scheduled For</div>
                    <div className="text-sm text-amber-200">
                        {new Date(scheduleData.scheduledAt).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })}
                    </div>
                </div>
            )}

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-600 text-black font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
                {isSaving ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                    <Send className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Schedule'}
            </button>

            {/* Save Message */}
            {saveMessage && (
                <div className={`text-center text-xs ${saveMessage.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                    {saveMessage}
                </div>
            )}

            {/* Quick Actions */}
            <div className="pt-3 border-t border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Quick Schedule</div>
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: 'Tomorrow 9am', hours: 24 + 9 },
                        { label: 'Next Monday', hours: 168 },
                        { label: 'In 1 hour', hours: 1 }
                    ].map((quick) => (
                        <button
                            key={quick.label}
                            onClick={() => {
                                const date = new Date();
                                date.setHours(date.getHours() + quick.hours);
                                if (quick.label === 'Tomorrow 9am') {
                                    date.setDate(date.getDate() + 1);
                                    date.setHours(9, 0, 0, 0);
                                } else if (quick.label === 'Next Monday') {
                                    const day = date.getDay();
                                    const daysUntilMonday = day === 0 ? 1 : 8 - day;
                                    date.setDate(date.getDate() + daysUntilMonday);
                                    date.setHours(9, 0, 0, 0);
                                }
                                const formatted = date.toISOString().slice(0, 16);
                                setScheduleData(prev => ({
                                    ...prev,
                                    scheduledAt: formatted,
                                    status: 'scheduled'
                                }));
                            }}
                            className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all"
                        >
                            {quick.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
