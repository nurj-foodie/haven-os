'use client';
import React, { useState, useEffect } from 'react';
import { User, X, Save, Sparkles } from 'lucide-react';

interface UserProfile {
    name: string;
    role: string;
    industry: string;
    goals: string;
    writingStyle: string;
    languages: string[];
}

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSave?: (profile: UserProfile) => void;
}

const ROLE_OPTIONS = [
    'Content Creator',
    'Entrepreneur',
    'Marketer',
    'Educator',
    'Developer',
    'Designer',
    'Consultant',
    'Other'
];

const INDUSTRY_OPTIONS = [
    'Personal Development',
    'Technology',
    'Finance',
    'Marketing',
    'Education',
    'Health & Wellness',
    'E-commerce',
    'Creative Arts',
    'Other'
];

const WRITING_STYLE_OPTIONS = [
    'Casual & Conversational',
    'Professional & Formal',
    'Storyteller',
    'Educational',
    'Inspirational',
    'Technical'
];

export default function UserProfileModal({ isOpen, onClose, userId, onSave }: UserProfileModalProps) {
    const [profile, setProfile] = useState<UserProfile>({
        name: '',
        role: '',
        industry: '',
        goals: '',
        writingStyle: '',
        languages: ['English']
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch existing profile on mount
    useEffect(() => {
        if (isOpen && userId) {
            fetchProfile();
        }
    }, [isOpen, userId]);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/user/profile?userId=${userId}`);
            const data = await res.json();
            if (data.success && data.profile) {
                setProfile({
                    name: data.profile.name || '',
                    role: data.profile.role || '',
                    industry: data.profile.industry || '',
                    goals: data.profile.goals || '',
                    writingStyle: data.profile.writing_style || '',
                    languages: data.profile.languages || ['English']
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, profile })
            });
            const data = await res.json();
            if (data.success) {
                onSave?.(profile);
                onClose();
            }
        } catch (error) {
            console.error('Error saving profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-slate-200">Your Profile</div>
                            <div className="text-xs text-slate-500">Help Haven Intelligence know you better</div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center">
                        <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2 animate-pulse" />
                        <div className="text-sm text-slate-400">Loading profile...</div>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Your Name</label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                placeholder="How should Haven call you?"
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50"
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Your Role</label>
                            <select
                                value={profile.role}
                                onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500/50"
                            >
                                <option value="">Select your role...</option>
                                {ROLE_OPTIONS.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>

                        {/* Industry */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Your Industry/Niche</label>
                            <select
                                value={profile.industry}
                                onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500/50"
                            >
                                <option value="">Select your industry...</option>
                                {INDUSTRY_OPTIONS.map(industry => (
                                    <option key={industry} value={industry}>{industry}</option>
                                ))}
                            </select>
                        </div>

                        {/* Goals */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Your Goals</label>
                            <textarea
                                value={profile.goals}
                                onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                                placeholder="What are you trying to achieve? (e.g., Build thought leadership, grow audience, create courses)"
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 resize-none"
                            />
                        </div>

                        {/* Writing Style */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Preferred Writing Style</label>
                            <div className="grid grid-cols-2 gap-2">
                                {WRITING_STYLE_OPTIONS.map(style => (
                                    <button
                                        key={style}
                                        onClick={() => setProfile({ ...profile, writingStyle: style })}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${profile.writingStyle === style
                                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 border'
                                                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Languages */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Languages</label>
                            <div className="flex gap-2 flex-wrap">
                                {['English', 'Bahasa Malaysia'].map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => {
                                            const langs = profile.languages.includes(lang)
                                                ? profile.languages.filter(l => l !== lang)
                                                : [...profile.languages, lang];
                                            setProfile({ ...profile, languages: langs });
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${profile.languages.includes(lang)
                                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 border'
                                                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                                            }`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !profile.name}
                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Sparkles className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Profile
                                </>
                            )}
                        </button>

                        <div className="text-[10px] text-slate-600 text-center">
                            Haven will use this to personalize responses and suggestions
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
