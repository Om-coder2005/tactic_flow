**TACTICFLOW**

Master Build Specification

*For AI Coding Agents · Antigravity · Codex · Claude · Cursor*

Version 1.0 · April 2026

Stack: React + Vite + TypeScript + react-konva + Zustand \| FastAPI +
PostgreSQL

**HOW TO USE THIS DOCUMENT**

This is the single source of truth for building TacticFlow from scratch.
It is written for AI coding agents (Antigravity, Codex, Claude, Cursor)
to follow with minimum ambiguity. Read the entire document before
writing any code. Never skip a section.

**Agent Instructions**

> **CRITICAL: Every section marked \[AGENT RULE\] is non-negotiable.
> Deviating from these rules will break multi-agent coordination or
> cause runtime errors.**

**Follow these rules when working from this document:**

1.  Read the full Architecture section before touching any file.

2.  Check the TacticalObject JSON schema before creating any canvas
    object.

3.  Use only the libraries listed in the Stack section --- do not
    introduce unlisted dependencies.

4.  Every feature must pass the Definition of Done checklist before
    marking complete.

5.  If a section has a \[GAP RESOLVED\] marker, that means it was
    missing from the original spec and has been filled in here ---
    follow the resolved version, not any older notes.

6.  When in doubt about a data shape, refer to the canonical schemas in
    Section 5.

7.  Never store secrets in frontend code. All API keys go in backend
    environment variables.

**Document Map**

Section 1 --- Project overview, vision, target users, success metrics

Section 2 --- Complete functional requirements (all FR items)

Section 3 --- UX/UI specification

Section 4 --- Technical stack with agent-specific constraints

Section 5 --- Canonical data schemas (TacticalObject, Board, Frame,
Formation)

Section 6 --- Full API specification (all endpoints, request/response
shapes)

Section 7 --- Database models

Section 8 --- Frontend architecture and module responsibilities

Section 9 --- Backend architecture and module responsibilities

Section 10 --- Playback and interpolation engine spec \[GAP RESOLVED\]

Section 11 --- AI Tactical Summary module (full spec)

Section 12 --- Export system spec

Section 13 --- Security requirements

Section 14 --- Performance targets and strategies

Section 15 --- Testing and QA

Section 16 --- Implementation roadmap and work-split for agents

Section 17 --- Definition of done

Section 18 --- Agent skills reference

**SECTION 1 --- PROJECT OVERVIEW**

**Product Name**

TacticFlow

**Vision**

Build the fastest and cleanest football tactics canvas for explaining
shape, spacing, movement, and phase-based behavior. Simple enough for
grassroots coaches; polished enough for analysts and content creators
producing professional tactical content.

**Target Users**

  ---------------- --------------------- -------------------- -------------------
  **User**         **Main Need**         **Pain Point**       **Success**

  Coach            Explain shape and     Too many steps,      Open board, teach
                   drills quickly        cluttered UI         instantly

  Analyst          Show phase changes    Limited clarity in   Precise scene
                   and rotations         static tools         control, clean
                                                              export

  Content Creator  Visuals for           Ugly exports, no     Broadcast-quality
                   YouTube/Instagram/X   aspect ratios        tactical output

  Casual/Student   Explore systems and   Tools feel           Easy start with
                   ideas                 intimidating         templates
  ---------------- --------------------- -------------------- -------------------

**Success Metrics**

-   Time to first tactic drawn: under 30 seconds from first load.

-   80% of test users complete a basic board without any guidance.

-   Export success rate: above 95%.

-   Undo/redo reliability: above 99% in QA across all object types.

-   AI summary rated useful: at least 70% of first generations in user
    tests.

**Non-Goals for v1**

-   Full club management or team roster administration.

-   Real-time collaborative whiteboarding (multi-user).

-   Full video editor or 3D visualization.

-   External match data or video provider integrations.

-   Voice synthesis for AI summaries.

**SECTION 2 --- FUNCTIONAL REQUIREMENTS**

**FR-1: Canvas and Pitch**

-   Support full pitch, half pitch, attacking-third, and plain board
    views.

-   Multiple pitch themes: classic green, dark tactical, minimal white.

-   Zoom, pan, reset view, and fit-to-screen controls.

-   Locked background layer: pitch cannot be accidentally selected or
    dragged.

**FR-2: Tactical Objects**

-   Object types: player node, goalkeeper node, ball marker, neutral
    marker, cone, ladder, mini-goal, mannequin, zone marker.

-   Operations on all objects: drag, duplicate, delete, resize (where
    applicable), rotate (where applicable), lock.

-   Node editing: label text, number, fill color, outline color, style
    (circle/square/diamond).

-   Zone editing: fill opacity, stroke color, label.

**FR-3: Drawing Tools**

-   Select tool (click + drag marquee).

-   Pencil/freehand tool.

-   Straight arrows with arrowhead style options.

-   Curved arrows with draggable bend handles.

-   Dashed lines (straight and curved variants).

-   Shapes: rectangle, circle, triangle, polygon.

-   Text notes and numbered callouts.

-   Eraser/delete.

**FR-4: Editing Workflow**

-   Undo/redo stack --- minimum 50 steps, no cap in practice.

-   Multi-select via marquee drag or shift-click.

-   Duplicate selected objects (Ctrl/Cmd+D).

-   Bring forward / send backward / bring to front / send to back.

-   Snap-to-grid guides and alignment helpers (toggleable).

-   Right-click context menu and long-press on touch.

-   Keyboard shortcuts: Delete/Backspace to remove, Ctrl+Z/Y for
    undo/redo, Ctrl+A for select all.

**FR-5: Formations**

-   11v11 prebuilt: 4-3-3, 4-2-3-1, 4-4-2, 3-4-3, 3-5-2, 4-1-4-1, 5-4-1.

-   Small-sided prebuilt: 5v5, 7v7, 8v8, futsal.

-   Formation preview ghost shown before placement confirmation.

-   All generated formations are fully editable immediately after
    placement.

-   Custom formation saving: user saves current node layout as a named
    formation.

-   Formation coordinates are pitch-relative percentages, NOT pixel
    values.

**FR-6: Frames and Playback**

-   Frame timeline at bottom of screen: add, duplicate, reorder, delete
    frames.

-   Each frame stores a complete snapshot of all objects and drawing
    state.

-   Playback interpolates movable node (player/ball) positions between
    frames.

-   Arrows, zones, and text annotations are frame-controlled: they do
    not interpolate, they snap between frames.

-   Objects absent in Frame N but present in Frame N+1 fade in; objects
    removed fade out.

-   Each frame has a configurable duration_ms (default 1800ms, range
    500--10000ms).

-   Playback easing: ease-in-out cubic for all node movements.

-   Export playback as video/WebM is a v1.1 feature; v1 must support
    reliable animated in-app preview.

**FR-7: Export and Sharing**

-   Single frame export: PNG, JPG.

-   Multi-frame export: PDF (one page per frame).

-   Export presets: Instagram portrait (1080x1350), YouTube thumbnail
    (1280x720), Presentation slide (1920x1080), A4 PDF.

-   Video/WebM export: v1.1 only.

-   Project save to user account with autosave (debounced 3s after last
    change).

-   Autosave uses optimistic concurrency: client sends its last known
    updated_at; server rejects with 409 if stale.

-   Optional read-only share links: v1.1.

**FR-8: Presentation Mode**

-   Hide all UI chrome (toolbars, panels, timeline).

-   Show full pitch with only frame navigation controls visible.

-   Keyboard: Right arrow or Space = next frame, Left arrow = previous
    frame, Esc = exit.

-   Optional spotlight mode: dims pitch outside selected zone.

**FR-9: Authentication and Sessions**

-   Guest session: user can start immediately with no signup; project
    stored in session.

-   Guest-to-user conversion: POST /auth/convert-guest transfers guest
    project ownership to new account.

-   Registered user: email + password auth, JWT in httpOnly cookie.

-   Guest sessions expire after 7 days of inactivity.

**SECTION 3 --- UX/UI SPECIFICATION**

**Layout**

Top bar: project title (editable inline) \| undo \| redo \| save status
indicator \| export button \| present button \| settings.

Left toolbar: select \| node \| ball \| pencil \| arrow \| curve \|
shape \| text \| eraser.

Right properties panel: contextual settings for the selected object or
active tool. Hidden when nothing is selected.

Bottom timeline: frame thumbnails \| add frame \| play/pause \| frame
duration control.

Main canvas: pitch and all tactical objects. Takes up the remaining
viewport.

**UX Rules**

-   Do not require login or dashboard before the board is shown.

-   Default tool on load: select tool.

-   Every destructive action (delete, clear board) must be reversible
    via undo.

-   Draw mode and select mode must be visually distinct (cursor change +
    toolbar indicator).

-   Advanced settings appear only when an object is selected (right
    panel).

-   Exports reachable in maximum two clicks from any state.

**Mode Presets**

-   Coach mode: fewer tools visible, larger nodes, simplified toolbar.

-   Creator mode: aspect-ratio export presets promoted, larger labels.

-   Analyst mode: full toolset, phase labels, frame timeline prominently
    shown.

**Quick Phase Labels**

Quick-apply phase labels for frames: Build-up \| Mid-block \| High Press
\| Rest Defence \| Final Third. Stored as metadata on the frame,
displayed in timeline.

**Accessibility**

-   Keyboard navigation for all toolbar actions, dialogs, and frame
    controls.

-   Visible focus ring on all interactive elements.

-   All touch targets minimum 44x44px.

-   Color-blind-safe default team color presets (use shape + color, not
    color alone, to differentiate teams).

-   High contrast for tool icons and node labels.

-   Labels readable in all export formats at default size.

**Dark and Light Mode**

The app shell supports dark and light mode. The pitch canvas uses its
own theme (classic green / tactical dark / minimal). These are
independent settings.

**SECTION 4 --- TECHNICAL STACK**

> **AGENT RULE: Do not add libraries outside this list without explicit
> approval. Each addition must be documented in a /docs/adr/ file.**

**Frontend**

  ------------------ ------------------ ----------------------------------
  **Library**        **Version          **Purpose**
                     Constraint**       

  React              \^18               UI framework

  Vite               \^5                Build tooling and dev server

  TypeScript         \^5.4              Type safety across frontend

  Tailwind CSS       \^3                Utility styling for UI shell

  react-konva        \^18 compatible    Canvas rendering engine

  konva              \^9                Underlying Konva engine

  Zustand            \^4                Global state management

  pdf-lib            \^1                Client-side PDF assembly

  react-query        \^5                Server state and API caching
  (TanStack)                            
  ------------------ ------------------ ----------------------------------

**Backend**

  ------------------ ------------------ ----------------------------------
  **Library**        **Version          **Purpose**
                     Constraint**       

  Python             \^3.11             Runtime

  FastAPI            \^0.111            API framework

  Pydantic           v2                 Request/response validation

  SQLAlchemy         \^2                ORM and async DB access

  asyncpg            \^0.29             Async PostgreSQL driver

  Alembic            \^1.13             Database migrations

  python-jose        \^3                JWT handling

  slowapi            latest             Rate limiting

  httpx              \^0.27             Async HTTP client for LLM calls
  ------------------ ------------------ ----------------------------------

**Database**

-   PostgreSQL 15+ with JSONB support for board and frame snapshots.

-   All JSON fields stored as JSONB. Never use TEXT for structured data.

**Storage**

-   Development: local filesystem for export output files.

-   Production: S3-compatible object storage (AWS S3 or Cloudflare R2).
    Use signed URLs for all private export downloads.

**Auth**

-   JWT stored in httpOnly, Secure, SameSite=Strict cookie.

-   Guest sessions use a separate signed session token with guest role.

-   Never return raw password hash. Never store plaintext passwords.

-   Use bcrypt with cost factor 12 for password hashing.

**SECTION 5 --- CANONICAL DATA SCHEMAS**

> **AGENT RULE: All agents must use these exact schemas. Do not invent
> field names. If a field is not in this spec, it does not exist in
> v1.**

**5.1 TacticalObject --- Discriminated Union**

All objects on the canvas share a base shape and extend it by type. Use
the \'type\' field as the discriminator.

**Base fields (all objects)**

> { \"id\": \"string (uuid)\",
>
> \"type\":
> \"player\|goalkeeper\|ball\|cone\|ladder\|mini_goal\|mannequin\|zone\|arrow\|curved_arrow\|dashed_arrow\|dashed_curved\|shape\|text\|callout\|freehand\",
>
> \"x\": \"number (pitch-relative 0--100)\",
>
> \"y\": \"number (pitch-relative 0--100)\",
>
> \"locked\": \"boolean\",
>
> \"z_index\": \"number\" }

**Player / Goalkeeper node extensions**

> { \"label\": \"string\",
>
> \"number\": \"string\|null\",
>
> \"fill_color\": \"hex string\",
>
> \"outline_color\": \"hex string\",
>
> \"style\": \"circle\|square\|diamond\",
>
> \"team\": \"home\|away\|neutral\" }

**Arrow / CurvedArrow extensions**

> { \"from_x\": number, \"from_y\": number,
>
> \"to_x\": number, \"to_y\": number,
>
> \"bend_x\": number\|null, \"bend_y\": number\|null, // for curved
> arrows
>
> \"color\": \"hex string\",
>
> \"width\": number,
>
> \"dash\": boolean,
>
> \"arrowhead\": \"open\|filled\|none\" }

**Zone / Shape extensions**

> { \"width\": number, \"height\": number,
>
> \"shape_type\": \"rect\|circle\|triangle\|polygon\",
>
> \"fill_color\": \"hex string\",
>
> \"fill_opacity\": number (0.0--1.0),
>
> \"stroke_color\": \"hex string\",
>
> \"label\": \"string\|null\" }

**Text / Callout extensions**

> { \"text\": \"string\",
>
> \"font_size\": number,
>
> \"color\": \"hex string\",
>
> \"background\": \"hex string\|null\",
>
> \"callout_number\": \"number\|null\" }

**Freehand extension**

> { \"points\": \[number, \...\], // flat \[x0,y0,x1,y1,\...\] array of
> pitch-relative coords
>
> \"color\": \"hex string\",
>
> \"width\": number }

**5.2 BoardSnapshot**

> { \"schema_version\": \"number (current: 1)\",
>
> \"pitch_type\": \"full\|half\|attacking_third\|plain\",
>
> \"theme\": \"classic_green\|tactical_dark\|minimal\",
>
> \"objects\": \[TacticalObject, \...\] // all objects for this frame
>
> }

**5.3 Frame**

> { \"id\": \"uuid\",
>
> \"project_id\": \"uuid\",
>
> \"name\": \"string\",
>
> \"phase_label\":
> \"build_up\|mid_block\|high_press\|rest_defence\|final_third\|null\",
>
> \"order_index\": \"number\",
>
> \"duration_ms\": \"number (500--10000, default 1800)\",
>
> \"snapshot\": BoardSnapshot }

**5.4 FormationTemplate**

> { \"id\": \"string\",
>
> \"name\": \"string (e.g. 4-3-3)\",
>
> \"format\": \"11v11\|7v7\|5v5\|futsal\",
>
> \"category\": \"balanced\|attacking\|defensive\",
>
> \"is_builtin\": boolean,
>
> \"owner_user_id\": \"uuid\|null\",
>
> \"nodes\": \[{ \"role\":
> \"GK\|RB\|CB\|LB\|CDM\|CM\|CAM\|RW\|LW\|ST\|etc\", \"x\": number,
> \"y\": number }\] }
>
> *All x/y in FormationTemplate nodes are pitch-relative percentages
> (0--100). Never hardcode pixel values.*

**5.5 Schema Versioning and Migration**

Every BoardSnapshot carries a schema_version integer. When the object
shape changes between versions, the backend migration service handles
transformation.

-   schema_version 1: current spec as defined above.

-   When loading a board with schema_version \< current, call
    BoardMigrationService.migrate(snapshot, from_version) before
    returning to frontend.

-   Never silently drop unknown fields. Log and store them in a
    \'unknown_extensions\' array.

**SECTION 6 --- FULL API SPECIFICATION**

Base path: /api/v1 \| Format: JSON \| Auth: Bearer JWT via httpOnly
cookie

**Standard Error Envelope**

> { \"error\": { \"code\": \"ERROR_CODE_STRING\", \"message\": \"human
> readable\", \"fields\": { \"field\": \"reason\" } \| null } }

**6.1 Auth Endpoints**

**POST /auth/guest**

Create a guest session. No body required.

> Response 200: { \"session_id\": \"string\", \"user\": { \"id\":
> \"uuid\", \"role\": \"guest\" } }

**POST /auth/register**

> Body: { \"email\": \"string\", \"password\": \"string (min 8 chars)\",
> \"name\": \"string\" }
>
> Response 201: { \"user\": { \"id\", \"email\", \"name\" }, \"token\":
> \"string\" }

**POST /auth/login**

> Body: { \"email\": \"string\", \"password\": \"string\" }
>
> Response 200: { \"user\": { \"id\", \"email\", \"name\" }, \"token\":
> \"string\" }

**POST /auth/logout**

> Response 204: No content. Clears httpOnly cookie.

**POST /auth/convert-guest \[GAP RESOLVED\]**

> **This endpoint was missing from the original spec. It is required for
> guest-to-user conversion.**
>
> Body: { \"guest_session_id\": \"string\", \"email\": \"string\",
> \"password\": \"string\", \"name\": \"string\" }
>
> Response 200: { \"user\": { \"id\", \"email\", \"name\" },
> \"projects_transferred\": number }

Transfers all projects where user_id = guest_id to the new registered
user. Deletes guest session.

**6.2 Project Endpoints**

**GET /projects**

> Query: ?page=1&limit=20&sort=updated_at_desc
>
> Response 200: { \"items\": \[Project\], \"total\": number, \"page\":
> number }

**POST /projects**

> Body: { \"title\": \"string (max 120)\", \"pitch_type\":
> \"full\|half\|attacking_third\|plain\", \"theme\":
> \"classic_green\|tactical_dark\|minimal\" }
>
> Response 201: Project

**GET /projects/:id**

> Response 200: Project with board and frames included

**PATCH /projects/:id**

> Body: { \"title\"?, \"pitch_type\"?, \"theme\"? }
>
> Response 200: Project

**DELETE /projects/:id**

> Soft delete. Sets is_deleted=true. Response 204.

**6.3 Board Endpoints**

**GET /projects/:id/board**

> Response 200: { \"board_id\", \"project_id\", \"pitch_type\",
> \"viewport\": {zoom, x, y}, \"active_frame_id\", \"schema_version\",
> \"updated_at\" }

**PUT /projects/:id/board \[CONCURRENCY LOCK --- GAP RESOLVED\]**

> **This endpoint uses optimistic concurrency. Client must send its last
> known updated_at. If the server\'s updated_at is newer, return 409
> Conflict.**
>
> Body: { \"pitch_type\", \"viewport\": {zoom, x, y},
> \"active_frame_id\", \"client_updated_at\": \"ISO8601 string\" }
>
> Response 200: Updated board. Response 409: { \"error\": { \"code\":
> \"STALE_WRITE\", \"server_updated_at\": \"ISO8601\" } }

**6.4 Frame Endpoints**

**GET /projects/:id/frames**

> Response 200: \[Frame\] ordered by order_index

**POST /projects/:id/frames**

> Body: { \"name\": \"string\", \"phase_label\"?, \"duration_ms\"?,
> \"snapshot\": BoardSnapshot, \"insert_after_id\"? }
>
> Response 201: Frame

**PUT /projects/:id/frames/:frame_id**

Replace entire frame snapshot.

> Body: { \"snapshot\": BoardSnapshot }
>
> Response 200: Frame

**PATCH /projects/:id/frames/:frame_id**

Update metadata only (name, phase_label, duration_ms, order_index).

> Body: { \"name\"?, \"phase_label\"?, \"duration_ms\"?,
> \"order_index\"? }
>
> Response 200: Frame

**DELETE /projects/:id/frames/:frame_id**

> Response 204. Reject if this is the last frame (return 422).

**6.5 Formation Endpoints**

**GET /formations**

> Query:
> ?format=11v11\|7v7\|5v5\|futsal&category=balanced\|attacking\|defensive
>
> Response 200: \[FormationTemplate\]

**POST /formations**

Save user-defined custom formation.

> Body: { \"name\": \"string (max 60)\", \"format\":
> \"11v11\|7v7\|5v5\|futsal\", \"nodes\": \[{ \"role\", \"x\", \"y\" }\]
> }
>
> Response 201: FormationTemplate

**DELETE /formations/:id**

> Only for formations where is_builtin=false and owner_user_id = current
> user. Response 204.

**6.6 Export Endpoints**

**POST /projects/:id/exports**

> Body: { \"type\": \"png\|jpg\|pdf\", \"frame_ids\": \[\"uuid\",\...\],
> \"preset\": \"instagram\|youtube\|slide\|a4\|custom\", \"width\"?,
> \"height\"?, \"include_ai_summary_id\"?: \"uuid\|null\" }
>
> Response 202: { \"job_id\": \"uuid\", \"status\": \"queued\" }

**GET /exports/:job_id**

> Response 200: { \"job_id\", \"status\":
> \"queued\|processing\|completed\|failed\", \"download_url\"?: \"signed
> URL\", \"error_message\"?: \"string\" }

**6.7 AI Summary Endpoints**

**POST /ai/summaries**

> Body: { \"project_id\", \"scope\":
> \"current_frame\|selected_frames\|full_sequence\",
>
> \"frame_ids\": \[\"uuid\",\...\],
>
> \"mode\": \"coach\|analyst\|content_creator\|simple\",
>
> \"tone\": \"concise\|balanced\|detailed\",
>
> \"include_sections\":
> \[\"short_summary\",\"detailed_explanation\",\"speaking_points\",\"risks\",\"caption_ideas\"\],
>
> \"user_intent\"?: \"string (max 400 chars)\", \"stream\"?: boolean }
>
> Response 202: { \"summary_id\": \"uuid\", \"status\": \"processing\" }
>
> If stream=true: text/event-stream with sections delivered as SSE
> events.

**GET /ai/summaries/:id**

> Response 200: AISummary with full output

**POST /ai/summaries/:id/regenerate**

> Body: { \"sections\": \[\"speaking_points\"\], \"tone\"? }
>
> Response 202: { \"summary_id\", \"status\": \"processing\" }

**PATCH /ai/summaries/:id**

> Body: { \"title\"?, \"is_pinned\"?: boolean, \"user_edited_output\"?:
> Partial\<TacticalSummaryOutput\> }
>
> Response 200: AISummary

**DELETE /ai/summaries/:id**

> Response 204

**SECTION 7 --- DATABASE MODELS**

> **AGENT RULE: Use Alembic for all schema migrations. Never ALTER TABLE
> manually in production.**

**Users**

> id UUID PRIMARY KEY DEFAULT gen_random_uuid()
>
> email VARCHAR(254) UNIQUE NOT NULL
>
> name VARCHAR(120) NOT NULL
>
> password_hash VARCHAR(72) NULLABLE \-- null for social-only auth
>
> role VARCHAR(20) NOT NULL DEFAULT \'user\' \-- user\|guest\|admin
>
> created_at TIMESTAMPTZ DEFAULT now()
>
> updated_at TIMESTAMPTZ DEFAULT now()

**Sessions**

> id UUID PRIMARY KEY
>
> user_id UUID REFERENCES users(id) ON DELETE CASCADE
>
> token_hash VARCHAR(128) NOT NULL
>
> expires_at TIMESTAMPTZ NOT NULL
>
> created_at TIMESTAMPTZ DEFAULT now()

**Projects**

> id UUID PRIMARY KEY DEFAULT gen_random_uuid()
>
> user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL
>
> title VARCHAR(120) NOT NULL
>
> pitch_type VARCHAR(30) NOT NULL DEFAULT \'full\'
>
> theme VARCHAR(30) NOT NULL DEFAULT \'classic_green\'
>
> is_deleted BOOLEAN DEFAULT false
>
> created_at TIMESTAMPTZ DEFAULT now()
>
> updated_at TIMESTAMPTZ DEFAULT now()
>
> INDEX idx_projects_user_updated ON projects(user_id, updated_at DESC)

**Boards**

> id UUID PRIMARY KEY DEFAULT gen_random_uuid()
>
> project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE NOT
> NULL
>
> viewport_json JSONB NOT NULL DEFAULT \'{\"zoom\":1,\"x\":0,\"y\":0}\'
>
> active_frame_id UUID NULLABLE
>
> schema_version INTEGER NOT NULL DEFAULT 1
>
> created_at TIMESTAMPTZ DEFAULT now()
>
> updated_at TIMESTAMPTZ DEFAULT now()

**Frames**

> id UUID PRIMARY KEY DEFAULT gen_random_uuid()
>
> project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL
>
> name VARCHAR(120) NOT NULL DEFAULT \'Frame 1\'
>
> phase_label VARCHAR(30) NULLABLE
>
> order_index INTEGER NOT NULL
>
> duration_ms INTEGER NOT NULL DEFAULT 1800 CHECK (duration_ms BETWEEN
> 500 AND 10000)
>
> snapshot_json JSONB NOT NULL
>
> created_at TIMESTAMPTZ DEFAULT now()
>
> updated_at TIMESTAMPTZ DEFAULT now()
>
> INDEX idx_frames_project_order ON frames(project_id, order_index ASC)

**FormationTemplates**

> id VARCHAR(80) PRIMARY KEY
>
> owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE NULLABLE
>
> name VARCHAR(80) NOT NULL
>
> format VARCHAR(20) NOT NULL \-- 11v11\|7v7\|5v5\|futsal
>
> category VARCHAR(20) NOT NULL DEFAULT \'balanced\'
>
> nodes_json JSONB NOT NULL
>
> is_builtin BOOLEAN DEFAULT false

**ExportJobs**

> id UUID PRIMARY KEY DEFAULT gen_random_uuid()
>
> project_id UUID REFERENCES projects(id) ON DELETE CASCADE
>
> user_id UUID REFERENCES users(id)
>
> type VARCHAR(10) NOT NULL \-- png\|jpg\|pdf\|webm
>
> status VARCHAR(20) NOT NULL DEFAULT \'queued\' \--
> queued\|processing\|completed\|failed
>
> request_json JSONB NOT NULL
>
> output_url TEXT NULLABLE
>
> error_message TEXT NULLABLE
>
> created_at TIMESTAMPTZ DEFAULT now()
>
> updated_at TIMESTAMPTZ DEFAULT now()

**AISummaries**

> id UUID PRIMARY KEY DEFAULT gen_random_uuid()
>
> project_id UUID REFERENCES projects(id) ON DELETE CASCADE
>
> user_id UUID REFERENCES users(id)
>
> scope VARCHAR(30) NOT NULL
>
> frame_ids_json JSONB NOT NULL \-- array of frame UUIDs
>
> mode VARCHAR(30) NOT NULL
>
> tone VARCHAR(30) NOT NULL
>
> prompt_version INTEGER NOT NULL DEFAULT 1
>
> model_provider VARCHAR(60) NOT NULL
>
> model_name VARCHAR(80) NOT NULL
>
> input_snapshot_json JSONB NOT NULL \-- TacticalFeatureSet stored here
>
> output_json JSONB NULLABLE
>
> output_section_provenance_json JSONB NULLABLE \-- tracks per-section
> prompt_version + generated_at
>
> user_edited_output_json JSONB NULLABLE
>
> status VARCHAR(20) NOT NULL DEFAULT \'processing\'
>
> is_pinned BOOLEAN DEFAULT false
>
> created_at TIMESTAMPTZ DEFAULT now()
>
> updated_at TIMESTAMPTZ DEFAULT now()

**SECTION 8 --- FRONTEND ARCHITECTURE**

**Repo Structure**

> frontend/
>
> src/
>
> app/ \-- App entry, routing, providers
>
> components/ \-- Shared UI components (Button, Modal, Toast, etc.)
>
> features/
>
> canvas/ \-- Stage, layers, zoom/pan, selection engine
>
> objects/ \-- Player, arrow, zone, text renderers and editors
>
> drawings/ \-- Freehand, pencil tools
>
> formations/ \-- Formation picker, ghost preview, placement
>
> timeline/ \-- Frame list, playback engine, interpolation
>
> export/ \-- Export modal, presets, job polling
>
> presentation/\-- Presentation mode, spotlight
>
> ai-summary/ \-- AI summary modal, panel, history
>
> stores/ \-- Zustand stores
>
> hooks/ \-- Shared hooks
>
> lib/ \-- API client, utils, constants
>
> types/ \-- TypeScript types matching Section 5 schemas
>
> styles/ \-- Tailwind config, global CSS vars

**Zustand Stores**

**editorStore**

-   activeTool: ToolType

-   selectedObjectIds: string\[\]

-   canvasMode: \'select\' \| \'draw\'

-   history: BoardSnapshot\[\] (undo stack)

-   historyIndex: number

-   zoom: number, panX: number, panY: number

**projectStore**

-   currentProject: Project \| null

-   board: Board \| null

-   frames: Frame\[\]

-   activeFrameId: string \| null

-   isDirty: boolean

-   saveStatus: \'saved\' \| \'saving\' \| \'error\' \| \'conflict\'

**aiSummaryStore**

-   summaries: AISummary\[\]

-   activeSummaryId: string \| null

-   summaryScope: ScopeType

-   summaryMode: ModeType

-   summaryTone: ToneType

-   loadingState: \'idle\' \| \'loading\' \| \'streaming\' \| \'error\'

**Key Frontend Rules**

> **AGENT RULE: All canvas coordinates must use pitch-relative units
> (0--100). Never store pixel coordinates in state or snapshots.**

-   Convert pitch-relative coords to canvas pixels only at render time
    using a pitchToCanvas(x, y, stageSize) helper.

-   The Konva stage has two layers: backgroundLayer (pitch graphic, not
    selectable) and contentLayer (all objects).

-   Undo/redo stack operates on full BoardSnapshot immutable copies. Use
    immer for mutations.

-   Multi-select must support both marquee drag and shift-click. Keep
    selectedObjectIds in editorStore.

-   Autosave: debounce 3000ms after isDirty becomes true. Send PUT
    /board with client_updated_at. On 409, set saveStatus=\'conflict\'
    and show resolution dialog.

**SECTION 9 --- BACKEND ARCHITECTURE**

**Repo Structure**

> backend/
>
> app/
>
> api/v1/routes/
>
> auth.py, projects.py, boards.py, frames.py
>
> formations.py, exports.py, ai_summaries.py
>
> core/ \-- config, security, deps
>
> db/ \-- session, base, migrations
>
> models/ \-- SQLAlchemy ORM models
>
> schemas/ \-- Pydantic request/response schemas
>
> services/
>
> project_service.py, board_service.py, frame_service.py
>
> export_service.py, formation_service.py
>
> ai_summary_service.py
>
> tactical_feature_extractor.py
>
> prompt_builder.py
>
> llm_provider.py \-- provider abstraction
>
> schema_validator.py
>
> board_migration_service.py
>
> utils/
>
> main.py
>
> tests/
>
> alembic/
>
> requirements.txt

**LLMProvider Interface \[GAP RESOLVED\]**

> **This interface was missing from the original AI module spec. All LLM
> calls must go through this abstraction.**
>
> class LLMProviderProtocol(Protocol):
>
> async def generate_structured(
>
> self,
>
> system_prompt: str,
>
> user_prompt: str,
>
> schema: Type\[BaseModel\],
>
> temperature: float = 0.3,
>
> max_tokens: int = 1500,
>
> ) -\> BaseModel: \...
>
> async def generate_streaming(
>
> self,
>
> system_prompt: str,
>
> user_prompt: str,
>
> max_tokens: int = 1500,
>
> ) -\> AsyncIterator\[str\]: \...

Provider selection via environment variable LLM_PROVIDER (anthropic \|
openai). Default: anthropic. Implement AnthropicProvider and
OpenAIProvider separately, both satisfying LLMProviderProtocol.

**TacticalFeatureSet Schema \[GAP RESOLVED\]**

> **This intermediate schema was missing from the original spec. The
> feature extractor produces this; the prompt builder consumes it.**
>
> class TacticalFeatureSet(BaseModel):
>
> formation_detected: str \| None \# e.g. \'4-3-3\' or None if unclear
>
> formation_confidence: float \# 0.0--1.0 from heuristic, NOT from LLM
>
> unit_heights: list\[float\] \# avg y per positional line
>
> width_profile: str \# \'narrow\|medium\|wide\'
>
> half_space_occupation: int \# count of players in half-spaces
>
> central_lane_players: int
>
> arrow_intents: list\[str\] \# derived:
> \'run\|overlap\|underlap\|drop\|rotation\'
>
> ball_zones: list\[str\] \# per frame: \'left_back\|central_mid\|\...\'
>
> frame_count: int
>
> has_user_intent: bool
>
> labeled_player_pct: float \# fraction of players with non-empty labels
>
> has_zones: bool
>
> has_arrows: bool

confidence.overall in the AI output is computed from TacticalFeatureSet
heuristics BEFORE the LLM call. The LLM only fills confidence.notes, not
the numeric score.

**SECTION 10 --- PLAYBACK AND INTERPOLATION ENGINE \[GAP RESOLVED\]**

> **This entire section was missing from the original spec. Implement
> exactly as described here.**

**Overview**

Playback animates the tactical sequence by interpolating movable node
positions between adjacent frames. Non-movable elements (arrows, zones,
text, shapes) are frame-controlled: they do not interpolate --- they
snap at the frame boundary.

**What Interpolates vs. What Snaps**

  --------------------------- ------------------ -------------------------
  **Object Type**             **Behavior**       **Reason**

  player, goalkeeper          INTERPOLATES       Represents physical
                                                 movement

  ball                        INTERPOLATES       Represents ball movement

  arrow, curved_arrow,        SNAPS              Tactical annotations,
  dashed\_\*                                     frame-controlled

  zone, shape                 SNAPS              Zones are strategic
                                                 overlays

  text, callout               SNAPS              Labels are frame
                                                 annotations

  freehand                    SNAPS              Drawing overlays
  --------------------------- ------------------ -------------------------

**Interpolation Algorithm**

Use ease-in-out cubic (CSS cubic-bezier(0.42, 0, 0.58, 1.0)) for all
node movements.

> function easeInOutCubic(t: number): number {
>
> return t \< 0.5 ? 4 \* t \* t \* t : 1 - Math.pow(-2 \* t + 2, 3) / 2;
>
> }
>
> function interpolatePosition(from: {x,y}, to: {x,y}, rawT: number):
> {x,y} {
>
> const t = easeInOutCubic(rawT); // rawT is 0.0 to 1.0 linear time
>
> return { x: from.x + (to.x - from.x) \* t, y: from.y + (to.y - from.y)
> \* t };
>
> }

**Object Lifecycle Across Frames**

-   Object present in Frame N and Frame N+1 (same id): interpolate
    position.

-   Object present in Frame N but NOT in Frame N+1: fade out (opacity
    1→0) over last 20% of frame duration.

-   Object NOT in Frame N but present in Frame N+1: fade in (opacity
    0→1) over first 20% of next frame duration.

-   Object with locked=true: never interpolate. Always render at its
    stored position for the current frame.

**Playback Engine Implementation**

Implement as a usePlayback() hook in features/timeline/. It must:

8.  Accept frames\[\] and activeFrameIndex.

9.  Manage an internal requestAnimationFrame loop.

10. Track elapsed time against current frame\'s duration_ms.

11. Produce an interpolatedObjects map: { objectId: {x, y, opacity} } at
    each animation tick.

12. Advance to next frame when elapsed \>= duration_ms.

13. Pause on last frame (no loop in v1).

14. Expose: play(), pause(), seekToFrame(index), isPlaying,
    currentFrameIndex, interpolatedObjects.

**Frame Duration**

-   Default: 1800ms.

-   User-configurable per frame: 500ms to 10000ms.

-   Transition time is included within frame duration, not added to it.

**SECTION 11 --- AI TACTICAL SUMMARY MODULE**

**Architecture Flow**

> React canvas editor
>
> \| board/frame JSON
>
> v
>
> POST /api/v1/ai/summaries
>
> \|
>
> +\--\> tactical_feature_extractor.extract(board_data) \--\>
> TacticalFeatureSet
>
> +\--\> compute_confidence_score(features) \--\> float \[BACKEND ONLY,
> not LLM\]
>
> +\--\> prompt_builder.build(features, mode, tone, user_intent) \--\>
> PromptInput
>
> +\--\> llm_provider.generate_structured(prompt, TacticalSummaryOutput)
>
> +\--\> schema_validator.validate(result, TacticalSummaryOutput)
>
> +\--\> inject confidence score into output
>
> +\--\> persist to AISummaries table
>
> v
>
> Return AISummary to frontend

**TacticalSummaryOutput Schema**

> class TacticalSummaryOutput(BaseModel):
>
> title: str
>
> formation_summary: str
>
> shape_summary: str
>
> short_summary: str
>
> detailed_explanation: list\[str\]
>
> speaking_points: list\[str\]
>
> phase_observations: list\[PhaseObservation\]
>
> risks: list\[str\]
>
> caption_ideas: list\[str\]
>
> confidence: ConfidenceBlock
>
> class ConfidenceBlock(BaseModel):
>
> overall: float \# Injected by backend from TacticalFeatureSet
> heuristic
>
> notes: list\[str\] \# LLM-generated uncertainty notes only

**Section Provenance Tracking \[GAP RESOLVED\]**

> **Original spec had no way to track which sections were regenerated
> independently. Use this schema.**
>
> output_section_provenance_json: {
>
> \'speaking_points\': { \'prompt_version\': 2, \'generated_at\':
> \'ISO8601\', \'tone\': \'creator_friendly\' },
>
> \'short_summary\': { \'prompt_version\': 1, \'generated_at\':
> \'ISO8601\', \'tone\': \'balanced\' }
>
> }

**Prompt Design**

**System Prompt**

> You are an elite football tactical explanation assistant.
>
> Your task is to analyze structured football tactic-board data and
> produce grounded,
>
> readable explanations. Do not invent player identities, match context,
> or tactical
>
> intentions not supported by the input. When intent is uncertain, use
> language such as
>
> \'the board suggests\', \'this appears to show\', or \'a likely
> interpretation is\'.
>
> Write in clear football language suited to the requested mode.
>
> Return ONLY valid JSON matching the required schema. No preamble. No
> markdown.

**Developer Prompt Template**

> Mode: {mode} \| Tone: {tone}
>
> Formation detected: {formation_detected} (confidence:
> {formation_confidence:.0%})
>
> Pitch type: {pitch_type} \| Frames analyzed: {frame_count}
>
> User intent: {user_intent or \'not provided\'}
>
> Tactical features:
>
> \- Width profile: {width_profile}
>
> \- Half-space occupation: {half_space_occupation} players
>
> \- Arrow intents detected: {arrow_intents}
>
> \- Ball zones per frame: {ball_zones}
>
> \- Labeled players: {labeled_player_pct:.0%}
>
> Analyze shape, spacing, movement, role relationships, and likely
> tactical intention.
>
> For \'risks\', focus on structural vulnerabilities visible in the
> board.
>
> For \'caption_ideas\', write for social media (under 280 chars each).

**Rate Limiting \[GAP RESOLVED\]**

> **Original spec had no rate limiting on AI endpoints. This is required
> to prevent abuse and cost overrun.**

-   Free tier: 20 AI summary requests per user per day.

-   On limit hit: return 429 with header Retry-After: \<seconds until
    midnight UTC\>.

-   Per-request token estimation: reject boards with estimated \>6000
    tokens input with 422 and message \'Board too complex for AI
    summary. Reduce frame count or object count.\'

-   Estimate tokens as: sum(len(str(frame.snapshot_json)) for frame in
    selected_frames) / 4.

**Streaming Support**

-   If request body contains stream: true, use FastAPI StreamingResponse
    with text/event-stream.

-   Stream sections in order: short_summary → detailed_explanation →
    speaking_points → risks → caption_ideas.

-   Frontend renders sections as they arrive. Show skeleton loaders for
    pending sections.

-   On stream error mid-way: show completed sections and an error banner
    for the failed sections.

**SECTION 12 --- EXPORT SYSTEM**

**Export Presets**

  ------------------ -------------- -------------- -------------------------
  **Preset**         **Width px**   **Height px**  **Notes**

  instagram          1080           1350           Portrait 4:5

  youtube            1280           720            Thumbnail 16:9

  slide              1920           1080           Presentation 16:9

  a4                 2480           3508           A4 at 300 DPI

  custom             user-defined   user-defined   Max 4096px either
                                                   dimension
  ------------------ -------------- -------------- -------------------------

**PNG/JPG Export Process**

15. Frontend calls POST /exports with frame_ids and preset.

16. Backend creates ExportJob with status=queued.

17. BackgroundTask: render canvas using Konva server-side or
    html-to-image approach.

18. Crop/scale to preset dimensions.

19. Save to output storage. Set output_url.

20. Client polls GET /exports/:id until status=completed.

21. Client initiates download from signed output_url.

**PDF Export Process**

22. Same as above but for multi-frame: render each frame as an image.

23. Assemble into PDF using pdf-lib. One page per frame.

24. If include_ai_summary_id is set, append AI speaking_points as footer
    text on each page.

**AI Summary in Exports \[GAP RESOLVED\]**

> **This connection between the export and AI systems was missing from
> both original documents.**

When include_ai_summary_id is provided in the export request:

-   PDF exports: render speaking_points for the relevant frame as footer
    text below the pitch image on each page.

-   PNG/JPG exports: optionally overlay the short_summary as a caption
    strip below the pitch (if overlay=true in request).

-   Export renderer fetches the AISummary and matches phase_observations
    to frames by frame name.

**SECTION 13 --- SECURITY REQUIREMENTS**

> **AGENT RULE: All security requirements are mandatory. Do not defer
> any of these to \'later\'.**

**Authentication**

-   JWT in httpOnly, Secure, SameSite=Strict cookie. Never in
    localStorage.

-   Guest sessions expire: 7 days inactivity. Registered sessions
    expire: 30 days, refreshable.

-   All project read/write endpoints: assert project.user_id ==
    current_user.id. Never trust client-provided user_id.

**Input Validation**

-   Validate all payloads with Pydantic v2. Use strict mode.

-   Max lengths: project title 120, node label 40, notes 1000, custom
    formation name 60, user_intent 400.

-   Reject board snapshots larger than 2MB uncompressed.

-   Reject export requests with more than 50 frame_ids.

**Rate Limiting (slowapi)**

-   POST /auth/login: 5 per minute per IP.

-   POST /exports: 10 per minute per user.

-   POST /ai/summaries: 20 per day per user (see Section 11).

-   All other endpoints: 120 per minute per user.

**File Security**

-   Export outputs stored outside public execution path.

-   Download URLs are signed S3 URLs with 1-hour expiry.

-   Never expose raw storage bucket keys or paths in API responses.

**Frontend Security**

-   Sanitize all user-entered text before rendering in DOM (DOMPurify or
    equivalent).

-   CSP header set in production: restrict script-src to self.

-   Validate imported project JSON before loading into state. Reject
    unknown schema_version.

**AI Safety**

-   Make AI summary generation opt-in. Never auto-generate without user
    action.

-   Do not log raw tactical board content to external services --- only
    metadata (mode, tone, frame_count).

-   Allow users to delete all their AI summaries at any time.

-   Show UI disclaimer: \'AI summaries are interpretive assistance and
    may require review.\'

**SECTION 14 --- PERFORMANCE TARGETS**

  ----------------------------------- -----------------------------------
  **Metric**                          **Target**

  First interactive board load        \< 3 seconds on 10 Mbps connection

  Drag interaction frame rate         60 FPS on mid-range laptop

  Max objects before perf degrades    200 objects, still 60 FPS

  Export initiation response          \< 2 seconds to queued status

  AI summary response (single frame)  \< 10 seconds end-to-end

  Autosave round-trip                 \< 500ms on normal connection
  ----------------------------------- -----------------------------------

**Frontend Strategies**

-   Normalize canvas state: avoid deep object nesting in Zustand.

-   Memoize all Konva node components with React.memo.

-   Update only the contentLayer when objects change (not
    backgroundLayer).

-   Throttle pointermove/touchmove to 16ms intervals during drag.

-   Debounce autosave to 3 seconds after last change.

-   Use useMemo for expensive pitch-to-canvas coordinate transforms.

**Backend Strategies**

-   Paginate all project list endpoints (default limit 20).

-   Index: projects(user_id, updated_at DESC), frames(project_id,
    order_index ASC).

-   Use FastAPI background tasks for export jobs. For AI summaries \> 3
    frames, use background tasks too.

-   Store board snapshots as JSONB. Use JSONB GIN index if querying
    board contents in future.

**SECTION 15 --- TESTING AND QA**

**Frontend Test Areas**

-   Object creation, editing, deletion for each object type.

-   Drag and drop: player, zone, arrow.

-   Arrow bend handle drag.

-   Multi-select marquee and shift-click.

-   Undo/redo across all object operations.

-   Frame create, duplicate, reorder, delete.

-   Playback: interpolation renders correctly at t=0, t=0.5, t=1.0.

-   Export modal: preset selection, job polling, download trigger.

-   Autosave: 409 conflict shows resolution dialog.

-   Formation placement: ghost preview, placement, post-placement edit.

**Backend Test Areas**

-   Auth: register, login, guest create, convert-guest, token expiry.

-   Project CRUD with ownership checks.

-   Board save with optimistic concurrency (happy path and 409).

-   Frame CRUD and ordering.

-   Formation list and custom save.

-   Export job create, status poll.

-   AI summary create, get, regenerate, patch, delete.

-   TacticalFeatureExtractor unit tests for each extracted feature.

-   Schema validator: accept valid output, reject malformed.

**Manual QA Scenarios**

-   Apply formation, modify all players, export as PNG.

-   Create 3-frame tactical animation, play it, export as PDF.

-   Open board in two tabs simultaneously, edit in both, confirm 409 is
    handled.

-   Generate AI summary in coach mode and creator mode. Compare outputs.

-   Full guest session: create board → save → convert to user → confirm
    project transferred.

-   Presentation mode keyboard navigation.

-   Touch interactions on iPad-sized screen.

**Edge Cases**

-   300 objects on pitch --- confirm 60 FPS not broken.

-   Frame with 0 interpolatable objects (only arrows/zones) --- confirm
    playback does not crash.

-   AI summary request with empty board (no objects) --- confirm
    graceful message.

-   Export during active autosave --- confirm jobs do not conflict.

-   Corrupt board JSON pasted via import --- confirm rejection with
    user-friendly error.

-   Very long node labels (40+ chars) --- confirm truncation in exports.

**SECTION 16 --- IMPLEMENTATION ROADMAP AND AGENT WORK SPLIT**

**Phase 1: Tactical Board MVP (Frontend Only)**

-   React + Vite + TypeScript setup with Tailwind.

-   Pitch canvas with react-konva. Pitch-relative coordinate system.

-   Player nodes and ball markers with drag, label, color edit.

-   Select tool with multi-select.

-   Arrow and curved arrow tools.

-   Undo/redo with Zustand history.

-   Built-in formation picker with ghost preview.

-   Local draft save (localStorage for Phase 1 only --- replaced in
    Phase 2).

-   Basic export: PNG of current frame.

**Phase 2: Persistence, Frames, Export**

-   FastAPI backend setup with auth (register, login, guest,
    convert-guest).

-   PostgreSQL with Alembic migrations.

-   Project and board save/load via API.

-   Frame timeline: create, duplicate, reorder, delete.

-   Autosave with 409 conflict handling.

-   Playback engine with interpolation as specified in Section 10.

-   PNG, JPG, and PDF export via export jobs.

-   Presentation mode.

**Phase 3: AI Module and Polish**

-   AI summary module: TacticalFeatureExtractor, PromptBuilder,
    LLMProvider, SchemaValidator.

-   AI summary frontend: modal, panel, streaming display.

-   AI summary in PDF exports.

-   Custom formation saving.

-   Creator mode and Coach mode presets.

-   Rate limiting on all endpoints.

-   Security hardening (CSP, signed URLs, audit logs).

**Agent Work Split**

  ----------- ---------------- -------------------------------------------
  **Agent**   **Domain**       **Responsibilities**

  A           Frontend Canvas  Stage, layers, pitch rendering, zoom/pan,
              Core             coordinate transform, selection engine

  B           Tactical Objects Player/GK nodes, ball, arrows, zones, text,
                               freehand tools, formations

  C           Backend API      FastAPI app, all routes, auth, DB models,
                               migrations

  D           Export +         Export jobs, PDF assembly, presentation
              Presentation     mode, playback engine

  E           AI Module        Feature extractor, prompt builder, LLM
                               provider, schema validator, AI frontend

  F           QA + Schema      Schema validation, contract tests, E2E,
              Governance       documentation consistency
  ----------- ---------------- -------------------------------------------

**SECTION 17 --- DEFINITION OF DONE**

> **AGENT RULE: No feature is done until ALL items below are checked. No
> exceptions.**

**Feature Checklist**

-   Feature is usable end-to-end in the UI without console errors.

-   TypeScript compiles with zero errors (tsc \--noEmit).

-   Pydantic models validate all inputs/outputs with zero field
    mismatches.

-   API contract is documented and matches the spec in Section 6.

-   If backend-facing: endpoint returns correct status codes for happy
    path and error cases.

-   Undo/redo tested if feature modifies board state.

-   Export checked if feature appears in board output.

-   Auth/ownership check confirmed if feature accesses user data.

-   No secrets in frontend code.

-   No hardcoded pixel coordinates in canvas state or snapshots.

-   Documentation in /docs/ updated if schema or API changed.

**SECTION 18 --- AGENT SKILLS REFERENCE**

These are specific skill prompts and techniques each coding agent should
apply when working on this codebase. These are not general tips --- they
are precise behavioral rules that reduce hallucination and off-spec
output.

**Skill 1: Always Verify Schema Before Writing Code**

> *Apply this skill before writing any TypeScript interface, Pydantic
> model, or database column.*

-   Open Section 5 of this document first. Match your type exactly to
    the schema defined there.

-   If a field is not in Section 5, do not add it. Create a documented
    gap note instead.

-   For TypeScript: use discriminated unions based on the \'type\'
    field. Never use \'any\'.

-   For Pydantic: set model_config = ConfigDict(extra=\'forbid\') to
    catch extra fields immediately.

**Skill 2: Coordinate System Discipline**

> *Apply this skill anywhere x/y values appear in canvas code.*

-   ONLY pitch-relative units (0.0--100.0) are stored in state,
    snapshots, and the database.

-   Pixel conversion happens ONLY at render time inside the Konva
    component.

-   Create a single pitchToCanvas(x, y, stageWidth, stageHeight) util
    and use it everywhere.

-   If you find a pixel coordinate stored in state, it is a bug. Fix it
    immediately.

**Skill 3: Undo/Redo Correctness**

> *Apply this skill when implementing any feature that modifies canvas
> state.*

-   Every state-modifying action must push a full BoardSnapshot clone to
    the history stack BEFORE the mutation.

-   Use immer\'s produce() for all state mutations. Never mutate state
    directly.

-   Transient state (zoom, pan position, selected tool) is NOT part of
    the undo stack.

-   Test undo/redo specifically for: add object, delete object, move
    object, change color, add frame, delete frame.

**Skill 4: API Contract Matching**

> *Apply this skill when implementing any frontend API call or backend
> endpoint.*

-   Every API call in the frontend must exactly match the request shape
    in Section 6.

-   Every FastAPI route must return exactly the response shape in
    Section 6.

-   Use Zod on the frontend to validate API responses at runtime (do not
    trust the server blindly).

-   If an API response does not match the Zod schema, log the raw
    response and show a safe error state --- never crash.

**Skill 5: LLM Output Validation**

> *Apply this skill in the AI summary backend service.*

-   Never directly parse LLM output as trusted JSON. Always pass through
    schema_validator.validate() first.

-   If validation fails, retry ONCE with a stricter prompt: \'Return
    ONLY the JSON object. No markdown, no preamble, no trailing text.\'

-   If the second attempt also fails, store the raw failed output in
    internal logs only (not in the DB output_json field). Return a
    user-friendly 500 with no raw model output exposed.

-   confidence.overall must be set by the backend heuristic before
    calling the LLM. Never let the LLM self-report a numeric confidence
    score.

**Skill 6: Concurrency Safety**

> *Apply this skill for autosave and any PUT/PATCH endpoint that
> modifies board or frame state.*

-   Every PUT /board request must include client_updated_at.

-   Backend: compare client_updated_at with boards.updated_at. If client
    \< server, return 409.

-   Frontend: on 409, set saveStatus=\'conflict\'. Show a dialog: \'This
    board was updated from another tab. \[Overwrite\] \[Cancel\]\'.

-   If user chooses Overwrite: fetch latest board, merge local changes,
    retry save.

**Skill 7: Touch and Mobile Discipline**

> *Apply this skill anywhere pointer events or gesture handling is
> implemented.*

-   Pinch-to-zoom must be disabled while an object drag is in progress.
    Use a ref flag isDraggingObject to track this.

-   Long-press (500ms hold) opens the context menu on touch. Implement
    with a timer cleared on touchmove.

-   All interactive targets must have a minimum hit area of 44x44px even
    if the visual is smaller. Use Konva\'s hitStrokeWidth and a
    transparent hit area shape.

-   Test all interactions on a simulated touch device (Chrome DevTools
    touch emulation minimum).

**Skill 8: Security First**

> *Apply this skill for every feature that handles user-entered text or
> file upload.*

-   All node labels, text notes, and custom formation names: sanitize
    with DOMPurify before rendering in the DOM.

-   Never render unsanitized user input as innerHTML.

-   All export download URLs: use signed S3 URLs with 1-hour TTL. Never
    expose raw storage paths.

-   Every backend endpoint that accesses project data: assert
    project.user_id == current_user.id as the first check.

**END OF MASTER BUILD SPECIFICATION**

*TacticFlow v1.0 · All agents must follow this document exactly.*
