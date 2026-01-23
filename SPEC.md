# Project Specification — RulesChat (In-Browser LLM Edition)

## 1. Project identity

Project name:
RulesChat — In-Browser League Rules Assistant

One-sentence description:
A browser-based chatbot that answers league rule questions conversationally using only admin-provided PDF documents.

Primary user:
Fighters, referees, and league members checking rules for weapons, materials, safety, and engagement.

Primary problem solved:
Users get fast, human-like answers grounded strictly in official league documents without waiting for staff responses.

Non-goals:
- No user accounts or login
- No permanent chat history
- No server-side model training
- No external paid LLM APIs
- No PDF uploads by public users

---

## 2. Source material and permissions

Source material:
Admin-uploaded or admin-linked PDF rule documents.

Permissions:
Admin confirms they have rights to publish and reference uploaded documents.

Reskinning:
No reskinning of third-party codebases. Original implementation only.

Legal constraints:
- No collection of personal data
- No analytics tied to identity
- Accessibility compliance (WCAG-aligned)

---

## 3. Target platform and technology

Platform:
Shopify storefront extension (initially tested as standalone web widget).

Execution environment:
Client-side browser only.

Technology stack:
- HTML / CSS / JavaScript
- WebLLM (open-source, in-browser language model runtime)
- WebGPU (for local inference)
- PDF.js (text extraction)
- Custom semantic retrieval (embedding + similarity)

No backend servers required for core functionality.

---

## 4. Functional requirements

1. Admin can configure:
   - Widget title
   - Eyebrow text
   - Notice text
   - Up to 8 PDF documents

2. Admin can:
   - Upload PDF files locally (browser session only)
   - Or provide hosted PDF links for download

3. System extracts text from PDFs and:
   - Splits text into overlapping semantic chunks
   - Stores chunks in memory for the session

4. When a user asks a question:
   - Relevant chunks are retrieved using semantic similarity
   - Retrieved excerpts are passed into a local language model
   - The model generates a conversational answer
   - The answer cites document title and page numbers

5. If no relevant content is found:
   - The assistant clearly states it does not know
   - Offers escalation to a human (placeholder action)

6. Chat sessions:
   - Exist only in the current browser session
   - Reset on page reload

---

## 5. Failure states and messaging

- WebGPU unavailable:
  Show a friendly message explaining the device does not support local chat.

- Model loading failure:
  Display retry option with progress indicator.

- PDF extraction failure:
  Show admin-only error with clear explanation.

- No answer found:
  Provide escalation option.

---

## 6. Data model and storage

All data is ephemeral and client-side only.

Entities:
- Document
  - title
  - url (optional)
  - extracted text
  - semantic chunks

- ChatMessage
  - role (user / assistant)
  - content

No persistent storage.
No cookies.
No tracking.

---

## 7. Accessibility requirements

- Keyboard navigation for all inputs
- Proper ARIA labels
- High-contrast readable text
- Screen-reader friendly chat output

---

## 8. Quality bar (definition of done)

Functional:
- Answers reference only uploaded documents
- Conversational tone
- Multi-turn chat works in a session

Performance:
- Initial model load under reasonable time on modern desktop
- No blocking UI during inference

Security:
- No secrets
- No external network calls for inference
- Input sanitization for display

---

## 9. Build, run, and test instructions

Install:
npm install

Run locally:
npm run dev

Test:
npm test

Build:
npm run build

---

## 10. Milestones and benchmarks

Milestone 1:
Existing widget UI + admin document ingestion

Milestone 2:
Semantic retrieval (embedding-based)

Milestone 3:
In-browser language model integration (WebLLM)

Milestone 4:
Shopify extension packaging + fallback handling

---

## 11. Agentic execution constraints

- Do not add paid APIs
- Do not introduce a backend server
- Always keep inference client-side
- Ask before adding new dependencies
- Provide a change log per milestone

---

## 12. Definition of complete deliverable

A Shopify-compatible widget that provides conversational, document-grounded rule answers using a fully in-browser, open-source language model, requiring no servers, no API keys, and no ongoing inference costs.
