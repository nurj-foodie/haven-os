'use client';
import React, { useCallback, useState, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    ReactFlowProvider,
    useReactFlow,
    useOnSelectionChange,
    Node,
    SelectionMode,
    PanOnScrollMode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ImageNode from './nodes/ImageNode';
import AINode from './nodes/AINode';
import NoteNode from './nodes/NoteNode';
import LinkNode from './nodes/LinkNode';
import DocNode from './nodes/DocNode';
import AudioNode from './nodes/AudioNode';
import VideoNode from './nodes/VideoNode';
import CourseNode from './nodes/CourseNode';
import QuizNode from './nodes/QuizNode';
import WorkflowNode from './nodes/WorkflowNode';
import ScriptNode from './nodes/ScriptNode';
import StoryboardNode from './nodes/StoryboardNode';
import AngleNode from './nodes/AngleNode';
import CampaignNode from './nodes/CampaignNode';
import ProductionNode from './nodes/ProductionNode';
import CustomEdge from './edges/CustomEdge';

import { analyzeImage } from '@/app/actions';
import { extractDocumentContent } from '@/lib/documentExtractor';

interface CanvasProps {
    onSelectionChange?: (nodes: Node[]) => void;
    onNodesDelete?: (nodes: Node[]) => void;
    deletedAssetId?: string | null;
}

function Canvas({ onSelectionChange, onNodesDelete, deletedAssetId }: CanvasProps) {
    // ... constants ...
    const nodeTypes = React.useMemo(() => ({
        imageNode: ImageNode,
        aiNode: AINode,
        noteNode: NoteNode,
        linkNode: LinkNode,
        docNode: DocNode,
        audioNode: AudioNode,
        videoNode: VideoNode,
        courseNode: CourseNode,
        quizNode: QuizNode,
        workflowNode: WorkflowNode,
        scriptNode: ScriptNode,
        storyboardNode: StoryboardNode,
        angleNode: AngleNode,
        campaignNode: CampaignNode,
        productionNode: ProductionNode,
    }), []);

    const edgeTypes = React.useMemo(() => ({
        default: CustomEdge,
    }), []);
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { screenToFlowPosition } = useReactFlow();

    // 1. LOAD FROM LOCALSTORAGE
    useEffect(() => {
        const savedNodes = localStorage.getItem('haven-nodes');
        const savedEdges = localStorage.getItem('haven-edges');

        if (savedNodes) {
            try {
                setNodes(JSON.parse(savedNodes));
            } catch (e) {
                console.error("Failed to parse saved nodes", e);
            }
        }
        if (savedEdges) {
            try {
                setEdges(JSON.parse(savedEdges));
            } catch (e) {
                console.error("Failed to parse saved edges", e);
            }
        }
    }, [setNodes, setEdges]);

    // 2. SAVE TO LOCALSTORAGE
    useEffect(() => {
        if (nodes.length > 0) {
            localStorage.setItem('haven-nodes', JSON.stringify(nodes));
        } else if (localStorage.getItem('haven-nodes')) {
            // If nodes is empty but was saved, check if we should clear it
            localStorage.setItem('haven-nodes', JSON.stringify([]));
        }

        if (edges.length > 0) {
            localStorage.setItem('haven-edges', JSON.stringify(edges));
        } else if (localStorage.getItem('haven-edges')) {
            localStorage.setItem('haven-edges', JSON.stringify([]));
        }
    }, [nodes, edges]);

    // Handle quiz node updates from QuizProcessor
    useEffect(() => {
        const handleQuizNodeUpdate = (event: CustomEvent) => {
            const { nodeId, performance, quizData, clearSource } = event.detail;
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === nodeId
                        ? {
                            ...n,
                            data: {
                                ...n.data,
                                metadata: {
                                    ...(typeof n.data.metadata === 'object' && n.data.metadata !== null ? n.data.metadata : {}),
                                    ...(performance && { performance }),
                                    ...(quizData && { quizData }),
                                    ...(clearSource && { sourceContent: undefined }),
                                },
                            },
                        }
                        : n
                )
            );
        };

        window.addEventListener('updateQuizNode', handleQuizNodeUpdate as EventListener);
        return () => {
            window.removeEventListener('updateQuizNode', handleQuizNodeUpdate as EventListener);
        };
    }, [setNodes]);

    // Handle creating notes from image chat
    useEffect(() => {
        const handleCreateNote = (event: CustomEvent) => {
            const { content, sourceNodeId, label } = event.detail;

            // Find source node position to place new note nearby
            const sourceNode = nodes.find(n => n.id === sourceNodeId);
            const basePosition = sourceNode?.position || { x: 400, y: 400 };

            const newNote = {
                id: `noteNode-${Date.now()}`,
                type: 'noteNode',
                position: { x: basePosition.x + 250, y: basePosition.y },
                data: { content, label }
            };

            setNodes((nds) => [...nds, newNote]);

            // Auto-connect to source
            const newEdge = {
                id: `edge-${sourceNodeId}-${newNote.id}`,
                source: sourceNodeId,
                target: newNote.id
            };
            setEdges((eds) => [...eds, newEdge]);
        };

        window.addEventListener('createNoteFromChat', handleCreateNote as EventListener);
        return () => window.removeEventListener('createNoteFromChat', handleCreateNote as EventListener);
    }, [nodes, setNodes, setEdges]);

    // Handle creating repurposed content nodes
    useEffect(() => {
        const handleCreateRepurposedNode = (event: CustomEvent) => {
            const { sourceNodeId, content, label, nodeType, transformationType, platform, metadata, isChainWorkflow, chainIndex } = event.detail;

            // Find source node to position new node
            const sourceNode = nodes.find(n => n.id === sourceNodeId);
            if (!sourceNode) return;

            // Calculate position based on whether it's a chain workflow
            let positionX = sourceNode.position.x + 350;
            let positionY = sourceNode.position.y + 80;

            if (isChainWorkflow && chainIndex !== undefined) {
                // Stagger chain workflow nodes in a fan-out pattern
                positionY = sourceNode.position.y + (chainIndex * 150) - 100;
            }

            // Create new node positioned to the right and slightly down from source
            const newNode: Node = {
                id: `${nodeType}-repurposed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: nodeType,
                position: {
                    x: positionX,
                    y: positionY
                },
                data: {
                    label: label,
                    content: content,
                    history: [], // Initialize empty history for version tracking
                    metadata: {
                        ...metadata,
                        sourceNodeId,
                        transformationType
                    }
                }
            };

            // Create connecting edge with transformation label
            const edgeColor = getTransformationColor(transformationType, platform);
            const newEdge: Edge = {
                id: `edge-repurpose-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                source: sourceNodeId,
                target: newNode.id,
                label: getEdgeLabel(transformationType, platform),
                type: 'default',
                animated: true,
                style: { stroke: edgeColor, strokeWidth: 2 }
            };

            setNodes(nds => [...nds, newNode]);
            setEdges(eds => [...eds, newEdge]);
        };

        window.addEventListener('createRepurposedNode', handleCreateRepurposedNode as EventListener);
        return () => window.removeEventListener('createRepurposedNode', handleCreateRepurposedNode as EventListener);
    }, [nodes, setNodes, setEdges]);

    // Handle creating note from content (from Writing Processor)
    useEffect(() => {
        const handleCreateNoteFromContent = (event: CustomEvent) => {
            const { sourceNodeId, content, label } = event.detail;

            // Find source node to position new note
            const sourceNode = nodes.find(n => n.id === sourceNodeId);
            if (!sourceNode) return;

            // Position new node to the right of source
            const newNode: Node = {
                id: `noteNode-from-${Date.now()}`,
                type: 'noteNode',
                position: {
                    x: sourceNode.position.x + 350,
                    y: sourceNode.position.y
                },
                data: {
                    label: label,
                    content: content,
                    history: []
                }
            };

            // Create connecting edge
            const newEdge: Edge = {
                id: `edge-spawn-${Date.now()}`,
                source: sourceNodeId,
                target: newNode.id,
                label: '📝 Note',
                type: 'default',
                animated: true,
                style: { stroke: '#f59e0b', strokeWidth: 2 }
            };

            setNodes(nds => [...nds, newNode]);
            setEdges(eds => [...eds, newEdge]);
        };

        window.addEventListener('createNoteFromContent', handleCreateNoteFromContent as EventListener);
        return () => window.removeEventListener('createNoteFromContent', handleCreateNoteFromContent as EventListener);
    }, [nodes, setNodes, setEdges]);

    // Handle creating course from content
    useEffect(() => {
        const handleCreateCourseFromContent = (event: CustomEvent) => {
            const { sourceNodeId, content, label } = event.detail;

            const sourceNode = nodes.find(n => n.id === sourceNodeId);
            if (!sourceNode) return;

            const newNode: Node = {
                id: `courseNode-from-${Date.now()}`,
                type: 'courseNode',
                position: {
                    x: sourceNode.position.x + 350,
                    y: sourceNode.position.y + 100
                },
                data: {
                    label: label || 'New Course',
                    metadata: {
                        courseData: {
                            description: 'Course generated from content',
                            modules: [],
                            sourceContent: content // Store for Course Architect to use
                        },
                        masteryLevel: 0
                    }
                }
            };

            const newEdge: Edge = {
                id: `edge-course-${Date.now()}`,
                source: sourceNodeId,
                target: newNode.id,
                label: '📚 Course',
                type: 'default',
                animated: true,
                style: { stroke: '#a855f7', strokeWidth: 2 }
            };

            setNodes(nds => [...nds, newNode]);
            setEdges(eds => [...eds, newEdge]);
        };

        window.addEventListener('createCourseFromContent', handleCreateCourseFromContent as EventListener);
        return () => window.removeEventListener('createCourseFromContent', handleCreateCourseFromContent as EventListener);
    }, [nodes, setNodes, setEdges]);

    // Handle creating quiz from content
    useEffect(() => {
        const handleCreateQuizFromContent = (event: CustomEvent) => {
            const { sourceNodeId, content, label } = event.detail;

            const sourceNode = nodes.find(n => n.id === sourceNodeId);
            if (!sourceNode) return;

            const newNode: Node = {
                id: `quizNode-from-${Date.now()}`,
                type: 'quizNode',
                position: {
                    x: sourceNode.position.x + 350,
                    y: sourceNode.position.y + 200
                },
                data: {
                    label: label || 'New Quiz',
                    metadata: {
                        quizData: {
                            questions: [],
                            sourceContent: content // Store for Quiz Master to use
                        },
                        performance: { attempts: 0, correct: 0, incorrect: 0 }
                    }
                }
            };

            const newEdge: Edge = {
                id: `edge-quiz-${Date.now()}`,
                source: sourceNodeId,
                target: newNode.id,
                label: '❓ Quiz',
                type: 'default',
                animated: true,
                style: { stroke: '#3b82f6', strokeWidth: 2 }
            };

            setNodes(nds => [...nds, newNode]);
            setEdges(eds => [...eds, newEdge]);
        };

        window.addEventListener('createQuizFromContent', handleCreateQuizFromContent as EventListener);
        return () => window.removeEventListener('createQuizFromContent', handleCreateQuizFromContent as EventListener);
    }, [nodes, setNodes, setEdges]);

    // Helper functions for edge styling
    const getTransformationColor = (transformationType: string, platform?: string): string => {
        if (transformationType === 'TWEET_TO_NEWSLETTER') return '#f59e0b'; // amber
        if (transformationType === 'NEWSLETTER_TO_SCRIPT') return '#ec4899'; // pink
        if (transformationType === 'FORMAT_PLATFORM') {
            if (platform === 'linkedin') return '#0077b5';
            if (platform === 'twitter') return '#1da1f2';
            if (platform === 'instagram') return '#e4405f';
        }
        return '#a855f7'; // purple default
    };

    const getEdgeLabel = (transformationType: string, platform?: string): string => {
        if (transformationType === 'TWEET_TO_NEWSLETTER') return '📧 Newsletter';
        if (transformationType === 'NEWSLETTER_TO_SCRIPT') return '🎬 Script';
        if (transformationType === 'FORMAT_PLATFORM') {
            if (platform === 'linkedin') return '💼 LinkedIn';
            if (platform === 'twitter') return '🐦 Twitter';
            if (platform === 'instagram') return '📸 Instagram';
        }
        return '✨ Repurposed';
    };

    // 3. LISTEN FOR EXTERNAL DELETION (Vault Sync)
    useEffect(() => {
        if (deletedAssetId) {
            setNodes((nds) => nds.filter((node) => node.data.assetId !== deletedAssetId));
            // Also clean up any edges connected to deleted nodes? 
            // React Flow usually handles this if nodes are removed correctly.
        }
    }, [deletedAssetId, setNodes]);

    useOnSelectionChange({
        onChange: ({ nodes }) => {
            if (onSelectionChange) {
                onSelectionChange(nodes);
            }
        },
    });

    // Reset selection on pane click happens automatically by React Flow default behavior
    // But we still might want to expose onPaneClick if needed for other things, 
    // for now we can rely on onSelectionChange returning [] on deselect.

    // ... existing callbacks ...

    // ... existing callbacks ...

    const onConnect = useCallback(
        async (params: Connection) => {
            setEdges((eds) => addEdge(params, eds));

            // WIRE LOGIC: Check if we are connecting an Image to an AI
            const sourceNode = nodes.find((n) => n.id === params.source);
            const targetNode = nodes.find((n) => n.id === params.target);

            if (
                sourceNode?.type === 'imageNode' &&
                targetNode?.type === 'aiNode'
            ) {
                // 1. Set AI Node to "Processing"
                setNodes((nds) =>
                    nds.map((node) => {
                        if (node.id === targetNode.id) {
                            return {
                                ...node,
                                data: { ...node.data, status: 'processing', result: '' }
                            };
                        }
                        return node;
                    })
                );

                // 2. Call Gemini API (Server Action)
                const imageUrl = sourceNode.data.url as string;
                const response = await analyzeImage(imageUrl);

                // 3. Update AI Node with Result
                setNodes((nds) =>
                    nds.map((node) => {
                        if (node.id === targetNode.id) {
                            return {
                                ...node,
                                data: {
                                    ...node.data,
                                    status: response.success ? 'done' : 'error',
                                    result: response.data
                                }
                            };
                        }
                        return node;
                    })
                );
            }
        },
        [setEdges, nodes, setNodes],
    );

    const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
        setEdges((eds) => eds.filter(edge => !deletedEdges.find(de => de.id === edge.id)));
    }, [setEdges]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');

            // Check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const nodeData = JSON.parse(type);
            console.log("Dropped Node Data:", nodeData);

            // Use screenToFlowPosition to get the correct position relative to the canvas
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            let newNode: Node;

            if (nodeData.type === 'aiNode') {
                newNode = {
                    id: `aiNode-${Date.now()}`,
                    type: 'aiNode',
                    position,
                    data: { status: 'idle', result: '' },
                };
            } else if (nodeData.type === 'noteNode') {
                newNode = {
                    id: `noteNode-${Date.now()}`,
                    type: 'noteNode',
                    position,
                    data: {
                        label: nodeData.label,
                        content: nodeData.content,
                        assetId: nodeData.assetId
                    },
                };
            } else if (nodeData.type === 'linkNode') {
                newNode = {
                    id: `linkNode-${Date.now()}`,
                    type: 'linkNode',
                    position,
                    data: {
                        label: nodeData.label,
                        url: nodeData.url,
                        assetId: nodeData.assetId
                    },
                };
            } else if (nodeData.type === 'docNode') {
                // Create docNode with loading state
                const nodeId = `docNode-${Date.now()}`;
                newNode = {
                    id: nodeId,
                    type: 'docNode',
                    position,
                    data: {
                        label: nodeData.label,
                        url: nodeData.url,
                        assetId: nodeData.assetId,
                        content: '', // Will be populated after extraction
                        charCount: 0,
                        isExtracting: true
                    },
                };

                // Add node first, then extract content asynchronously
                setNodes((nds) => nds.concat(newNode));

                // Extract document content in background
                extractDocumentContent(nodeData.url).then(({ content, charCount }) => {
                    console.log(`[Canvas] Document extracted for ${nodeId}: ${charCount} chars`);
                    setNodes((nds) =>
                        nds.map((n) =>
                            n.id === nodeId
                                ? { ...n, data: { ...n.data, content, charCount, isExtracting: false } }
                                : n
                        )
                    );
                }).catch((error) => {
                    console.error(`[Canvas] Document extraction failed:`, error);
                    setNodes((nds) =>
                        nds.map((n) =>
                            n.id === nodeId
                                ? { ...n, data: { ...n.data, isExtracting: false } }
                                : n
                        )
                    );
                });

                return; // Already added node, skip the concat below
            } else if (nodeData.type === 'audioNode') {
                newNode = {
                    id: `audioNode-${Date.now()}`,
                    type: 'audioNode',
                    position,
                    data: {
                        label: nodeData.label,
                        url: nodeData.url,
                        assetId: nodeData.assetId,
                        metadata: nodeData.metadata
                    },
                };
            } else if (nodeData.type === 'videoNode') {
                newNode = {
                    id: `videoNode-${Date.now()}`,
                    type: 'videoNode',
                    position,
                    data: {
                        label: nodeData.label,
                        url: nodeData.url,
                        assetId: nodeData.assetId,
                        metadata: nodeData.metadata
                    },
                };
            } else if (nodeData.type === 'courseNode') {
                newNode = {
                    id: `courseNode-${Date.now()}`,
                    type: 'courseNode',
                    position,
                    data: {
                        label: nodeData.label || 'New Course',
                        metadata: {
                            masteryLevel: 0,
                            courseData: {},
                            studySessions: []
                        }
                    },
                };
            } else if (nodeData.type === 'quizNode') {
                newNode = {
                    id: `quizNode-${Date.now()}`,
                    type: 'quizNode',
                    position,
                    data: {
                        label: nodeData.label || 'New Quiz',
                        metadata: {
                            quizData: { questions: [] },
                            performance: { attempts: 0, correct: 0, incorrect: 0 }
                        }
                    },
                };
            } else if (nodeData.type === 'workflowNode') {
                newNode = {
                    id: `workflowNode-${Date.now()}`,
                    type: 'workflowNode',
                    position,
                    data: {
                        label: nodeData.label || 'New Workflow',
                        stages: [],
                        currentStage: null,
                        completedStages: [],
                        assignedNodes: {}
                    },
                };
            } else if (nodeData.type === 'scriptNode') {
                newNode = {
                    id: `scriptNode-${Date.now()}`,
                    type: 'scriptNode',
                    position,
                    data: {
                        label: nodeData.label || 'New Script',
                        format: 'tiktok',
                        hookType: 'question',
                        voiceStyle: 'casual',
                        hook: '',
                        contentBlocks: [],
                        cta: '',
                        scenes: [],
                        estimatedDuration: 0
                    },
                };
            } else if (nodeData.type === 'storyboardNode') {
                newNode = {
                    id: `storyboardNode-${Date.now()}`,
                    type: 'storyboardNode',
                    position,
                    data: {
                        label: nodeData.label || 'New Storyboard',
                        visualStyle: 'cinematic',
                        scenes: [],
                        totalDuration: 0
                    },
                };
            } else if (nodeData.type === 'angleNode') {
                newNode = {
                    id: `angleNode-${Date.now()}`,
                    type: 'angleNode',
                    position,
                    data: {
                        label: nodeData.label || 'Marketing Angles',
                        product: '',
                        targetAudience: '',
                        angles: []
                    },
                };
            } else if (nodeData.type === 'campaignNode') {
                newNode = {
                    id: `campaignNode-${Date.now()}`,
                    type: 'campaignNode',
                    position,
                    data: {
                        label: nodeData.label || 'New Campaign',
                        campaignName: '',
                        posts: [],
                        template: ''
                    },
                };
            } else {
                newNode = {
                    id: `imageNode-${Date.now()}`,
                    type: 'imageNode',
                    position,
                    data: {
                        url: nodeData.url,
                        label: nodeData.label,
                        assetId: nodeData.assetId
                    },
                };
            }

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes],
    );

    return (
        <div className="flex-1 h-screen relative bg-[#0B0F19]">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodesDelete={onNodesDelete}
                onEdgesDelete={onEdgesDelete}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                selectionOnDrag={true}
                selectNodesOnDrag={true}
                panOnDrag={[1, 2]}
                selectionMode={SelectionMode.Partial}
                panOnScroll={true}
                zoomOnPinch={true}
                panOnScrollMode={PanOnScrollMode.Free}
                selectionKeyCode={null}
                multiSelectionKeyCode="Shift"
                deleteKeyCode="Backspace"
                fitView
                minZoom={0.1}
                maxZoom={4}
            >
                <Background color="#334155" gap={20} size={1} />
                <Controls className="!bg-slate-800 !border-slate-700 !text-slate-200 fill-current touch-button" />
            </ReactFlow>

            {/* Empty State Overlay */}
            {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center opacity-20">
                        <h1 className="text-4xl font-bold tracking-tighter text-slate-500 mb-2">HAVEN OS</h1>
                        <p className="text-sm font-mono text-slate-400">Drag items from Vault to initialize node</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Export default Canvas directly since Provider is in page.tsx
export default Canvas;
