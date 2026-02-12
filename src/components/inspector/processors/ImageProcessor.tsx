'use client';
import React, { useState } from 'react';
import { MessageSquare, Send, FileText } from 'lucide-react';
import { ProcessorProps } from './types';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ImageProcessor({ node }: ProcessorProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // Clear chat when node changes
    React.useEffect(() => {
        setMessages([]);
        setInput('');
    }, [node?.id]);

    const handleSend = async () => {
        if (!input.trim() || !node) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const publicUrl = node.data.url as string;

            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: publicUrl,
                    userPrompt: userMsg
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Analysis failed');

            setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);

        } catch (error: any) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    const saveAsNote = () => {
        if (messages.length === 0 || !node) return;

        // Format conversation
        const transcript = messages
            .map(m => `**${m.role === 'user' ? 'You' : 'Gemini'}:** ${m.content}`)
            .join('\n\n');

        const noteContent = `# Image Analysis: ${node.data.label}\n\n${transcript}`;

        // Dispatch event to create note
        const event = new CustomEvent('createNoteFromChat', {
            detail: {
                content: noteContent,
                sourceNodeId: node.id,
                label: `Analysis: ${node.data.label || 'Image'}`
            }
        });
        window.dispatchEvent(event);

        // Clear chat after saving
        setMessages([]);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <MessageSquare className="w-3 h-3" />
                    Chat with Image
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={saveAsNote}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-bold uppercase rounded transition-colors"
                    >
                        <FileText className="w-3 h-3" />
                        Save as Note
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-3 space-y-3 custom-scrollbar pr-2">
                {messages.length === 0 && (
                    <div className="text-xs text-slate-700 italic text-center mt-4">
                        Ask Gemini about this image...
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`text-xs p-2 rounded-lg ${m.role === 'user' ? 'bg-slate-800 text-slate-200 ml-4' : 'bg-yellow-500/10 text-yellow-500 mr-4'}`}>
                        {m.content}
                    </div>
                ))}
                {loading && (
                    <div className="text-xs text-slate-600 animate-pulse ml-2">Thinking...</div>
                )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
                <input
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-yellow-500/50"
                    placeholder="Ask a question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="p-1.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded disabled:opacity-50"
                >
                    <Send className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
