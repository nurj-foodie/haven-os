import { Node } from '@xyflow/react';
import { InspectorProcessor } from './processors/types';
import ImageProcessor from './processors/ImageProcessor';
import DefaultProcessor from './processors/DefaultProcessor';
import SummaryProcessor from './processors/SummaryProcessor';
import WritingProcessor from './processors/WritingProcessor';
import BilingualEditorProcessor from './processors/BilingualEditorProcessor';
import TranscriptionProcessor from './processors/TranscriptionProcessor';
import CourseProcessor from './processors/CourseProcessor';
import QuizProcessor from './processors/QuizProcessor';
import ArticleProcessor from './processors/ArticleProcessor';
import BrainstormProcessor from './processors/BrainstormProcessor';
import CalendarProcessor from './processors/CalendarProcessor';
import WorkflowProcessor from './processors/WorkflowProcessor';
import ScriptProcessor from './processors/ScriptProcessor';
import StoryboardProcessor from './processors/StoryboardProcessor';
import AngleProcessor from './processors/AngleProcessor';
import CampaignProcessor from './processors/CampaignProcessor';
import ProductionProcessor from './processors/ProductionProcessor';

// Registry of available processors
const processors: InspectorProcessor[] = [
    {
        id: 'production-processor',
        name: 'Production Manager',
        canHandle: (node: Node) => node.type === 'productionNode',
        Component: ProductionProcessor,
    },
    {
        id: 'campaign-processor',
        name: 'Campaign Builder',
        canHandle: (node: Node) => node.type === 'campaignNode',
        Component: CampaignProcessor,
    },
    {
        id: 'angle-processor',
        name: 'Angle Generator',
        canHandle: (node: Node) => node.type === 'angleNode',
        Component: AngleProcessor,
    },
    {
        id: 'storyboard-processor',
        name: 'Storyboard Designer',
        canHandle: (node: Node) => node.type === 'storyboardNode',
        Component: StoryboardProcessor,
    },
    {
        id: 'script-processor',
        name: 'Story Builder',
        canHandle: (node: Node) => node.type === 'scriptNode',
        Component: ScriptProcessor,
    },
    {
        id: 'workflow-processor',
        name: 'Workflow',
        canHandle: (node: Node) => node.type === 'workflowNode',
        Component: WorkflowProcessor,
    },
    {
        id: 'calendar-processor',
        name: 'Schedule',
        canHandle: (node: Node) => node.type === 'noteNode' || node.type === 'courseNode',
        Component: CalendarProcessor,
    },
    {
        id: 'course-processor',
        name: 'Course Manager',
        canHandle: (node: Node) => node.type === 'courseNode',
        Component: CourseProcessor,
    },
    {
        id: 'quiz-processor',
        name: 'Quiz',
        canHandle: (node: Node) => node.type === 'quizNode',
        Component: QuizProcessor,
    },
    {
        id: 'writing-processor',
        name: 'Writing Assistant',
        canHandle: (node: Node) => node.type === 'noteNode' || node.type === 'docNode',
        Component: WritingProcessor,
    },
    {
        id: 'bilingual-editor',
        name: 'Bilingual Editor',
        canHandle: (node: Node) => node.type === 'noteNode' || node.type === 'docNode',
        Component: BilingualEditorProcessor,
    },
    {
        id: 'article-builder',
        name: 'Article Builder',
        canHandle: (node: Node) => node.type === 'noteNode' || node.type === 'docNode',
        Component: ArticleProcessor,
    },
    {
        id: 'transcription-processor',
        name: 'Transcription Agent',
        canHandle: (node: Node) => node.type === 'audioNode' || node.type === 'videoNode',
        Component: TranscriptionProcessor,
    },
    {
        id: 'summary-processor',
        name: 'Summarizer',
        canHandle: (node: Node) => node.type === 'docNode' || node.type === 'linkNode',
        Component: SummaryProcessor,
    },
    {
        id: 'brainstorm-processor',
        name: 'Brainstorm',
        canHandle: (node: Node) => node.type === 'courseNode' || node.type === 'noteNode' || node.type === 'quizNode' || node.type === 'docNode',
        Component: BrainstormProcessor,
    },
    {
        id: 'image-processor',
        name: 'Image Processor',
        canHandle: (node: Node) => node.type === 'imageNode',
        Component: ImageProcessor,
    },
];

export function getProcessorForNode(node: Node | null): InspectorProcessor | null {
    if (!node) {
        return {
            id: 'default',
            name: 'Default',
            canHandle: () => true,
            Component: DefaultProcessor
        };
    }

    const processor = processors.find(p => p.canHandle(node));
    return processor || null;
}

export function getAllProcessorsForNode(node: Node): InspectorProcessor[] {
    return processors.filter(p => p.canHandle(node));
}
