# Project Haven: The Spatial Intelligence OS
**Version:** 0.8 (The "Producer" Edition)
**Owner:** Jauharasi
**Start Date:** December 15, 2025 (12:19 PM GMT+8)
**Last Updated:** February 1, 2026
**Status:** Beta / Active Development
**Note:** This is an **Iterative / Living Document**. It will evolve as we build, incorporating feedback from both the User (Jauharasi) and the Architect.

---

## The 6 Pillars of Haven OS

Haven OS is built around **6 core pillars** that map to Jauharasi's creative workflow:

| Pillar | Purpose | Haven Features |
|--------|---------|----------------|
| 💡 **Light Bulb** | Capture & triage fleeting ideas | Staging, Vault, Freshness, Archive |
| 📚 **Learning** | Deep dive & systematic mastery | Canvas, Courses, Quizzes, Semantic Search |
| ✍️ **Writing** | Master articles, bilingual, platform-ready | Bilingual Editor, Repurposing Engine |
| 🏭 **Production** | Step-by-step product building | Workflow Manager, Template System |
| 🎬 **Content Creation** | Copywriting + Video creation | Ghostwriter, Script Builder, Storyboard |
| 📣 **Marketing** | Angles & strategies for products | Marketing Angle Generator |

---

## 1. Executive Summary
**The Problem:**
Modern creative work is fragmented. A "Builder" like Jauharasi keeps ideas in Google Keep, writes in Docs, codes in VS Code, stores assets in Google Photos, and chats with AI in a separate browser tab. This constant context-switching ("Island Hopping") causes cognitive drain and data loss.

**The Solution:**
Haven is not a new app to replace these tools. It is a Unified Spatial Interface (The Bridge) that sits on top of them. It uses a "Node-Based" canvas to visually connect your static storage (Google Drive/Photos) to dynamic intelligence (Gemini/Claude) in one workspace.

**The Philosophy:**
"Stop moving the data. Move the intelligence."

## 2. User Persona: "The Polymath Builder"
**Profile:** 41-year-old male, Ambivert, Branding Consultant & App Developer.

**Key Traits:** Needs deep focus ("Don't Drift"), manages massive archives (500GB Photos), works on multiple distinct projects (Kawan Makan, Jauharasi Consulting).

**Pain Point:** "I have the assets (Photos) and the tools (Gemini), but connecting them takes too many steps."

## 3. Core Features (The "Trifecta")

### A. The Inbound (Staging Area)
*   **Concept:** A chronological "Inbox" for raw ideas, files, and links.
*   **Behavior:** Chat-like interface where everything lands first. 
*   **The Oracle:** Gemini 2.0 Flash categorizes and distills raw data into "Crystallized Assets."

### B. The Vault (Deep Storage Layer)
*   **Concept:** A structured archive for categorized assets.
*   **Integrations:**
    *   **Internal:** Native Supabase storage for images and documents.
    *   **External:** Links and references.
*   **Behavior:** Assets are organized by type (Images, Notes, Links, Resources).

### C. The Stage (Dynamic Logic Layer)
*   **Concept:** An infinite 2D canvas (React Flow) for spatial synthesis.
*   **Behavior:** Drag-to-deploy from the Vault. Real-time `localStorage` persistence ensures your "map" is never lost.

## 4. Technical Architecture

### 4.1 Frontend Stack
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Vanilla CSS + Lucide React
- **Canvas Engine:** React Flow
- **Persistence:** LocalStorage Serialization

### 4.2 Backend Stack (The Fortress)
- **Authentication:** Supabase Auth (Google OAuth)
- **Database:** Supabase Postgres (`assets` & `staging_items` tables)
- **Storage:** Supabase Storage (`vault` bucket)
- **API:** Next.js Server Actions

### 4.3 Intelligence Layer
- **Provider:** Google Gemini API
- **Models:**
  - **Gemini 2.0 Flash** - Multimodal analysis, translation, content generation
  - **text-embedding-004** - 768-dimensional vector embeddings for semantic search
- **Pipeline:**
  - **Inbound:** AI-driven categorization/distillation of staging items.
  - **Search:** Vector similarity search via pgvector for conceptual matching.
  - **Writing:** Bilingual translation and Ghostwriter content generation.
  - **Contextual:** Chat with selected node via bidirectional Inspector.

## 5. User Interface (UI) Guidelines
**The Vibe:** "Director's Cut" / "Glassmorphism Cockpit"
**Theme:** Deep Charcoal (`#020617`), Muted Gold / Blue Accents.

**Layout:**
*   **Left Rail (The Funnel):** Dual-layered Sidebar (Staging + Vault).
*   **Center (The Stage):** Persistent Infinite Canvas.
*   **Right Rail (The Inspector):** Multi-node context, AI interaction, and specialized processors with tabbed switching.

## 6. Implementation Roadmap

### Phase 1-3: Foundation (Completed)
- [x] Bootstrap (Next.js, Supabase, React Flow)
- [x] Exoskeleton (Vault, Canvas, AI Node)
- [x] Producer (Staging, Ingestion, Persistence)
- [x] Product (Orchestrator, Transcription, Link Previews)

### Phase 4: The Curator (Completed ✅)
**Pillar: 💡 Light Bulb Moment**
- [x] Lifecycle Management (freshness badges, auto-archive)
- [x] Agent I/O foundation for interconnected workflows

### Phase 5: The Scholar (Completed ✅)
**Pillar: 📚 Learning**
- [x] Course Nodes with mastery tracking
- [x] Quiz Master Agent
- [x] Semantic Search with vector embeddings

### Phase 6: The Author (Current 🚀)
**Pillar: ✍️ Writing + 🎬 Content Creation (Copywriting)**
- [x] Bilingual Editor (English ↔ Bahasa Malaysia)
- [x] Ghostwriter Agent (Dan Koe Framework)
- [x] Master Article Builder
- [x] Multi-Source Generation (Canvas+Vault+Web)
- [x] Graph-Based Context
- [x] Repurposing Engine (Visual Node Creation + Chain Workflows)
- [x] Batch Repurposing (Multi-Select + Bulk Actions)
- [x] Audio Transcription (Whisper AI + Audio Nodes)
- [x] Haven Intelligence (JARVIS-like Persona + Vault Awareness)
- [x] Tablet Optimization (Responsive Dashboard)
- [x] Content Calendar (Scheduling UI + Weekly View)

### Phase 7: The Producer ✅
**Pillar: 🏭 Production**
- [x] Workflow Manager Node (Visual stage pipeline, progress tracking)
- [x] Product Templates (App Development, Digital Course, Content Launch)

### Phase 8: The Director ✅
**Pillar: 🎬 Content Creation (Video)**
- [x] Script Builder (ScriptNode + ScriptProcessor with AI Story Builder)
- [x] Format Presets (TikTok, Reel, YouTube Short, YouTube Long)
- [x] Hook Types (Question, Statement, Story, Shock)
- [x] Voice Styles (Casual, Professional, Energetic, Custom)
- [x] Storyboard Agent (StoryboardNode + StoryboardProcessor)
- [x] Visual Style Presets (Cinematic, Minimalist, Dynamic, Sketch, Corporate)
- [x] Scene Cards (Framing, Camera Movement, Timeline)
- [ ] AI Video Creation UI (Future)

### Phase 9: The Marketer ✅
**Pillar: 📣 Marketing**
- [x] Angle Generator Agent (AngleNode + AngleProcessor)
- [x] 6 Angle Types (Pain Point, Benefit, Story, Authority, Urgency, Curiosity)
- [x] Platform-specific Copy Variations (LinkedIn, Twitter, Instagram, Email, Ads)
- [x] Campaign Builder (CampaignNode + CampaignProcessor)
- [x] 4 Campaign Templates (Product Launch, Content Series, Event Promotion, Brand Awareness)
- [x] Multi-platform Post Scheduling with Timeline View

## 7. Immediate Action Plan
1. ~~**Phase 4 - The Curator**~~ ✅
2. ~~**Phase 5 - The Scholar**~~ ✅
3. ~~**Phase 6 - Bilingual Editor & Ghostwriter**~~ ✅
4. ~~**Phase 6 - Article Builder & Multi-Modal**~~ ✅
5. ~~**Phase 7 - The Producer**~~ ✅
6. ~~**Phase 8 - The Director (Script + Storyboard)**~~ ✅
7. ~~**Phase 9 - The Marketer (Angle Generator + Campaign Builder)**~~ ✅
8. ~~**Phase 10 - Vision Alignment (Deep Dive + Dual Language)**~~ ✅
9. **Next:** User Manual & System Optimization
9. **Future:** AI Video Creation UI
