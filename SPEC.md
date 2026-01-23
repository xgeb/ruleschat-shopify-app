RulesChat — Product & Technical SPEC (v0.3)
1. Product Overview

RulesChat is an embeddable, in-browser rules assistant for organizations with complex rulebooks (sports leagues, associations, events, compliance-heavy groups).

Runs entirely client-side

Uses a tiny in-browser LLM for conversational UX

Grounds answers only in admin-provided documents

Optimized for clarity, speed, and trust, not raw intelligence

The goal is human-like Q&A, not Ctrl+F search.

2. Core Design Principles

No server dependency (initially)

No paid APIs

Explainable answers

Admin-controlled knowledge

Upgradeable monetization via limits, not features

Good UX over perfect answers

3. Architecture Overview
Runtime Model

In-browser tiny LLM (WebGPU-backed when available)

Model loads on demand

One model instance per site (per admin)

Knowledge Flow

Admin defines documents

Documents are chunked locally

Chunks are embedded / indexed client-side

User questions:

LLM handles conversation + reasoning

Retrieval limits context strictly to document chunks

No global training. No cross-site learning.

4. Admin Panel (Configuration UI)
4.1 Admin Scope

Admin UI is not visible to public users

Used to configure:

Widget text

Theme

Documents

Sections

Subscription tier (UI-only for now)

4.2 Admin Header Settings

Editable fields:

Widget Title

Eyebrow Text

Notice Text

Changes apply immediately in-session.

5. Document System
5.1 Documents

Each document has:

Display Name

PDF URL (hosted)

Section Name (free text)

Internal chunk store (client-side)

5.2 Sections

Sections are admin-defined strings

No limit on number of sections

A section may contain:

1 document

Many documents

Documents may all exist in a single section if desired

Sections affect:

Admin organization

User-facing document grouping

6. Subscription Tiers (UI-only)
6.1 Plans
Plan	Price	Max Documents
Starter	$9/mo	8 documents
Pro	$15/mo	28 documents
Power	$20/mo	75 documents
6.2 Behavior

Starter is default

When document limit is reached:

“Add document” is disabled

Upsell UI appears

Clicking upgrade:

Updates plan locally

Increases document cap immediately

Reveals new empty document slots

⚠️ No payments or persistence yet (frontend simulation only)

7. Admin Upsell UI

Displayed when at document limit:

Current plan name

Current usage (e.g. 8 / 8)

Upgrade buttons:

Upgrade to Pro ($15 / 28 docs)

Upgrade to Power ($20 / 75 docs)

Upgrade behavior:

Immediate

No reload

No backend

8. Theme Customization
8.1 Color Selection

Admin can choose a theme color via:

RGB / color wheel picker

Presets supported implicitly:

Red

Orange

Yellow

Yellow-Green

Green

Green-Blue

Blue

Blue-Purple

Purple

Red-Purple

Black

Gray

Theme color affects:

Buttons

Highlights

Accent borders

Chat UI emphasis

Stored in config object.

9. User Chat Interface
9.1 Chat Input

Max length: 250 characters

Real-time character counter: X / 250

9.2 Character Limit Feedback

When user hits 250 characters:

Show inline red warning text:

“Character limit reached. Please reword your question.”

Warning disappears automatically when text is shortened

Accessible via aria-live

No modals. No alerts.

10. Chat Behavior
Answer Flow:

User submits question

Relevant document chunks are retrieved

LLM generates response only from retrieved content

Response includes:

Answer text

Document name(s)

Page reference(s) when available

Failure Case:

If no relevant content is found:

Show escalation message:

“I cannot find this in the posted documents.”

Optional future escalation hook (email, form, etc.)

11. Non-Goals (Explicitly Out of Scope)

Payments

User accounts

Backend ingestion

Server-side embeddings

Cross-site learning

PDF uploads for public users

12. Milestones
Milestone 1

Static widget scaffold

Basic admin UI

Chat UI skeleton

Milestone 2

Document ingestion (prototype)

Chunking + retrieval

Tests for chunking & retrieval

Milestone 3 (Current)

In-browser LLM integration

Admin theming

Subscription tiers (UI-only)

Sections

Upsell flows

UX polish

13. Success Criteria

Admin can configure up to 75 documents with sections

User experience feels conversational, not search-like

No external API costs

Clear upgrade path

Clean UX under constraints
