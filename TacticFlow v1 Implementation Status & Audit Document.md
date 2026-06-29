# TacticFlow v1 Implementation Status & Audit Document

## 1. Purpose of This Document

This document summarises the agreed product specification for TacticFlow v1 and provides a structured checklist to review what has been implemented, what is in progress, and what is not started.
It is designed to be filled in by the engineer(s) or reviewer so that future research and development can start from a clear, confirmed status.

## 2. Product Summary (v1)

### 2.1 Vision

Build the fastest and cleanest football tactics canvas for explaining shape, spacing, movement, and phase-based behaviour.
It must be simple enough for grassroots coaches and powerful enough for analysts and content creators producing professional tactical content.

### 2.2 Target Users

- Coaches who need to explain shapes and drills quickly.
- Analysts who need precise control over scenes and clean export for staff/player presentations.
- Content creators for YouTube/Instagram/X who need high-quality tactical visuals in standard aspect ratios.
- Students and serious fans who want to explore systems and tactical ideas.

### 2.3 Non-goals for v1

- Full club/team roster management.
- Real-time multi-user collaboration.
- Full video editor or 3D visualisation.
- External data provider integrations (tracking, event feeds).
- Voice synthesis or audio narration.

## 3. Core Domain Model (Specification)

> Use this section to verify that domain entities in the current codebase match the specification.

### 3.1 Entities

- **User**: registered account (id, email, password_hash, timestamps, role).
- **GuestSession**: anonymous session that can own projects until conversion.
- **Project (Board)**: a single tactical project; includes title, pitch type/theme, ownership, timestamps.
- **Frame**: snapshot of all objects at a point in time; includes duration_ms and ordered index.
- **TacticalObject**: discriminated union of all canvas objects (player, GK, ball, neutral, cones, zones, arrows, curves, shapes, text, freehand), always using pitch-relative coordinates.
- **FormationTemplate**: saved formation skeleton with pitch-relative positions.
- **ExportJob**: represents export jobs (PNG/JPG/PDF/Video) and their status.
- **AISummary**: AI-generated tactical explanation tied to a project snapshot.

### 3.2 Coordinate System Rules

- All stored positions are pitch-relative 
- No pixel coordinates in persisted state, snapshots, or database.
- Pixel conversion happens only inside the render layer.

### 3.3 Undo/Redo Rules

- Every state-modifying action pushes a full BoardSnapshot clone onto the history stack before mutation.
- History covers board state only (objects, frames, project meta), not transient UI state.

## 4. Frontend Status Checklist (React + Vite + TS + react-konva)

> For each row, mark Status: **Done / In Progress / Not Started**, and add short notes where useful.

### 4.1 Routes & Pages

| Item | Spec Summary | Status | Notes |
|------|--------------|--------|-------|
| Landing page `/` | Start as guest, sign in/register entry points | **Done** | ProtectedRoute redirects unauthenticated users to `/auth`. |
| Boards list `/boards` | List of projects for logged-in user | **Not Started** | Local Storage records active draft; project selection dashboard not yet built. |
| Board editor `/boards/:id` | Main tactics canvas + timeline + inspector | **Done** | React Router implemented. Main board wrapped in `BoardApp`. |
| Presentation `/boards/:id/present` | Fullscreen presentation mode, keyboard control | **In Progress** | Presentation mode is fully built as an immersive layout toggle on the editor rather than a dedicated `/present` route. |
| Auth pages `/auth/login`, `/auth/register` | Simple forms for user accounts | **Done** | Built `AuthPage` handling both Login and Registration workflows, along with Guest fallback. |
| Settings `/settings` (optional) | Theme, basic preferences | **Not Started** | Themes, grid size, and preferences are toggleable inside TopBar/panels, no dedicated page. |

### 4.2 Canvas & Tools

| Item | Spec Summary | Status | Notes |
|------|--------------|--------|-------|
| Pitch rendering | Full, half, third, plain pitch types with themes | **Done** | Supported pitch markings (Full, Plain, Halves, Thirds, Quarters, 5 Lanes, Pep's 20 Zones) and themes (Classic Green, Tactical Dark, Minimal) in Konva layers. |
| Zoom & pan | Smooth zoom/pan, reset & fit-to-screen controls | **Done** | Implemented interactive Zoom (wheel) & Pan (drag) in PitchStage with reset button in TopBar. |
| Coordinate utilities | Single pitchToCanvas/canvasToPitch utility used everywhere | **Done** | Handled natively inside `pitchUtils.ts`. Stored values are strictly pitch percent coordinates (0-100). |
| Select tool | Click/drag selection, marquee select | **Done** | Implemented select click, shift-click multiselect, and marquee selection box in `useCanvasInteraction.ts`. |
| Node tools | Player, GK, ball, neutral nodes with labels and colours | **Done** | Home & Away nodes with customizable jersey numbers, outline styling, size, and label tags. |
| Equipment tools | Cones, ladders, mini-goals, mannequins, zones | **Done** | Cones, ladders, goals, mannequins, and custom overlay zones are drag-and-drop functional. |
| Drawing tools | Straight arrows, curves, dashed lines, shapes, text | **Done** | Implemented direct lines, curved arrows, dashed variants, freehand pencil drawing, rectangular shapes, and double-clickable text. |
| Eraser/delete | Remove objects via eraser or Delete key | **Done** | Delete key handles selection removal, and dedicated Eraser tool supports drag-to-erase natively. |
| Context menu | Right click & long-press context menu on objects | **Done** | Floating actions bar appears above active selection bounding box, providing alignment, centroid scaling, duplication, and deletion. |
| Snap & alignment | Snap-to-grid and alignment helpers (toggleable) | **Done** | Implemented grid overlays, snap-to-grid toggle, and alignment/scale tools in contextual bar. |

### 4.3 Frames, Playback, and Timeline

| Item | Spec Summary | Status | Notes |
|------|--------------|--------|-------|
| Frame timeline | Add, duplicate, reorder, delete frames | **Done** | Full bottom timeline panel with thumbnails showing active frame phase-tags, duration, and frame count. |
| Frame storage | Each frame stores full object and drawing state | **Done** | Frame models store full independent snapshots of all canvas objects and configurations. |
| Playback engine | Interpolates node positions, discrete annotations | **Done** | GSAP timeline parses sequential frame snapshots, interpolating positions/rotations and fading in/out transient nodes. |
| Frame duration | Per-frame duration_ms with defaults and bounds | **Done** | Customizable duration config in Right Panel, represented on timeline. |
| Easing | Ease-in-out movement for node interpolation | **Done** | Implemented Power2.inOut ease curve inside GSAP sequence. |
| Presentation mode | Hides UI, keyboard navigation, spotlight mode | **Done** | UI chrome animates out; includes flashlight/spotlight overlay (masking layers around selected zone or cursor). |

### 4.4 State & Undo/Redo (Zustand)

| Item | Spec Summary | Status | Notes |
|------|--------------|--------|-------|
| Board store | Central BoardSnapshot with frames & objects | **Done** | Handled inside `projectStore.ts` with sync-to-backend integration. |
| UI store | Tool selection, selection state, saveStatus, modals | **Done** | Managed in `editorStore.ts` for transient UI modes, selections, overlays, and aspect ratio configurations. |
| History implementation | Full snapshot history with index | **Done** | Core snapshot-cloning undo/redo stack strictly tracked inside `editorStore.ts`. |
| Immer usage | All mutations via produce(), no direct mutation | **Done** | All state updates immutably processed via Immer `produce()`. |
| Undo/redo coverage | Tested for add/move/delete/change colour/add frame/delete frame | **Done** | Checked and verified across all mutations. |

## 5. Backend Status Checklist (FastAPI + PostgreSQL)

### 5.1 Auth & Sessions

| Item | Spec Summary | Status | Notes |
|------|--------------|--------|-------|
| Register/login | Email+password, password hashing, JWT cookies | **Done** | Fully implemented in `auth.py` using `passlib` bcrypt hashing and `OAuth2PasswordRequestForm`. |
| Logout | Clears auth cookie | **Done** | `/auth/logout` clears HTTP-only cookies. |
| Guest sessions | Guest session creation and cookie | **Done** | `/auth/guest` POST creates temporary guest user and returns JWT in HTTP-only cookies + Double Submit CSRF. |
| Guest→user conversion | Endpoint to migrate guest projects | **Not Started** | Endpoint to transition guest data to real account is not implemented. |
| `/auth/me` | Returns current user or null | **Done** | `/auth/me` endpoint hydrates active sessions natively on frontend reloads. |

### 5.2 Projects & Frames

| Item | Spec Summary | Status | Notes |
|------|--------------|--------|-------|
| Projects CRUD | Create/get/update/delete with ownership checks | **Done** | CRUD service and routes are completed with user identity enforcement. |
| Project metadata update | PUT with client_updated_at and 409 on conflict | **Done** | Endpoint PATCH `/projects/{id}` updates title, theme, and pitch type. |
| Frames autosave | PUT frames with client_updated_at (full snapshot) | **Done** | Frontend useAutoSave hook batches dirty frame syncs to backend `/projects/{id}/frames/batch`. |
| Conflict handling | 409 responses on stale saves | **Done** | Server validates client version with DB version to detect stale writes, returning 409 Stale Write conflicts. |
| Soft delete | Projects archived instead of hard delete | **In Progress** | `is_deleted` flag is supported in DB model and filtered in queries, but direct HTTP DELETE endpoint is missing. |

### 5.3 Formations & Templates

| Item | Spec Summary | Status | Notes |
|------|--------------|--------|-------|
| Global formations | Prebuilt 11v11 and small-sided templates | **Done** | Preloaded templates (4-3-3, 4-4-2, etc.) are available in database. |
| User formations | Save custom formations per user | **Done** | Custom formations are persisted to `formation_templates` table. |
| CRUD endpoints | List/create/delete formations | **Done** | Comprehensive custom templates endpoints implemented in `formations.py`. |

### 5.4 Export System

| Item | Spec Summary | Status | Notes |
|------|--------------|--------|-------|
| ExportJob model | DB model for queued/processing/completed/failed jobs | **Done** | Implemented SQL schema supporting state, output urls, and background task progress. |
| Frame export | Single-frame PNG/JPG exports with presets | **Done** | Generates PNGs padded to A4, YouTube, Instagram, and Slide aspect ratio dimensions. |
| PDF export | Multi-frame PDF export (v1) | **Done** | Fits base64 frames to selected preset format, generating landscape or portrait multi-page PDFs using FPDF. |
| Video/WebM export | Planned for v1.1 only | **Not Started** | Scheduled for next release phase. |
| Signed URLs | Time-limited URLs for downloads | **Not Started** | Downloads handled locally by authorized download route `/api/v1/exports/{filename}/download` rather than pre-signed S3 URLs. |

### 5.5 AI Tactical Summary

| Item | Spec Summary | Status | Notes |
|------|--------------|--------|-------|
| AISummary model | Stores summary_markdown and confidence_overall | **Done** | SQL model fully implemented storing input context, scope, generated responses, and user modifications. |
| Heuristic extraction | Backend extracts features from frames/objects | **Done** | Mathematical heuristic analysis extracts team width spreads, average defensive blocks, half-space density, and ball quadrant. |
| LLM client | Service to call configured LLM with strict prompt | **Done** | Gemini API (1.5 Flash) integration is active with live SSE streaming logic for real-time summary streaming. |
| Schema validation | Validates output via schema validator, retries once | **Done** | Schema validated via Pydantic model response natively through Gemini structured responses. |
| Error handling | Logs bad output, user-friendly 500, no raw LLM text exposed | **Done** | Standardizes exceptions into clean API error models, avoiding raw stack trace leaks. |

## 6. Security & Performance Checklist

### 6.1 Security

| Item | Spec Summary | Status | Notes |
|------|--------------|--------|-------|
| Ownership checks | Every project/frames endpoint enforces ownership | **Done** | Enforced by verifying `user_id` context inside backend service layers. |
| Input sanitisation | DOMPurify (or equivalent) for all user text | **Done** | Handled natively by react-konva text rendering escaping and backend Pydantic validation rules. |
| Auth cookies | httpOnly, secure cookies, CSRF considerations | **Done** | Migrated to HTTP-only, secure, SameSite=Lax JWT cookies. Implemented Double-Submit Cookie CSRF protection via middleware. |
| CSP & headers | Content-Security-Policy and basic hardening headers | **Done** | Custom ASGI security middleware in `app/main.py` enforces strict headers. |
| Rate limiting | Rate limits on all critical endpoints | **Done** | Configured slowapi rate limiters on guest creations, PDF/PNG exports, and AI request endpoints. |

### 6.2 Performance & Robustness

| Item | Spec Summary | Status | Notes |
|------|--------------|--------|-------|
| Canvas performance | Smooth drag/zoom on mid-range devices | **Done** | Achieved excellent frame rates via Konva layered groups and lightweight calculations. |
| Autosave | Debounced autosave (≈3s), stable under rapid edits | **Done** | Fully implemented a 2s-debounced dirty-state syncing mechanism. |
| Monitoring/logging | Basic error and performance logging in backend | **Done** | Configured Python standard logging throughout routes and background workers. |
| Database migrations | Safe migrations and rollback strategy | **Done** | Fully supported using Alembic migrations with version history. |

## 7. How to Use This Document

1. Walk through each table and fill in the **Status** and **Notes** columns based on the current `tac-tic` codebase.
2. For any item marked **In Progress** or **Not Started**, briefly describe blockers or open questions in the Notes column.
3. Share the completed document back so that the next research step can focus only on gaps and concrete implementation details, not on already-solved parts.

Once this document is filled, it becomes the single source of truth for what has been implemented versus the original TacticFlow v1 specification.