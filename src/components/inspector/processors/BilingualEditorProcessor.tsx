'use client';
import React, { useState, useEffect } from 'react';
import { Languages, ArrowRightLeft, Copy, Sparkles, CheckCircle } from 'lucide-react';
import { ProcessorProps } from './types';
import { useReactFlow } from '@xyflow/react';

type TargetLanguage = 'ms' | 'en';

export default function BilingualEditorProcessor({ node }: ProcessorProps) {
    const { setNodes } = useReactFlow();
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [targetLang, setTargetLang] = useState<TargetLanguage>('ms');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<'source' | 'translated' | null>(null);

    // Sync with node content
    useEffect(() => {
        if (node && (node.type === 'noteNode' || node.type === 'docNode')) {
            setSourceText((node.data.content as string) || '');
        }
    }, [node?.id, node?.data?.content]);

    if (!node) return null;

    const updateNodeContent = (newContent: string) => {
        setSourceText(newContent);
        setNodes((nodes) =>
            nodes.map((n) => {
                if (n.id === node.id) {
                    return {
                        ...n,
                        data: { ...n.data, content: newContent }
                    };
                }
                return n;
            })
        );
    };

    const handleTranslate = async () => {
        if (!sourceText.trim()) return;
        setLoading(true);

        try {
            const res = await fetch('/api/ai/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: sourceText,
                    targetLanguage: targetLang,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setTranslatedText(data.translatedText);
        } catch (error) {
            console.error('Translation error:', error);
            setTranslatedText('Translation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSwap = () => {
        const temp = sourceText;
        setSourceText(translatedText);
        setTranslatedText(temp);
        setTargetLang(targetLang === 'ms' ? 'en' : 'ms');
        updateNodeContent(translatedText);
    };

    const handleCopy = async (text: string, type: 'source' | 'translated') => {
        await navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const langLabel = (lang: TargetLanguage) => lang === 'ms' ? 'Bahasa Malaysia' : 'English';

    return (
        <div className="flex-1 flex flex-col min-h-0 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <Languages className="w-3 h-3" />
                Bilingual Editor
            </div>

            <div className="flex-1 flex flex-col space-y-3 min-h-0">
                {/* Source Pane */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                            {langLabel(targetLang === 'ms' ? 'en' : 'ms')} (Source)
                        </span>
                        <button
                            onClick={() => handleCopy(sourceText, 'source')}
                            className="text-slate-600 hover:text-slate-400 transition-colors"
                        >
                            {copied === 'source' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                    </div>
                    <textarea
                        className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 resize-none focus:outline-none focus:border-slate-600 transition-colors custom-scrollbar leading-relaxed min-h-[100px]"
                        placeholder="Enter text to translate..."
                        value={sourceText}
                        onChange={(e) => updateNodeContent(e.target.value)}
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleTranslate}
                        disabled={loading || !sourceText.trim()}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Sparkles className="w-3 h-3 animate-spin" />
                                Translating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3 h-3" />
                                Translate to {langLabel(targetLang)}
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleSwap}
                        disabled={!translatedText}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded border border-slate-700 transition-colors disabled:opacity-50"
                        title="Swap Languages"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                    </button>
                </div>

                {/* Target Language Selector */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setTargetLang('ms')}
                        className={`flex-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border transition-all ${targetLang === 'ms'
                            ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                            : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'
                            }`}
                    >
                        🇲🇾 Bahasa Malaysia
                    </button>
                    <button
                        onClick={() => setTargetLang('en')}
                        className={`flex-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border transition-all ${targetLang === 'en'
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                            : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'
                            }`}
                    >
                        🇬🇧 English
                    </button>
                </div>

                {/* Translated Pane */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                            {langLabel(targetLang)} (Translated)
                        </span>
                        <button
                            onClick={() => handleCopy(translatedText, 'translated')}
                            disabled={!translatedText}
                            className="text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-30"
                        >
                            {copied === 'translated' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                    </div>
                    <div className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 custom-scrollbar leading-relaxed min-h-[100px] overflow-y-auto">
                        {translatedText || (
                            <span className="text-slate-600 italic">
                                Translated text will appear here...
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
