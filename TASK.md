BUGS


FIXES:


FIXED
- Fixed proposal storage to persist in Cosmos DB (instead of ephemeral in-memory map), preventing loss of review state on restart/redeploy.
- Implemented strict RFC-compliant validation: "evidence guard" verbatim substring verification and "term window" date range bounds checking for syllabus ingestion.
- Implemented schema validators and deterministic fallback algorithms for conflict detection and study schedule generation.
- Integrated Microsoft Graph free/busy availability sync directly into the Scheduler UI.


IMPLEMENTED FEATURES
- The end-to-end demo flow exists: upload → extract → review/edit → approve → dashboard (deadlines, conflicts, schedule, chat).
- Extraction is wired to Azure AI Foundry (Mistral Document AI) with confidence-based review gating and a latency mask response.
- Approve All persists to Cosmos and is protected against double-submit.
- Dashboard surfaces implemented UI for deadlines by course, conflict report, schedule planner, and lateral-language chat.
- DSD tokens are implemented in CSS and Tailwind.
- PDF upload with MIME/size validation and immediate “reading now” ack.
- AI extraction with confidence scoring and review-state assignment.
- Review UI with inline edits and a metrics toggle.
- Batch approval to Cosmos with idempotent lock.
- Deadlines management (edit/delete), grouped by course.
- Conflict detection (AI-driven) and conflict UI.
- Schedule generation (AI-driven) and schedule UI.
- Lateral-language chat with intent parsing and optional schedule/conflict insertion.
- Microsoft Graph calendar endpoints exist (read/create events, free/busy).

NOT IMPLEMENTED YET
- OCR fallback for scanned/image PDFs; extraction is Mistral-only.
- Manual-entry fallback when extraction fails; error just stops on the review page.
- DOC/DOCX parsing: upload accepts these types but the backend treats non-PDF as raw UTF-8.
- Re-upload dedupe logic; no hash check is applied.
- Accuracy harness and QA corpus (no qa directory or tooling in app).
- Study-block persistence and approval flow; schedule results are not stored to Cosmos.

NEEDS IMPROVEMENTS
- None

ADDITIONAL FEATURES
- (fill in)
