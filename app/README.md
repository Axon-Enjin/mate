# Mate - Autonomous Academic Orchestrator

**KPMG Academic Innovation Challenge 2026**  
**Milestone:** M2 complete — final polish in progress; submission deadline **2026-05-26 12:00 noon** (extended)  
**Last updates:** Outlook calendar sync + Teams reminder integration shipping before deadline

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

See **[QUICK-START.md](./QUICK-START.md)** for detailed instructions.

---

## What This Is

Mate is an autonomous academic assistant that transforms static syllabi into an active, adaptive study strategy. Upload a syllabus PDF, and Mate:

1. **Extracts** every assessment deadline using AI
2. **Flags** ambiguous dates for review
3. **Detects** deadline conflicts across courses
4. **Suggests** realistic study schedules via chat or the schedule form

**Demo flow:** Sign in → Upload → Extract → Review → Approve → Dashboard (Ask Mate / Conflicts / Schedule)

---

## Project Structure

```
app/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   │   ├── syllabi/       # Upload & extraction
│   │   │   └── proposals/     # Review & approval
│   │   ├── review/[id]/       # Review page
│   │   ├── page.tsx           # Landing page
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ExtractionReview.tsx
│   │   ├── MateChat.tsx       # Lateral-language chat (DSD §4)
│   │   ├── ConflictReport.tsx
│   │   ├── SchedulePlanner.tsx
│   │   └── NavBar.tsx
│   ├── lib/                   # Core logic
│   │   ├── cosmos.ts          # Cosmos DB client
│   │   ├── ai-foundry.ts      # AI Foundry client
│   │   ├── pdf-extractor.ts   # PDF text extraction
│   │   └── utils.ts           # Helpers
│   └── types/                 # TypeScript types
│       └── index.ts
├── public/                    # Static assets
├── .env                       # Environment variables
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

---

## Key Files

| File | Purpose |
|------|---------|
| **src/components/MateChat.tsx** | Conversation UI for lateral language (Ask Mate tab) |
| **QUICK-START.md** | Step-by-step testing guide |
| **IMPLEMENTATION-STATUS.md** | Detailed status, metrics, known issues |
| **BUILD-PLAN.md** | Original M0 build plan |
| **.env** | Environment variables (Cosmos, AI Foundry) |

---

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Backend:** Next.js API Routes
- **Database:** Azure Cosmos DB (NoSQL)
- **AI:** Azure AI Foundry (GPT-5, Mistral-Large-3, Mistral Document AI)
- **Hosting:** Azure App Service (planned)
- **Auth:** NextAuth (Microsoft Entra ID)

---

## Environment Variables

Required in `.env`:

```env
# Cosmos DB
COSMOS_ENDPOINT=https://mate-cosmos-dev.documents.azure.com:443/
COSMOS_KEY=<your-key>
COSMOS_DATABASE=mate-dev-db

# Azure AI Foundry
AI_FOUNDRY_ENDPOINT=https://mate-ai-foundry.services.ai.azure.com
AI_FOUNDRY_KEY=<your-key>
GPT5_DEPLOYMENT_NAME=gpt-5-deployment
MISTRAL_LARGE_DEPLOYMENT_NAME=Mistral-Large-3-deployment
MISTRAL_DOCUMENT_DEPLOYMENT_NAME=mistral-document-ai-2512-deployment

# Configuration
CONFIDENCE_THRESHOLD=0.75
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/syllabi` | Upload syllabus, trigger extraction |
| GET | `/api/proposals/[id]` | Get extraction result |
| PATCH | `/api/proposals/[id]` | Update proposal (edit assessments) |
| POST | `/api/proposals/[id]/approve` | Approve and save to Cosmos DB |
| GET | `/api/courses` | List courses with approved deadlines (grouped by syllabus) |
| DELETE | `/api/courses/[id]` | Remove a syllabus and all its deadlines |
| PATCH | `/api/assessments/[id]` | Edit a single approved deadline |
| DELETE | `/api/assessments/[id]` | Remove a single deadline |
| GET | `/api/conflicts` | Detect deadline conflicts across approved assessments |
| POST | `/api/schedule` | Generate study blocks from availability input |
| PATCH/DELETE | `/api/schedule/[blockId]` | Edit or remove an individual study block |
| GET/POST | `/api/schedule/reminders` | List or create reminders for upcoming study blocks |
| POST | `/api/schedule/remind/action` | Handle a reminder action (snooze, mark done, etc.) |
| GET | `/api/calendar/events` | Fetch Outlook calendar events (Microsoft Graph) |
| POST | `/api/calendar/events/sync` | Sync approved study blocks into the user's Outlook calendar |
| POST | `/api/calendar/availability` | Free/busy lookup via Microsoft Graph |
| POST | `/api/teams/reminder` | Send a study-block reminder to the user via Microsoft Teams |
| POST | `/api/webhooks/study-block` | Inbound webhook for study-block lifecycle events (reminder triggers) |

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm run dev

# Test Azure connections
npm run test:connections

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## Testing the Demo

1. **Start server:** `npm run dev`
2. **Sign in** with Microsoft at http://localhost:3000
3. **Upload syllabus** from the upload page
4. **Wait for extraction:** ~10 seconds
5. **Review assessments:** Edit flagged items, then **Approve All**
6. **Open dashboard** → **Deadlines** tab to view, edit, or remove by syllabus
7. Try **Ask Mate** → *"Help me plan my week"*
8. Check **Conflicts** and **Study Schedule** tabs

Design tokens and chat UI spec: [`docs/dsd-mate.md`](../docs/dsd-mate.md) §4 (Chat panel).

---

## M0 Features (Complete)

- ✅ PDF syllabus upload
- ✅ AI extraction (Mistral Document AI)
- ✅ Confidence scoring + View Metrics toggle
- ✅ Review panel with inline editing
- ✅ Batch approval to Cosmos DB
- ✅ Latency masking on upload
- ✅ Microsoft Entra ID authentication

---

## M1 Features

- ✅ Conflict detection UI (dashboard Conflicts tab)
- ✅ Schedule generation UI (dashboard Study Schedule tab)
- ✅ **Lateral-language chat** (`MateChat` — dashboard Ask Mate tab)
- ✅ Dashboard with tabbed navigation
- ✅ **Deadlines tab** — view/edit/remove deadlines grouped by syllabus (`DeadlineManager`)
- [ ] Re-upload dedupe (same filename warning)
- [x] Manual entry fallback when extraction fails (`src/components/ManualEntryForm.tsx`)
- [x] Outlook calendar wired into schedule planner (`/api/calendar/events/sync`, `/api/calendar/availability`)
- [x] Microsoft Teams reminder integration (`src/lib/microsoft-teams.ts`, `/api/teams/reminder`, `/api/webhooks/study-block`)
- [x] Extraction accuracy harness (`app/qa/run-accuracy.ts` + `app/qa/corpus/*.json`)
- [ ] DOC/DOCX support
- [ ] Mobile polish (375px pass)

---

## Known Issues

1. Scanned/image PDFs fail without Azure Vision OCR fallback
2. DOC/DOCX accepted on upload but not reliably processed
3. No manual entry flow when extraction fails
4. Chat schedule generation depends on AI parsing availability from natural language
5. Consolidated cross-course deadline list not yet on dashboard

---

## Troubleshooting

### "Module not found"
```bash
npm install
```

### "Cannot connect to Cosmos DB"
- Check firewall rules in Azure Portal
- Verify `.env` has correct endpoint and key

### "AI Foundry API error"
- Check deployment names match exactly
- Verify endpoint format: `.services.ai.azure.com`

### "PDF extraction failed"
- Ensure PDF is not encrypted
- Check PDF has readable text (not scanned)

See **[QUICK-START.md](./QUICK-START.md)** for more troubleshooting.

---

## Demo Video Checklist

For KPMG submission (2026-05-25):

- [ ] Show landing page and sign-in
- [ ] Upload real syllabus PDF
- [ ] Show loading / latency mask
- [ ] Show extracted assessments + edit a flagged date
- [ ] Click "Approve All"
- [ ] Open **Ask Mate** → say "Help me plan my week"
- [ ] Show clarifying question + study blocks
- [ ] Show conflict detection tab (if overlapping syllabi)

**Length:** 2-3 minutes  
**Format:** MP4 or MOV  
**Recipients:** See M0-COMPLETE.md

---

## Architecture

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Next.js    │
│  API Routes │
└──────┬──────┘
       │
       ├──────────────┐
       ▼              ▼
┌─────────────┐  ┌─────────────┐
│  Cosmos DB  │  │ AI Foundry  │
│  (Storage)  │  │ (Extraction)│
└─────────────┘  └─────────────┘
```

---

## Success Criteria (M0)

| Criterion | Status |
|-----------|--------|
| Upload PDF syllabus | ✅ |
| AI extraction works | ✅ |
| Review panel displays data | ✅ |
| Edit assessments | ✅ |
| Approve saves to DB | ✅ |
| No crashes | ⚠️ Needs testing |
| Mobile responsive | ⚠️ Needs testing |

---

## Contributing

This is a competition entry. After the competition, we'll open source the codebase.

---

## License

MIT (after competition)

---

## Contact

**Team:** Axon Enjin  
**Competition:** KPMG Academic Innovation Challenge 2026  
**Submission Deadline:** 2026-05-25

---

**Ready to test!** 🚀

Run `npm install && npm run dev` to get started.
