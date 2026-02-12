import { Node, Edge } from '@xyflow/react';

/**
 * Standard Agent Input Format
 * Used by all Haven OS agents to receive context from the canvas
 */
export interface AgentInput {
    nodes: Array<{
        id: string;
        type: string;
        data: {
            assetId?: string;
            label?: string;
            content?: string;
            metadata?: Record<string, any>;
        };
    }>;
    edges?: Array<{ source: string; target: string; label?: string }>;
    userPrompt?: string;
}

/**
 * Standard Agent Output Format
 * Used by all Haven OS agents to return results
 */
export interface AgentOutput {
    success: boolean;
    result?: {
        content: string; // Primary output (text/markdown)
        metadata?: Record<string, any>; // Tags, summary, etc.
        suggestedConnections?: Array<{
            from: string;
            to: string;
            label: string
        }>;
        nextAgent?: string; // Suggested next agent in pipeline
    };
    error?: string;
}

/**
 * Convert React Flow nodes and edges to AgentInput format
 */
export function nodesToAgentInput(
    nodes: Node[],
    edges?: Edge[],
    userPrompt?: string
): AgentInput {
    return {
        nodes: nodes.map(node => ({
            id: node.id,
            type: node.type || 'unknown',
            data: {
                assetId: node.data.assetId as string | undefined,
                label: node.data.label as string | undefined,
                content: node.data.content as string | undefined,
                metadata: node.data.metadata as Record<string, any> | undefined,
            }
        })),
        edges: edges?.map(edge => ({
            source: edge.source,
            target: edge.target,
            label: edge.label as string | undefined,
        })),
        userPrompt,
    };
}

/**
 * Agent Pipeline: Chain multiple agents together
 * Example: Curator → Scholar → Author
 */
export async function runAgentPipeline(
    initialInput: AgentInput,
    agentSequence: Array<(input: AgentInput) => Promise<AgentOutput>>
): Promise<AgentOutput> {
    let currentInput = initialInput;
    let finalOutput: AgentOutput = { success: false };

    for (const agent of agentSequence) {
        const output = await agent(currentInput);

        if (!output.success) {
            return output; // Stop pipeline on error
        }

        finalOutput = output;

        // Prepare input for next agent
        if (output.result) {
            currentInput = {
                ...currentInput,
                nodes: [
                    ...currentInput.nodes,
                    {
                        id: `agent-output-${Date.now()}`,
                        type: 'note',
                        data: {
                            content: output.result.content,
                            metadata: output.result.metadata,
                        }
                    }
                ]
            };
        }
    }

    return finalOutput;
}
