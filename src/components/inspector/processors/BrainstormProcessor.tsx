'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Brain, Send, Zap, Search, Sparkles, Save } from 'lucide-react';
import { ProcessorProps } from './types';
import { useReactFlow, Node } from '@xyflow/react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function BrainstormProcessor({ node }: ProcessorProps) {
    const { setNodes, getNodes } = useReactFlow();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [deepResearch, setDeepResearch] = useState(false);
    const [reasoningMode, setReasoningMode] = useState(false);
    const messagesRef = useRef<Message[]>([]);

    // Keep messages ref updated for cleanup function
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Auto-save conversation memory on unmount (when user switches nodes)
    useEffect(() => {
        return () => {
            const currentMessages = messagesRef.current;
            if (currentMessages.length >= 2) { // At least one exchange
                (async () => {
                    try {
                        const storedUser = localStorage.getItem('supabase-user');
                        if (!storedUser) return;

                        const { id: userId } = JSON.parse(storedUser);
                        if (!userId) return;

                        // Create a simple summary from the conversation
                        const userMessages = currentMessages.filter(m => m.role === 'user').map(m => m.content);
                        const topics = userMessages.slice(0, 3).join('; ').substring(0, 200);
                        const keyTopics = userMessages.slice(0, 3).map(m => m.split(' ').slice(0, 5).join(' '));

                        await fetch('/api/haven/memory', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId,
                                sessionSummary: `Discussed: ${topics}...`,
                                keyTopics
                            })
                        });
                    } catch (e) {
                        // Silent fail for memory save
                    }
                })();
            }
        };
    }, []);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Build Haven-aware context with comprehensive feature knowledge
            let havenContext = `You are Haven Intelligence, the AI partner embedded in Haven OS — a spatial operating system for knowledge management and content creation. Think of yourself as JARVIS - a helpful, proactive assistant who knows the user's entire workspace AND all the powerful tools available to them.

## YOUR CURRENT STATE
- You are running inside Haven OS
- The user is working with ${node ? `a ${node.type}` : 'the Inspector'}
- Current node content: ${node?.data.content || node?.data.label || 'None'}

## HAVEN OS COMPLETE FEATURE REFERENCE

### 💡 THE CURATOR (Lifecycle Management)
| Feature | What It Does | How to Use |
|---------|--------------|------------|
| Staging Area | Catch-all for raw ideas and uploads | Type/paste into Staging, click ✨ to categorize |
| AI Categorization | Auto-title, summarize, and tag | Click sparkle button on any Staging item |
| Lifecycle Badges | Fresh (0-7d), Aging (7-30d), Auto-Archive (30d+) | Visual indicators on Vault items |
| Archive View | Toggle to see/restore archived items | Settings gear in Vault header |

### 📚 THE SCHOLAR (Learning System)
| Feature | What It Does | How to Use |
|---------|--------------|------------|
| Course Node | Container for learning modules | Drag 'Course' from Inspector → Canvas |
| Course Architect | AI generates course outlines | Select Course node → Generate in Inspector |
| Quiz Node | Interactive knowledge testing | Drag 'Quiz' from Inspector → Canvas |
| Quiz Master | AI generates mixed-format questions | Select Quiz node → Generate in Inspector |
| Mastery Tracking | 0-100% progress per course | Auto-calculated from quiz scores |

### ✍️ THE AUTHOR (Writing & Content)
| Feature | What It Does | How to Use |
|---------|--------------|------------|
| Bilingual Editor | English ↔ Bahasa Malaysia translation | Select Note → Bilingual tab |
| Ghostwriter | Dan Koe framework content generation | Select Note → Ghostwriter tab |
| Niche Tree | 3 core niches + sub-niches | Ghostwriter → Niche section |
| Pattern Decoder | Deconstruct viral content | Ghostwriter → Analyze tab |
| Article Builder | 4 templates with section expansion | Select Note → Article tab |
| Voice Profiles | Store writing samples per node | Article Builder → Voice section |
| Repurposing Engine | Transform content for platforms | Select Note → Repurpose tab |

**Article Templates:** How-To Guide, Thought Leadership, Case Study, Listicle
**Repurposing:** Tweet → Newsletter, Newsletter → Script, Platform Formatter

### 🏭 THE PRODUCER (Workflow Management)
| Feature | What It Does | How to Use |
|---------|--------------|------------|
| Workflow Node | Visual stage pipeline (idea → done) | Drag 'Workflow' from Inspector → Canvas |
| Progress Tracking | Completion percentages | Auto-calculated from stage status |
| Stage Management | Mark stages complete | Click checkboxes in Workflow Processor |

**Workflow Templates:** App Development, Digital Course, Content Launch

### 🎬 THE DIRECTOR (Video Production)
| Feature | What It Does | How to Use |
|---------|--------------|------------|
| Script Node | Video script container | Drag 'Script' from Director section → Canvas |
| Script Builder | AI story generation | Select Script → Generate with format/hook/voice |
| Format Presets | TikTok (30s), Reel (60s), YouTube Short (60s), YouTube Long (10m) | Script Processor dropdown |
| Hook Types | Question, Statement, Story, Shock | Script Processor buttons |
| Voice Styles | Casual, Professional, Energetic, Storyteller | Script Processor buttons |
| Storyboard Node | Visual scene breakdown | Drag 'Storyboard' from Director section → Canvas |
| Visual Styles | Cinematic, Minimalist, Dynamic, Sketch, Corporate | Storyboard Processor |
| Scene Cards | Framing, camera movement, duration | Auto-generated or manual |

### 📣 THE MARKETER (Marketing & Campaigns)
| Feature | What It Does | How to Use |
|---------|--------------|------------|
| Angle Generator | Marketing angle factory | Drag 'Angle Generator' from Marketer section → Canvas |
| 6 Angle Types | Pain Point, Benefit, Story, Authority, Urgency, Curiosity | Auto-generated by AI |
| Platform Targeting | LinkedIn, Twitter, Instagram, Email, Ads | Toggle buttons in Processor |
| Copy Variations | A/B testing ready | Click to copy any variation |
| Campaign Builder | Multi-platform rollout planning | Drag 'Campaign Builder' from Marketer section → Canvas |
| 4 Templates | Product Launch, Content Series, Event Promo, Brand Awareness | Click to apply in Processor |
| Post Scheduling | Datetime picker per post | Posts tab → Schedule input |
| Timeline View | Campaign overview by date | Timeline tab in Processor |

### 🧠 HAVEN INTELLIGENCE (That's You!)
| Feature | What It Does | How to Use |
|---------|--------------|------------|
| Contextual Chat | Talk about any selected node | Select node → Brainstorm tab |
| Deep Research | Web search integration via Tavily | Toggle 'Deep Research' before asking |
| Reasoning Mode | Chain-of-thought analysis | Toggle 'Reasoning' before asking |
| Multi-Node Synthesis | Combine selected nodes | Select multiple → Orchestrator |
| Save as Node | Preserve insights | Click 'Save as Node' after chat |

### 🔧 ADDITIONAL FEATURES
| Feature | What It Does |
|---------|--------------|
| Semantic Search | Conceptual search with embeddings |
| Link Previews | OpenGraph metadata display |
| Markdown Editor | Rich text in Note nodes |
| Transcription | Audio/Video → Text with Gemini |
| Content Calendar | Schedule posts and content |
| PDF Analysis | Extract and analyze documents |

## INSPECTOR SECTIONS (Right Panel)
1. **Scholar** - Course & Quiz nodes
2. **Author** - Writing tools
3. **Producer** - Workflow node
4. **Director** - Script & Storyboard nodes
5. **Marketer** - Angle & Campaign nodes

## WORKFLOW SUGGESTIONS
Based on user's current context, proactively suggest:
- Working with notes? → Suggest Ghostwriter, Article Builder, or Repurposing
- Multiple related notes? → Suggest Course creation or Batch Repurpose
- Product/launch content? → Suggest Angle Generator → Campaign Builder workflow
- Video ideas? → Suggest Script Builder → Storyboard workflow
- Learning content? → Suggest Course → Quiz → Mastery tracking

## PERSONALITY
- Speak naturally and warmly (like JARVIS, not a generic AI)
- Be proactive - suggest Haven features when relevant
- Guide users to the right tool for their needs
- Help organize and multiply their thinking
- Reference specific features by name when helpful

`;

            // Layer 2: Temporal Awareness - Add current date/time
            const now = new Date();
            const dateOptions: Intl.DateTimeFormatOptions = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            const formattedDate = now.toLocaleDateString('en-US', dateOptions);
            havenContext += `\n## TEMPORAL CONTEXT\nToday is ${formattedDate}.\n`;

            // Layer 1: Canvas Vision - Awareness of entire workspace
            const allNodes = getNodes();
            if (allNodes.length > 0) {
                // Count nodes by type
                const typeCounts: Record<string, number> = {};
                allNodes.forEach(n => {
                    const type = n.type || 'unknown';
                    typeCounts[type] = (typeCounts[type] || 0) + 1;
                });

                // Build type summary
                const typeSummary = Object.entries(typeCounts)
                    .map(([type, count]) => `${count} ${type.replace('Node', '')}(s)`)
                    .join(', ');

                // Find clusters (nodes with labels containing similar keywords)
                const labelWords: Record<string, string[]> = {};
                allNodes.forEach(n => {
                    const label = String(n.data.label || '').toLowerCase();
                    const words = label.split(/\s+/).filter(w => w.length > 3);
                    words.forEach(word => {
                        if (!labelWords[word]) labelWords[word] = [];
                        labelWords[word].push(String(n.data.label));
                    });
                });

                // Find potential clusters (words appearing in 2+ nodes)
                const clusters = Object.entries(labelWords)
                    .filter(([_, labels]) => labels.length >= 2)
                    .slice(0, 3)
                    .map(([word, labels]) => `"${word}" (${labels.length} nodes)`);

                // Recent nodes (show top 5 labels)
                const recentLabels = allNodes
                    .slice(0, 5)
                    .map(n => `- ${n.type?.replace('Node', '')}: "${String(n.data.label || 'Untitled').substring(0, 40)}"`)
                    .join('\n');

                havenContext += `\n## CANVAS VISION (Your Workspace)
Total nodes: ${allNodes.length}
Breakdown: ${typeSummary}
${clusters.length > 0 ? `Potential clusters: ${clusters.join(', ')}
` : ''}
Recent nodes:
${recentLabels}
`;
            } else {
                havenContext += `\n## CANVAS VISION\nThe canvas is empty. Suggest the user start by adding content from Staging or creating nodes.\n`;
            }



            // Fetch Vault metadata for awareness
            try {
                const vaultRes = await fetch('/api/vault');
                const vaultData = await vaultRes.json();
                if (vaultData.assets) {
                    const assetSummary = vaultData.assets.slice(0, 10).map((a: any) =>
                        `- ${a.type}: "${a.filename}"`
                    ).join('\n');
                    havenContext += `\nUSER'S VAULT (Recent 10 items):\n${assetSummary}\n`;
                }
            } catch (e) {
                // Vault fetch optional
            }

            // Layer 3: User Context - Fetch user profile for personalization
            try {
                // Get userId from localStorage (set during login)
                const storedUser = localStorage.getItem('supabase-user');
                if (storedUser) {
                    const { id: userId } = JSON.parse(storedUser);
                    if (userId) {
                        const profileRes = await fetch(`/api/user/profile?userId=${userId}`);
                        const profileData = await profileRes.json();
                        if (profileData.success && profileData.profile) {
                            const p = profileData.profile;
                            havenContext += `\n## USER CONTEXT (About the User)
Name: ${p.name || 'Not set'}
Role: ${p.role || 'Not set'}
Industry/Niche: ${p.industry || 'Not set'}
Goals: ${p.goals || 'Not set'}
Writing Style: ${p.writing_style || 'Not set'}
Languages: ${p.languages?.join(', ') || 'English'}

Address the user by their name when appropriate. Tailor suggestions to their role, industry, and goals.
`;
                        }
                    }
                }
            } catch (e) {
                // Profile fetch optional
            }

            // Layer 4: Persistent Memory - Fetch recent conversation memories
            try {
                const storedUser = localStorage.getItem('supabase-user');
                if (storedUser) {
                    const { id: userId } = JSON.parse(storedUser);
                    if (userId) {
                        const memoryRes = await fetch(`/api/haven/memory?userId=${userId}&limit=5`);
                        const memoryData = await memoryRes.json();
                        if (memoryData.success && memoryData.memories?.length > 0) {
                            const memoryContext = memoryData.memories
                                .map((m: any, i: number) => {
                                    const date = new Date(m.createdAt).toLocaleDateString();
                                    return `${i + 1}. [${date}] ${m.sessionSummary}${m.keyTopics?.length ? ` (Topics: ${m.keyTopics.join(', ')})` : ''}`;
                                })
                                .join('\n');
                            havenContext += `\n## PERSISTENT MEMORY (Past Conversations)
Recent interactions with this user:
${memoryContext}

Reference past conversations naturally when relevant. Build on previous discussions.
`;
                        }
                    }
                }
            } catch (e) {
                // Memory fetch optional
            }

            const response = await fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'brainstorm',
                    prompt: input,
                    context: havenContext,
                    useReasoningModel: reasoningMode,
                    deepResearch: deepResearch
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.text
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            console.error('Brainstorm error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: `Error: ${error.message}`
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveConversationAsNode = () => {
        if (messages.length === 0) return;

        // Combine all messages into a formatted conversation
        const conversationText = messages.map(msg =>
            `**${msg.role === 'user' ? 'Question' : 'Insight'}:**\n${msg.content}`
        ).join('\n\n---\n\n');

        const newNode: Node = {
            id: `noteNode-brainstorm-${Date.now()}`,
            type: 'noteNode',
            position: {
                x: (node?.position.x || 0) + 350,
                y: (node?.position.y || 0)
            },
            data: {
                label: 'Brainstorm Session',
                content: conversationText,
                metadata: {
                    source: 'brainstorm',
                    deepResearch,
                    reasoningMode,
                    messageCount: messages.length
                }
            }
        };

        setNodes((nds) => [...nds, newNode]);
    };

    const suggestedQuestions = node?.type === 'courseNode'
        ? [
            'What additional modules would enhance this course?',
            'How can I assess mastery of this topic?',
            'What in my Vault relates to this course?'
        ]
        : node?.type === 'noteNode'
            ? [
                'What are the key insights from this note?',
                'How does this connect to my other work?',
                'What should I create next based on this?'
            ]
            : [
                "What's in my Vault that I should revisit?",
                'Help me plan my content for this week',
                'What connections can you see in my workspace?'
            ];

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-200">Haven Intelligence</div>
                        <div className="text-[10px] text-slate-500">Your JARVIS for Knowledge</div>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={handleSaveConversationAsNode}
                        className="px-2 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 text-[9px] font-bold uppercase tracking-wider rounded border border-blue-800/50 flex items-center gap-1 transition-colors"
                        title="Save conversation as Note Node"
                    >
                        <Save className="w-3 h-3" />
                        Save as Node
                    </button>
                )}
            </div>

            {/* Toggles */}
            <div className="flex gap-2">
                <button
                    onClick={() => setDeepResearch(!deepResearch)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${deepResearch
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                >
                    <Search className="w-3 h-3" />
                    Deep Research
                </button>
                <button
                    onClick={() => setReasoningMode(!reasoningMode)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${reasoningMode
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                >
                    <Zap className="w-3 h-3" />
                    Reasoning
                </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
                {messages.length === 0 && (
                    <div className="text-center py-8">
                        <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <div className="text-xs text-slate-500">Start brainstorming...</div>
                        <div className="mt-4 space-y-2">
                            <div className="text-[10px] text-slate-600 uppercase font-bold">Suggested Questions</div>
                            {suggestedQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(q)}
                                    className="block w-full text-left px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-slate-300 hover:border-slate-700 transition-all"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`p-3 rounded-lg text-xs ${msg.role === 'user'
                            ? 'bg-blue-500/10 border border-blue-500/20 text-blue-200 ml-4'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 mr-4'
                            }`}
                    >
                        <div className="font-bold text-[10px] uppercase mb-1 opacity-60">
                            {msg.role === 'user' ? 'You' : 'Assistant'}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                ))}
                {isLoading && (
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-500 mr-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                            Thinking...
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Ask anything..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-all"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
