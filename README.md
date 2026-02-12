# Haven OS

**Haven OS** is a spatial operating system designed for creative workflows. It creates a "Cockpit for the Mind," allowing users to interact with their digital assets in an infinite spatial canvas, powered by generative AI.

## Core Features (v1.0 Fortress)

### 1. The Staging Area (Inbound Chat)
- **Chronological Ingestion:** A "catch-all" feed for your ideas, links, and raw files.
- **AI-Driven Categorization:** Powered by **Gemini 2.0 Flash**. One click to analyze, title, summarize, and tag raw data.
- **Move to Vault:** Transition crystallized thoughts into structured categories.

### 2. The Vault (Deep Storage)
- **Categorized Archives:** Automatic grouping of Images, Notes, Links, and Documents.
- **Secure Storage:** Powered by Supabase Storage & Database.
- **Drag-to-Stage:** Drag any crystallized asset onto the infinite canvas.
- **Semantic Search:** AI-powered conceptual search using vector embeddings.

### 3. The Stage (Persistent Canvas)
- **Infinite Workspace:** Powered by React Flow.
- **Real-time Persistence:** Your node layout, links, and notes are saved to `localStorage` and persist through page refreshes.
- **Bidirectional Sync:** Deleting an asset from the Vault instantly removes it from the Stage.

### 4. Haven Intelligence (JARVIS-like Partner)
- **Identity:** Proactive AI partner that knows it is Haven OS.
- **Vault Awareness:** Automatically fetches and references your recent assets.
- **Toolkit Integration:** Aware of all features (Repurpose, Transcribe, Calendar) and suggests when to use them.
- **Gemini 2.0 Flash:** High-speed multimodal analysis for ingestion and interaction.
- **Contextual Chat:** Select any node to open the Inspector and talk to your data.

### 5. The Scholar (Learning System)
- **Course Generation:** Transform knowledge into structured learning modules.
- **Quiz Master:** AI-generated quizzes to test mastery.
- **Semantic Search:** Deep retrieval of concepts across your Vault.

### 6. The Author (Writing & Production)
- **Bilingual Editor:** Dual-pane writing with English ↔ Bahasa Malaysia translation.
- **Ghostwriter Agent:** AI-powered content creation based on proven frameworks.
- **Master Article Builder:** Generate comprehensive articles from Canvas notes, Vault assets, and Web search.
- **Multi-Modal Graph:** Use Image Nodes and AI Vision analysis as direct research sources.

## Technology Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS + Lucide React
- **Canvas:** React Flow
- **Backend:** Supabase (Auth, DB, Storage, pgvector)
- **AI:** Google Gemini 2.0 Flash + text-embedding-004

## Getting Started

1. **Clone the repo**
2. **Install dependencies:** `npm install`
3. **Set up Environment Variables:**
   - `NEXT_PUBLIC_GEMINI_API_KEY`: Your Google AI Studio Key.
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   - `SUPABASE_SERVICE_KEY`: Your Supabase Service Role Key (for server-side API).
4. **Run SQL migrations:** Execute `schema.sql` in Supabase SQL Editor.
5. **Run development server:** `npm run dev`

## Upcoming Roadmap
- **Phase 1-8:** ✅ All Complete (Semantic Intelligence → Director)
## Upcoming Roadmap
- **Phase 1-9:** ✅ All Complete (Foundation -> Marketer)
- **Phase 10:** Vision Alignment ✅ (Deep Dive, Dual Language, Logo Design)
- **Next:** User Manual & System Optimization
- **Future:** AI Video Creation UI

