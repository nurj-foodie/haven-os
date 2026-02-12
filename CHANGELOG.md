# Changelog

All notable changes to the "Haven OS" project will be documented in this file.

## 2026-02-08 (Session: Vision Alignment - The "Missing Links") - 14:30 (GMT+8)
### Added
- **Deep Dive Study (Scholar Pillar):**
  - **Tutor Agent Integration:** Interactive chat interface within Course Nodes to "talk" to the course content.
  - **Context Awareness:** Tutor dynamically scans connected nodes (Notes, Docs) to ground answers in your specific knowledge graph.
  - **Gemini 2.0 Flash:** Powered by the latest multimodal model for fast, accurate explanations and analogies.
  - **UI Integration:** "Deep Dive" tab in Course Inspector and direct "Study" button on Course Node.

- **Dual Language Support (Writing Pillar):**
  - **Bahasa Malaysia Toggle:** Added "BM" option to the Writing Processor.
  - **Voice Profile Injection:** Ghostwriter and Re-writer agents now respect language preferences while maintaining the user's voice.

- **Production Polish (Production Pillar):**
  - **Logo Redesign Template:** Added specialized workflow for "Logo Design" in the Production Processor.

- **Marketing Polish (Marketing Pillar):**
  - **A/B Testing:** Added "Create A/B Variant" button to Angle Processor to generate alternative copy instantly.
  - **Timeline View:** Visual calendar for marketing campaigns.

### Changed
- **CourseProcessor.tsx:** Refactored to support tabbed interface ("Structure" vs "Deep Dive").
- **WritingProcessor.tsx:** Added language state management.
- **Task & PRD:** Updated to mark Phase 7 "Vision Alignment" as complete.

---

## 2026-02-02 (Session: The Marketer - Phase 9) - 08:30 (GMT+8)

### Added
- **Angle Generator Agent (Phase 9: The Marketer - Part 1):**
  - **AngleNode:** New node type for marketing angle cards with:
    - Amber/gold theme
    - Angle type icons (Pain Point, Benefit, Story, Authority, Urgency, Curiosity)
    - Platform badges (LinkedIn, Twitter, Instagram, Email, Ads)
    - Variation count indicators
  - **AngleProcessor:** AI-powered marketing angle generator with:
    - Product name and target audience inputs
    - Platform selection toggles
    - Generated angles with expandable cards
    - Copy variations with one-click clipboard copy
  - **Angle API (`/api/agents/angle`):** Gemini 2.0 Flash integration for multi-angle generation

- **Campaign Builder (Phase 9: The Marketer - Part 2):**
  - **CampaignNode:** New node type for multi-platform campaigns with:
    - Emerald/teal theme
    - Platform distribution badges
    - Progress bar for campaign completion
    - Status summary (Draft/Scheduled/Published)
  - **CampaignProcessor:** Full campaign management with:
    - 4 Templates: Product Launch, Content Series, Event Promotion, Brand Awareness
    - Post scheduling with datetime picker
    - Timeline view grouped by date
    - Integration with connected Angle nodes
  - **Templates:** Pre-built multi-platform rollout sequences

### Changed
- **Canvas.tsx:** Added `angleNode` and `campaignNode` to nodeTypes and drop handlers.
- **ProcessorRegistry.ts:** Registered AngleProcessor and CampaignProcessor.
- **DefaultProcessor.tsx:** Added Marketer section with Angle Generator and Campaign Builder.

---

## 2026-02-01 (Session: Storyboard Agent - Phase 8 Complete) - 19:08 (GMT+8)
### Added
- **Storyboard Agent (Phase 8: The Director - Part 2):**
  - **StoryboardNode:** New node type for visual scene breakdowns with:
    - Purple/violet theme (distinct from Script's red)
    - Scene thumbnail grid (3x2 layout)
    - Visual style badge indicator
    - Progress bar with completion tracking
    - Duration and scene count badges
  - **StoryboardProcessor:** AI-powered Storyboard Designer with:
    - Visual style presets: Cinematic, Minimalist, Dynamic, Sketch, Corporate
    - Expandable scene cards with framing (WS/MS/CU/ECU)
    - Camera movement options (Static, Pan, Zoom, Dolly, Tilt)
    - Timeline visualization tab for scene flow
    - AI generation connected to Script nodes
  - **Storyboard Generation API:** `/api/agents/storyboard` endpoint using Gemini 2.0 Flash for:
    - Visual composition descriptions per scene
    - Reference keyword suggestions for each shot
    - Style-aware generation (cinematic lighting, minimalist framing, etc.)

### Changed
- **Canvas.tsx:** Added `storyboardNode` to nodeTypes and drop handler.
- **ProcessorRegistry.ts:** Registered StoryboardProcessor for storyboardNode.
- **DefaultProcessor.tsx:** Added Storyboard item to Director section with violet theme.
- **TASKS.md:** Marked Phase 8 Storyboard Agent as complete.
- **PRD.md:** Updated Phase 8 status and action plan.

---

## 2026-02-01 (Session: The Director - Phase 8) - 22:00 (GMT+8)
### Added
- **Video Production Pipeline (Phase 8: The Director):**
  - **ScriptNode:** New node type for video scripts with format badge, duration display, and scene indicators.
  - **ScriptProcessor:** AI-powered Story Builder with:
    - Format presets: TikTok, Reel, YouTube Short, YouTube Long
    - Hook types: Question, Statement, Story, Shock
    - Voice styles: Casual, Professional, Energetic, Custom
    - Auto-detected topic from connected sources
    - Shot list tab with scene management
  - **Script Generation API:** `/api/agents/script` endpoint using Gemini 2.0 Flash for:
    - Platform-specific script generation
    - Hook/Content/CTA structure
    - Scene-by-scene breakdown
    - Voice style adaptation
- **UI Enhancements:**
  - **Director Section:** New rose-themed "Director" section in Inspector sidebar with Script drag item.
  - **Connection-Aware Context:** Script nodes can inherit topic from connected source materials.

### Changed
- **Canvas.tsx:** Added `scriptNode` to nodeTypes and drop handler.
- **ProcessorRegistry.ts:** Registered ScriptProcessor for scriptNode.
- **DefaultProcessor.tsx:** Added Director section with Script drag item.
- **Multiple Processors:** Fixed TypeScript strictness errors for metadata access patterns.

---

## 2026-02-01 (Session: The Producer - Phase 7) - 18:00 (GMT+8)
### Added
- **Workflow Manager System (Phase 7: The Producer):**
  - **WorkflowNode:** New node type with visual stage pipeline, progress bar, and status indicators.
  - **WorkflowProcessor:** Inspector tab with stage management, progress tracking, and one-click template application.
  - **Product Templates:** Three pre-built workflow templates:
    - App Development (Ideation → Design → Build → Test → Launch)
    - Digital Course (Outline → Record → Edit → Publish → Market)
    - Content Launch (Draft → Review → Schedule → Publish → Promote)
  - **Stage Management:** Visual stage progression with completion tracking and reset functionality.
- **UI Enhancements:**
  - **Producer Section:** New "Producer" section in Inspector sidebar with Workflow drag item.
  - **Inspector Tab Scrolling:** Horizontal scroll for processor tabs when multiple processors are visible.

### Changed
- **schema.sql:** Updated to v1.4 with `workflow_templates` table.
- **Canvas.tsx:** Added `workflowNode` to nodeTypes and drop handler.
- **ProcessorRegistry.ts:** Registered WorkflowProcessor for workflowNode.
- **DefaultProcessor.tsx:** Added Producer section with Workflow drag item.

---

## 2026-02-01 (Session: Content Calendar - Phase 6 Complete) - 09:30 (GMT+8)
### Added
- **Content Calendar System:**
  - **Schema Update:** Added `scheduled_at` (timestamptz) and `publication_status` (draft/scheduled/published) columns to assets table.
  - **CalendarProcessor:** New Inspector tab for Note/Course nodes with date picker, status toggle, and quick schedule buttons (Tomorrow 9am, Next Monday, In 1 hour).
  - **CalendarPanel:** Global weekly calendar view modal accessible from header, showing scheduled content with color-coded status badges.
  - **Schedule API:** New `/api/assets/schedule` endpoint for saving and fetching scheduled content.
- **UI Enhancements:**
  - **Header Calendar Button:** Amber-themed button in the top bar for quick access to Content Calendar.
  - **Status Legend:** Visual legend showing Draft (gray), Scheduled (amber), Published (green) states.

### Changed
- **ProcessorRegistry.ts:** Added CalendarProcessor for noteNode and courseNode types.
- **schema.sql:** Updated to v1.3 with Content Calendar columns.

---

## 2026-01-31 (Session: Haven Intelligence & Advanced Repurposing) - 22:30 (GMT+8)
### Added
- **Haven Intelligence (Major Upgrade):**
  - **Identity:** Renamed Brainstorm to "Haven Intelligence" with JARVIS-like persona.
  - **Vault Awareness:** Automatically fetches and references recent Vault assets in context.
  - **Feature Awareness:** Knows its own toolkit (Repurpose, Batch, Calendar, Transcription) and proactively suggests them.
  - **Contextual Prompts:** Dynamic suggestion chips based on selected node type (Note vs Audio vs Course).
- **Advanced Repurposing Engine:**
  - **Batch Repurposing:** Multi-select support for simultaneously repurposing multiple nodes.
  - **History Tracking:** "View History" tab in Inspector tracks all generations with feedback loop (Thumbs Up/Down).
  - **Iteration:** "Iterate" button to refine content based on previous versions.
- **Audio Intelligence:**
  - **Whisper Integration:** Real AI transcription for Audio Nodes using Groq/OpenAI compatible API.
  - **Save as Node:** One-click conversion of transcripts into fully functional Note Nodes.
- **Tablet Optimization:**
  - **Touch Gestures:** Pinch-to-Zoom and Pan support for Canvas.
  - **Responsive Inspector:** Adapts to Bottom Sheet on mobile/tablet widths.
  - **Touch Targets:** Increased hit areas for buttons and interactions.

### Changed
- **BrainstormProcessor.tsx:** Complete rewrite to support Vault context injection and new UI.
- **RepurposeProcessor.tsx:** Added History tab and Batch Operation support.
- **Inspector.tsx:** Added support for multi-node selection context (Batch Actions).

---
### Added
- **Visual Repurposing Engine:**
  - **Visual Node Creation:** Repurposing content now spawns NEW nodes on the canvas instead of overwriting.
  - **Transformation Lineage:** Automatic "Mind Map" style connections with colored, animated edges showing content evolution.
  - **Chain Workflows (One-Click):**
    - **Atomize (3x):** Instantly creates LinkedIn, Twitter, and Instagram posts from one source (Fan-out pattern).
    - **Video Pipeline:** Creates Newsletter → Video Script chain sequence.
  - **Edge Styling:** Platform-specific colors (Amber/Newsletter, Pink/Script, Blue/LinkedIn) and emoji labels.
- **Brainstorming Enhancements:**
  - **Reasoning Mode:** Toggle to use `gemini-1.5-pro` for deeper, chain-of-thought analysis during brainstorming.
  - **Deep Research:** Toggle for Google Search integration (grounding).
  - **Multi-Node Brainstorming:** Select multiple nodes → "Brainstorm" to synthesize ideas from combined context.

### Changed
- **API Architecture:**
  - Updated `/api/agents` to fallback to `gemini-1.5-pro` for Reasoning Mode (replacing unavailable experimental model).
  - Updated `/api/ai/repurpose` to return full node metadata for visual creation.
- **Canvas Experience:** 
  - Nodes now support "Repurposed" lineage tracking via metadata.
  - Intelligent staggered positioning for multi-node generation.

---

## 2026-01-27 (Session: The Author - Phase 6 Complete) - 14:00 (GMT+8)
### Added
- **Voice Profile System:**
  - **Per-Node Voice Profiles:** Store writing samples and style rules in each Note Node's metadata
  - **Saved Presets:** Save and load voice profiles across nodes via localStorage
  - **Voice Injection:** Automatically applies voice to all writing AI (Expand/Simplify, Repurposing, Ghostwriter)
  - **UI:** Collapsible violet-themed section in WritingProcessor with samples/rules textareas, enable toggle, and preset management
- **Master Article Builder:**
  - **4 Templates:** How-To Guide, Thought Leadership, Case Study, Listicle
  - **AI Outline Generation:** Generates structured article outlines based on topic and template
  - **Section Expansion:** Click-to-expand individual sections with AI-generated content
  - **Multi-Platform Export:** Copy as Markdown, LinkedIn, or Facebook format
  - **API Endpoint (`/api/ai/article`):** New route handling GENERATE_OUTLINE, EXPAND_SECTION, and POLISH_ARTICLE actions
  - **ArticleProcessor.tsx:** New processor with template selection, outline display, and export panel

### Changed
- **WritingProcessor.tsx:** Added Voice Profile section with save/load preset functionality
- **ProcessorRegistry.ts:** Registered ArticleProcessor for Note Nodes
- **Backend APIs:** Updated `/api/agents`, `/api/ai/repurpose`, `/api/ai/ghostwriter` to accept and inject voice profiles

---

## 2026-01-27 (Session: The Author - Repurposing Engine) - 12:00 (GMT+8)
### Added
- **Repurposing Engine:**
  - **Tweet → Newsletter Expansion:** Transforms short-form content (tweets, posts) into full newsletters with subject line, hook, main content, takeaway, and CTA.
  - **Newsletter → Script Conversion:** Converts written content into video scripts with HOOK, INTRO, MAIN, CONCLUSION, and CTA sections, including visual/audio cues.
  - **Platform Formatter:** Reshapes content for specific platforms:
    - **LinkedIn:** Professional formatting with line breaks, hooks, and hashtags
    - **Twitter/X:** Converts content into numbered threads (5-10 tweets)
    - **Instagram:** Carousel-style captions with emojis and 20-30 hashtags
  - **API Endpoint (`/api/ai/repurpose`):** New route handling TWEET_TO_NEWSLETTER, NEWSLETTER_TO_SCRIPT, and FORMAT_PLATFORM actions.

### Changed
- **WritingProcessor.tsx:** Added Repurposing Engine section with gradient-styled transformation buttons and platform formatter buttons.

---
## 2026-01-26 (Session: The Author - Content Creation) - 19:24 (GMT+8)
### Added
- **Phase 6: The Author (Pillar 3 & 5 - Writing & Content Creation)**
  - **Bilingual Editor:**
    - Dual-pane interface for English ↔ Bahasa Malaysia translation
    - Translation API (`/api/ai/translate`) using Gemini 2.0 Flash
    - Language toggle with swap functionality
    - Copy to clipboard for translated content
  - **Ghostwriter Agent (Dan Koe Framework):**
    - Niche Tree Builder (3 core niches + sub-niches for context)
    - Pattern Decoder (deconstruct viral content structure & psychology)
    - Generator Engine with 3 modes: Titles (20-30), Deep Posts, Ideas (60)
    - API endpoint (`/api/ai/ghostwriter`) with DECONSTRUCT and GENERATE actions
  - **Tabbed Processor Switching:**
    - Inspector now shows tabs when multiple processors can handle a node type
    - Note Nodes now have "Writing Assistant" and "Bilingual Editor" tabs
  - **Author Section in Inspector:**
    - New "Author" section in DefaultProcessor with Ghostwriter access
    - Ghost icon with orange accent for visual distinction

### Changed
- **TASKS.md Restructured:** Aligned with the 6 Pillars framework (Light Bulb, Learning, Writing, Production, Content Creation, Marketing)
- **ProcessorRegistry:** Added `getAllProcessorsForNode()` for tab-based processor selection
- **Inspector.tsx:** Refactored to support tabbed processor switching with state management

### Documentation
- Updated TASKS.md with 6 Pillars table and 3-month roadmap (Jan-Apr 2026)
- Session summary documenting Bilingual Editor and Ghostwriter implementation

---
## 2026-01-24 (Session: Scholar Verification) - 19:20 (GMT+8)
### Verified
- **Phase 5 Release:** Comprehensive testing and verification of all Scholar features.
  - Confirmed **Course Architect** and **Quiz Master** agents are fully operational.
  - Validated **Semantic Search** ranking and retrieval quality.
  - Verified **Ontology Manager** graph generation.
  - Confirmed **PDF Analysis** and multi-document synthesis.
- **Stability:** System is stable with no critical bugs found during verification walkthrough.

---
## 2026-01-23 (Session: The Scholar - Learning System) - 21:39 (GMT+8)
### Added
- **Phase 5: The Scholar (Deep Learning)**
  - **Course System:**
    - **CourseNode Component:** Visual container for learning modules with mastery progress (0-100%), module previews, and action buttons.
    - **CourseProcessor:** Inspector panel showing course details, modules, mastery indicators, and quiz generation.
    - **Mastery Tracking:** Color-coded progress levels (Beginner, Learning, Proficient, Mastered).
  - **Quiz System:**
    - **QuizNode Component:** Display quiz metadata, score history, and start/retake functionality.
    - **QuizProcessor:** Full quiz-taking interface with question navigation, answer validation, and scoring.
    - **Mixed Question Formats:** Support for multiple choice, fill-in-blank, and open-ended questions.
  - **AI Agents:**
    - **Quiz Master Agent (`/api/agents/quiz`):** Generates educational quizzes from course content using Gemini 2.0 Flash.
    - **Course Architect Agent (`/api/agents/course`):** Creates AI-suggested course outlines with progressive modules, core ideas, and sub-topics.
  - **UI Integration:**
    - Added "Learning" section to DefaultProcessor with drag-and-drop Course and Quiz creation.
    - Registered CourseProcessor and QuizProcessor in ProcessorRegistry.

### Fixed
- **Canvas Node Creation Bug:** Fixed onDrop handler in Canvas.tsx to properly recognize courseNode and quizNode types, preventing them from defaulting to imageNode.

### Changed
- **Database Schema:** Added 'course' and 'quiz' to assets type constraint via idempotent SQL migration.

---
## 2026-01-23 (Session: The Curator - Lifecycle Management) - 16:02 (GMT+8)
### Added
- **Phase 4: The Curator ("Light Bulb" Moments)**
  - **Lifecycle Management:**
    - Added `lifecycle_state` column to `staging_items` table ('fresh', 'aging', 'stale')
    - Added `archived_at` and `last_interacted_at` timestamp columns
    - Created `archived_items` table with full RLS policies
  - **Visual Indicators:**
    - **LifecycleBadge Component:** Shows "New" badge or age in days for staging items
    - **Fresh Items (0-7 days):** Gold glow effect (`shadow-[0_0_20px_rgba(251,191,36,0.15)]`) and yellow border
    - **Aging Items (7-30 days):** Dimmed opacity (60%) to indicate staleness
  - **Archive System:**
    - Archive toggle in Sidebar header (switches between Staging and Archive views)
    - Archive view displays archived items with restore functionality
    - Manual archive button appears on aging items (7-30 days)
    - Auto-archival API route (`/api/lifecycle`) for cron-based cleanup
  - **Interconnected Agent Foundation:**
    - Created `agentIO.ts` with standard `AgentInput`/`AgentOutput` interfaces
    - Documented agent piping architecture for Phase 5+ integration
    - Established pattern for agent-to-agent communication

### Fixed
- **Archive View Filtering:** Fixed Sidebar conditional rendering to properly separate staging items from archived items
- **Lifecycle Badge Display:** Corrected badge visibility in both text/link and file staging items
- **Button Logic:** Archive view shows restore button (not delete) for archived items

### Changed
- **Staging Items Schema:** Extended with lifecycle tracking columns for automated health management
- **Sidebar UI:** Dual-mode view (Staging | Archive) with toggle button
- **Auto-Archival:** Items 30+ days old automatically move to archive on app mount

---
## 2026-01-20 (Session: Crystallization & Enhanced Nodes) - 14:30 (GMT+8)
### Added
- **Orchestrator V2 (Crystallization):**
  - **Save Result to Node:** Ability to turn transient AI text (synthesis/summary) into a persistent Note Node on the canvas.
  - **Auto-Connect Nodes:** AI analyzes selected nodes and automatically creates labeled edges (connections) between them.
  - **JSON Edges:** Updated `/api/agents` to support structured JSON output for connection logic.
- **Enhanced Nodes:**
  - **Link Previews (OpenGraph):** Link nodes now fetch and display rich metadata (Image, Title, Description) via `/api/opengraph`.
  - **Markdown Editor:** Note Nodes now support full markdown rendering (Bold, Italic, Headings, Lists, Code) and inline editing.
- **API:**
  - **OpenGraph Endpoint:** New `/api/opengraph` route using `open-graph-scraper` with timeout and auto-https normalization.

### Fixed
- **URL Normalization:** OpenGraph API now automatically prepends `https://` to URLs without protocols (e.g., `youtube.com`), preventing 400 errors.
- **Link Dragging:** Fixed bug where dragging Links from Staging failed due to incorrect `public_url` reference; now uses `metadata.raw_content`.
- **404 Errors:** Removed non-existent icon references from `manifest.json` to clear console errors.

### Changed
- **Workflow:** Clarified that **Staging Items** are intentionally non-draggable to enforce the "Categorize → Vault → Canvas" workflow.

---
## 2026-01-19 (Session: Transcription Agent) - 21:55 (GMT+8)
### Added
- **Transcription Agent:**
  - **Audio/Video Nodes:** New distinct node types with color-coded UI (Purple for Audio, Blue for Video).
  - **Transcription Processor:** Dedicated Inspector panel for triggering AI transcription, playback, and viewing results.
  - **Gemini 2.0 Integration:** Using `gemini-2.0-flash-exp` for multi-modal analysis (Summary + Transcript + Diarization).
  - **Inline Processing:** Handles file fetching and base64 conversion for direct Gemini processing.
- **Vault Enhancements:**
  - **Resource Categories:** Split "Resources" into distinct "Audio", "Video", and "Documents" sections.
  - **Visual Coding:** Added color-coded icons (Purple/Blue/Gray) for better scanability.
  - **Delete Workflow:** Added missing delete buttons and a confirmation modal for safety.

### Fixed
- **Upload Reliability:** Added 50MB file size validation with helpful error messages for Supabase free tier limits.
- **MIME Detection:** Fixed issue where `.m4a` Voice Memos were wrongly classified as 'zip/document' by adding extension fallback logic.
- **API Stability:** Resolved "Body has already been read" 500 error in `/api/agents` by fixing duplicate body parsing.
- **Gemini Connectivity:** Switched from `fileUri` (which failed with Supabase URLs) to inline base64 data transfer.
- **Type Safety:** Prevented AI categorization from incorrectly changing stable types (audio/video) into 'note'.

---

## Phase 3: The "Product" (January 2026)
*Goal: Collaborative SaaS & Agentic Intelligence.*

---
## 2026-01-14 (Session: AI Orchestration & Multi-Selection Fix) - 05:38 (GMT+8)
### Added
- **AI Orchestrator Panel:**
  - Multi-node selection now triggers the "Orchestrator" view in the Inspector.
  - "Find Connections" button synthesizes relationships between selected nodes.
  - "Synthesize Narrative" button creates unified narratives from multiple nodes.
  - Neural Orchestrator header with purple icon for visual distinction.
- **Canvas Multi-Selection:**
  - Implemented drag-box selection via `selectionOnDrag={true}`.
  - Added `selectNodesOnDrag` for persistent selection after drag.
  - Configured `panOnDrag={[1, 2]}` for middle/right-click panning.
  - Added `selectionMode="partial"` for partial box selection.

### Fixed
- **Orchestrator Crash:** Resolved crash when selecting multiple nodes by moving `ReactFlowProvider` from `Canvas.tsx` to `page.tsx` root level.
- **Blank Screen Issues:** Restored missing state definitions and handler functions (`handleLogin`, `handleUpload`, `handleCategorize`, etc.) in `page.tsx`.
- **API Key Configuration:** Updated `/api/agents` to accept both `GEMINI_API_KEY` and `NEXT_PUBLIC_GEMINI_API_KEY`.
- **Empty `src` Warnings:** Fixed React warnings in `ImageNode.tsx` and `Sidebar.tsx` by conditionally rendering images only when URL exists.
- **ErrorBoundary:** Added global error boundary component for better error debugging.

### Changed
- **Inspector Overflow:** Fixed Orchestrator panel overflow by adding `overflow-y-auto` and `h-screen` to Inspector container.
- **Supabase Resilience:** Added try-catch in auth initialization to handle offline database gracefully.

---

## Phase 2: The "Producer" (December 2025)
*Goal: Deep organization, layout persistence, and AI-powered search.*

---
## 2025-12-28 (Session: Semantic Search) - 15:35 (GMT+8)
### Added
- **Semantic Search (AI-Powered):**
  - Implemented vector similarity search using **pgvector** extension in Supabase.
  - Integrated **Gemini text-embedding-004** model for 768-dimensional embeddings.
  - Created `match_assets` RPC function for cosine similarity matching.
  - Added `/api/search` endpoint for semantic query processing.
  - Added `/api/embed` endpoint for text embedding generation.
  - Added `/api/backfill` endpoint to generate embeddings for existing assets.
- **Sidebar Search UI:**
  - Added semantic search input with debounced API calls (500ms).
  - Added "AI" badge indicator when semantic results are returned.
  - Added loading spinner during search.
  - Hybrid search: semantic results first, text fallback when empty.

### Changed
- **Database Schema:**
  - Added `embedding vector(768)` column to `assets` table.
  - Added `ivfflat` index for fast vector similarity search.
  - Added RLS `UPDATE` policy for assets table.
- **Asset Creation:**
  - `handleMoveToVault` now generates and stores embeddings automatically.
  - Embeddings stored in pgvector string format `[val1,val2,...]`.

### Fixed
- **Embedding Storage:** Converted JS arrays to pgvector string format.
- **RLS Policy:** Added missing UPDATE policy that was blocking embedding saves.
- **Threshold Tuning:** Lowered similarity threshold from 0.3 to 0.1 for better recall.

### Configuration
- Added `SUPABASE_SERVICE_KEY` requirement for server-side API queries.

---

## 2025-12-23 (Session: Persistence & Synchronization) - 22:45 (GMT+8)
### Added
- **Canvas Layout Persistence:**
  - Implemented `localStorage` serialization for React Flow nodes and edges.
  - Layout now restores automatically upon page refresh.
- **Custom Confirmation UI:**
  - Replaced native `window.confirm()` with a custom React modal to eliminate "blinking" and auto-cancellation bugs caused by browser event collisions.

### Changed
- **Deletion Synchronization:**
  - Unified the deletion flow between Vault and Canvas.
  - Deleting an asset from the Vault now triggers a real-time removal of its corresponding node on the Canvas via `deletedAssetId` prop.
- **Keyboard Support:**
  - Enabled `Backspace` key support for node deletion on the Canvas, fully integrated with the Vault deletion flow.

### Fixed
- **Duplication Bug:**
  - Resolved an issue where "Moving to Vault" created duplicate assets for file uploads.
  - Refactored `handleMoveToVault` to update existing assets with AI metadata instead of creating new records.
- **Event Collision:**
  - Disabled drag-and-drop behavior on trash icons to prevent parent event interference.

## 2025-12-21 (Session: The Ingestion Funnel) - 21:48 (GMT+8)
### Added
- **The Staging Area (Part A):**
  - Refactored Sidebar into a dual-layered layout (60% Staging, 40% Vault Categories).
  - Implemented a chat-like interface for "catching" ideas, raw text, and links.
  - Added support for multi-file ingestion (Images, PDFs, Docs) via a dedicated `+` button and drag-and-drop.
  - Implemented "Bubble" UI for ingested assets with icon/preview support.
- **PWA Capabilities:**
  - Added `manifest.json` for mobile "Install App" support.
  - Configured Next.js metadata and viewport settings for standalone mobile use.
- **Database Architecture:**
  - Created `staging_items` table in Supabase for uncategorized ingestion.
  - Implemented idempotent `schema.sql` for easy environment setup.

### Changed
- **Sidebar UX:** Switched from a basic image grid to a chronological ingestion stream.
- **Data Flow:** Ingested files now land in "Staging" before reaching the permanent "Vault Categories."
- **Next.js Metadata:** Refactored `layout.tsx` to handle the new `viewport` export requirement.

## 2025-12-16 (Session Midnight)
### Added
- **Intelligence Layer:**
  - Integrated **Gemini 1.5 Pro** via Google Generative AI SDK.
  - Added `Inspector` component for contextual interactions.
  - Implemented "Chat with Image" feature (talk to selected node).
  - Implemented Automated Analysis Pipeline (Image Node -(wire)-> Gemini Node).
- **Supabase Integration:**
  - Replaced Firebase with Supabase Auth (Google OAuth).
  - Implemented `Supabase Storage` ('vault' bucket) for persistent file hosting.
  - Implemented `Supabase Database` ('assets' table) for metadata.
- **UI/UX:**
  - Added "Processors" list to Inspector when nothing is selected.
  - Improved Sidebar with "The Vault" drag-and-drop zone.

### Changed
- **Pivoted Backend:** Moved from Firebase/Google Photos to **Supabase Fortress** architecture.
- **Refactoring:** Removed `firebase.js` and cleaned up `page.tsx` to use Supabase client.
- **Model Update:** Pinned Gemini model to `gemini-1.5-flash-001` (then to `gemini-1.5-pro` for stability).
---

## Phase 1: The "Exoskeleton" (December 2025)
*Goal: A working spatial prototype with Supabase integration.*

---
## [0.6.1] - 2026-01-27
### Mixed Media & Production
- **Feature**: Master Article Builder (Canvas + Vault + Web sources)
- **Feature**: Graph-based Context Traversal
- **Feature**: Multi-Modal Knowledge Graph (Image Node → AI Analysis → Article)
- **Feature**: "Save Chat to Note" for Image Nodes
- **UX**: Canvas edge deletion & source selection UI

## [0.6.0] - 2026-01-26-15 (Session: The Exoskeleton) - 15:10 (GMT+8)

### Added
- **Project Structure:** Initialized Next.js app with TypeScript, Tailwind CSS, & React Flow.
- **Authentication:** Integrated Google Sign-In via Firebase Auth.
    - Added `offline` access scope to ensure long-term access to Google Photos.
- **The Vault (Sidebar):**
    - Fetches last 20 media items from Google Photos.
    - Implemented HTML5 Drag-and-Drop capability.
- **The Stage (Canvas):**
    - Infinite canvas using `@xyflow/react`.
    - Custom `ImageNode` component that renders photos dropped from the Sidebar.
- **UI Architecture:** Established the 3-pane "Cockpit" layout (Sidebar, Canvas, Inspector).

### Fixed
- **Firebase Configuration:** Resolved `auth/api-key-not-valid` error by updating `.env.local` with valid project credentials.
- **Type Safety:** Corrected TypeScript errors in `page.tsx`, `Canvas.tsx`, and `ImageNode.tsx` (specifically around `NodeProps`, `User` types, and null safety).
- **Credentials:** Fixed `credential` null check in login flow to handle cases where Google Auth doesn't return immediate credentials.

### Work in Progress
- **AI Integration:** The connection between the Canvas nodes and Gemini (The Oracle) is currently impending.
