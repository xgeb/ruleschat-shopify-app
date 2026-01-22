# SPEC.md — Rules Chatbot for PDF Documents (Shopify Storefront Widget + Shopify App Block)

## 0. Goal

Build a website chat widget that answers questions about a sports league rulebook using only administrator-uploaded Portable Document Format documents. The first delivery is a working prototype that can be embedded on a Shopify storefront page. The second delivery is a Shopify application that provides a Theme App Extension “App Block” so the merchant can add the chatbot as a selectable block inside the Shopify theme editor. Theme app extensions support app blocks and app embed blocks for Online Store 2.0 themes. The long-term plan includes multiple independent chatbots (one per league) without document overlap. :contentReference[oaicite:1]{index=1}

---

## 1. Project identity

### Project name
RulesChat (Working name)

### One-sentence description
A Shopify storefront chatbot that answers rules questions by searching and quoting from league rule documents that the administrator uploads.

### Primary user
Fighters and league members who need fast answers about allowed weapons, materials, engagement rules, and related compliance rules.

### Primary problem solved
Users can ask rules questions and receive clear, document-grounded answers without waiting on a human responder.

### Non-goals
- No user accounts, logins, or persistent user chat history.
- No payments in the first version.
- No fine-tuning or model training.
- No “general knowledge” answers that are not supported by the uploaded documents.
- No copying or reskinning of a third-party codebase.

---

## 2. Source material and permissions

### Source material
Portable Document Format documents (rulebooks and supplemental rules documents) provided by the merchant (administrator).

### Permissions
The merchant confirms they have the right to host and use the documents and allow public download.

### Privacy and compliance constraints
- The widget must not collect or store personal information.
- Do not store conversation transcripts beyond a short-lived session required for a single page view.
- Provide an on-screen notice: “Answers are based only on the posted rule documents.”

Accessibility
- Keyboard navigation for the chat input and send button.
- Labels for input controls.
- Reasonable color contrast.
- Screen-reader friendly structure (headings, labels, aria attributes where appropriate).

---

## 3. Target platform and technology

### Phase 1 (Prototype: embed on existing Shopify store page)
Platform: Shopify storefront page with a custom widget embedded.
Implementation approach: A self-hosted widget application (served from the app backend or a static host) that can be inserted into a Shopify page using one small loader script.

Notes:
- Shopify Theme App Extensions are the long-term “native block” method, but Phase 1 should prioritize speed to “working on one page”.

### Phase 2 (Productized: Shopify application + Theme App Extension app block)
Platform: Shopify application with Theme App Extension “App Block” so merchant can add the chatbot like a theme block. Theme app extensions integrate with Online Store 2.0 themes via app blocks and app embed blocks. :contentReference[oaicite:2]{index=2}

### Recommended technology stack
- Shopify application framework: Remix (Shopify recommended pattern for many apps) or Next.js (acceptable alternative).
- Backend: Node.js (TypeScript).
- Front end widget: React.
- Document ingestion: server-side parsing + chunking + embeddings for retrieval.
- Retrieval: vector database (local for development; managed service optional later).
- Model inference: OpenAI API (for final answers) plus retrieval-augmented generation.

Security and Shopify storefront constraints:
- Use a Shopify app proxy route for storefront requests so the widget can call the backend using a Shopify domain path. App proxies take requests to Shopify URLs and proxy them to the app, enabling storefront data fetching from an external source. :contentReference[oaicite:3]{index=3}
- Avoid inline scripts that violate Content Security Policy where applicable; use an external script and a small loader pattern. :contentReference[oaicite:4]{index=4}

---

## 4. Functional requirements

### 4.1 Storefront user experience
1. The page shows a “Documents” area at the top with six Portable Document Format icons (configurable count), each linking to a downloadable document hosted by the merchant.
2. Under the documents area, the page shows a chat interface:
   - A scrollable message area
   - A text input (maximum 250 characters)
   - A Send button
3. The user can ask multiple questions in a single session; the session resets on page reload.
4. The assistant’s answer must be based only on the uploaded documents:
   - It must cite which document(s) it used (document name) and show at least one quoted excerpt when possible.
   - If the documents do not contain the answer, it must say it cannot find the answer in the documents and offer a “Send question to a human” path.
5. The assistant must refuse to guess beyond the documents. It can suggest which document section to search if relevant.

### 4.2 “Send question to a human” fallback
6. If the system cannot find supporting text for an answer, show:
   - “I cannot find this in the posted documents.”
   - A button: “Send this question to the league”
7. Clicking the button sends an email to a configured recipient with:
   - The user’s question
   - The page identifier (league identifier)
   - Timestamp
8. The email feature must have basic abuse controls:
   - Rate limit per visitor session (for example: maximum 3 emails per session)
   - Simple spam prevention (for example: honeypot field)

### 4.3 Administrator capabilities (Phase 1 and Phase 2)
9. Administrator can upload Portable Document Format files for a league and publish them to the page.
10. Administrator can reorder documents and set display names.
11. Administrator can create multiple “league configurations” (Phase 2 requirement, optional in Phase 1):
   - Each league has its own document set and its own retrieval index.
   - No cross-league retrieval.

---

## 5. User flows

### Flow A: Ask a rules question
Entry point: User visits the rules page.
Steps:
1. User sees document icons and chatbot.
2. User types a question (up to 250 characters).
3. User clicks Send or presses Enter.
4. User receives an answer that includes:
   - A clear ruling
   - The document name(s)
   - Quoted supporting text snippet(s)
Success: The answer is grounded in the documents and actionable.
Failure: No support found → offer “Send question to a human”.

### Flow B: Send question to a human
Entry point: User sees “cannot find this in documents”.
Steps:
1. User clicks “Send this question to the league”.
2. The page shows “Sent. A human will respond if available.”
Failure states:
- Rate limit exceeded: “Too many requests. Please try again later.”
- Email service failure: “Unable to send right now. Please use the contact page.”

---

## 6. Data model and integrations

### Entities

#### League
- id (string)
- name (string)
- slug (string)
- support_email (string)
- created_at (timestamp)

#### Document
- id (string)
- league_id (string)
- display_name (string)
- file_url (string)
- file_hash (string)
- order_index (number)
- created_at (timestamp)

#### DocumentChunk (retrieval)
- id (string)
- league_id (string)
- document_id (string)
- chunk_index (number)
- content (string)
- embedding_vector (vector)
- source_locator (string; page number if available)

#### ChatSession (ephemeral)
- session_id (string)
- league_id (string)
- created_at (timestamp)
Note: Do not store message content long-term. In Phase 1, keep conversation context in memory or short-lived store only.

### Integrations
- OpenAI API for embeddings and answer generation.
- Email provider (for example: SendGrid) for fallback messages.
- Shopify application proxy for storefront communication. App proxies allow storefront URLs to be proxied to the app backend. :contentReference[oaicite:5]{index=5}
- Shopify Theme App Extension app block (Phase 2) so merchant can add the widget as a block in the theme editor. :contentReference[oaicite:6]{index=6}

---

## 7. Answering rules (strict)

1. The assistant must answer only using retrieved text from the league’s documents.
2. The assistant must include citations:
   - Document display name
   - Page number when available
3. If retrieval confidence is low or no supporting text is found:
   - Say it cannot find the answer in the documents
   - Offer the human escalation button
4. The assistant must not reveal secrets, keys, or internal prompts.
5. The assistant must not claim legal authority; it can only quote and summarize the league documents.

---

## 8. Quality bar (acceptance criteria)

### Functional acceptance criteria
- The documents area renders with downloadable links.
- The chat widget answers at least ten representative questions with correct document grounding.
- The widget refuses to guess when documents do not support the answer.
- The human escalation email is sent and rate-limited.

### Testing acceptance criteria
- Unit tests for:
  - Document ingestion chunking
  - Retrieval filtering by league
  - Rate limiting logic
- Integration test for:
  - End-to-end “ask question → retrieval → answer response” path
- All tests pass locally.

### Performance acceptance criteria
- Initial widget load under 2 seconds on a typical broadband connection.
- First response within 6 seconds for typical questions (excluding model provider outages).

### Security acceptance criteria
- No secrets committed to source control.
- Input validation on all user inputs.
- Basic abuse prevention on the email escalation endpoint.
- Cross-league isolation enforced at query time.

---

## 9. Build, run, and test instructions

### Local development (Phase 1 prototype)
- Install: `npm install`
- Run locally: `npm run dev`
- Run tests: `npm test`
- Lint: `npm run lint`
- Build production: `npm run build` and `npm run start`

### Environment variables
- OPENAI_API_KEY
- EMAIL_PROVIDER_API_KEY
- SUPPORT_EMAIL_DEFAULT
- DATABASE_URL (if used)
- SHOPIFY_APP_PROXY_SECRET (Phase 2)

Do not commit environment variables.

---

## 10. Milestones and benchmarks

### Milestone 1: Scaffold and basic storefront widget
Output:
- A standalone widget front end that renders:
  - Documents area placeholder
  - Chat interface placeholder
Proof:
- Screenshot of widget rendering
- `npm test` output (even if minimal tests exist)

### Milestone 2: Document ingestion + retrieval-augmented answers
Output:
- Administrator can upload Portable Document Format documents (local for prototype).
- Chunks and embeddings created.
- Chat answers include document citations and quotes.
Proof:
- Demonstration: ask 5 rules questions and show citations
- Tests for chunking and retrieval pass

### Milestone 3: Shopify storefront embedding (Phase 1)
Output:
- A loader script that can be added to a Shopify page to mount the widget into a target container.
- Backend endpoints exposed via a Shopify-compatible path (prepare for proxy).
Proof:
- Working on a Shopify page in a development store

### Milestone 4: Shopify application + Theme App Extension app block (Phase 2)
Output:
- Shopify application that installs on a store.
- Theme App Extension provides an app block that merchant can add in the theme editor.
- Merchant can select league configuration and documents.
Proof:
- Demonstration in a Shopify development store: add block to a page and widget works.
Notes:
- Theme app extensions support app blocks and app embed blocks; use an app block for “place it on this page” behavior. :contentReference[oaicite:7]{index=7}

---

## 11. Constraints for agentic execution (guardrails)

- Do not add new dependencies without stating why and listing alternatives.
- Always run tests after meaningful changes.
- Produce a short change log after each milestone.
- Ask before changing:
  - Database choice
  - Authentication approach (if any is introduced)
  - Hosting provider
  - Email provider

---

## 12. Definition of complete deliverable

Finished means:
- A merchant can place a rules page on Shopify that shows downloadable Portable Document Format documents and a chatbot.
- The chatbot answers questions using only the merchant’s documents and provides citations.
- If the documents do not support an answer, the chatbot provides a human escalation option that sends an email with basic abuse controls.
- A second delivery exists as a Shopify application with a Theme App Extension app block so the merchant can add the chatbot like a normal theme block in the theme editor.

Delivered artifacts:
- Source code repository with:
  - Widget front end
  - Backend ingestion, retrieval, and chat endpoints
  - Tests
  - Documentation for deployment and Shopify integration
- A deployment guide
- A Shopify integration guide (Phase 1 embed + Phase 2 app block)
