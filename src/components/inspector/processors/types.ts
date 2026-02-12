import { Node } from '@xyflow/react';

export interface ProcessorProps {
    node: Node | null;
}

export interface InspectorProcessor {
    id: string;
    name: string;
    description?: string;
    icon?: React.ReactNode;
    canHandle: (node: Node) => boolean;
    Component: React.ComponentType<ProcessorProps>;
}
