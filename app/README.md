# Mate - Autonomous Academic Orchestrator

**KPMG Academic Innovation Challenge 2026**  
**Milestone:** M0 - SaaS Scaffolding ✅ COMPLETE  
**Demo Submission:** 2026-05-25

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
4. **Suggests** realistic study schedules

**M0 Demo:** Upload → Extract → Review → Approve flow

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
│   │   └── ExtractionReview.tsx
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
| **M0-COMPLETE.md** | Implementation summary and next steps |
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
- **Auth:** Microsoft 365 / Google (planned)

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
2. **Upload syllabus:** Go to http://localhost:3000
3. **Wait for extraction:** ~10 seconds
4. **Review assessments:** Edit flagged items
5. **Approve all:** Saves to Cosmos DB
6. **Verify:** Check Cosmos DB Data Explorer

See **[QUICK-START.md](./QUICK-START.md)** for detailed steps.

---

## M0 Features (Complete)

- ✅ PDF syllabus upload
- ✅ AI extraction (Mistral Document AI)
- ✅ Confidence scoring
- ✅ Review panel with inline editing
- ✅ Batch approval to Cosmos DB
- ✅ Conflict detection (backend only)
- ✅ Error handling
- ✅ Loading states

---

## M1 Features (Planned)

- [ ] Conflict detection UI
- [ ] Schedule generation UI
- [ ] Dashboard (all courses)
- [ ] Authentication (M365/Google)
- [ ] Calendar integration
- [ ] Mobile polish
- [ ] DOC/DOCX support

---

## Known Issues

1. No authentication (using `demo-user`)
2. DOC/DOCX not supported (PDF only)
3. No retry logic for failed extractions
4. Conflicts detected but not displayed
5. No dashboard yet

See **[IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md)** for full list.

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

- [ ] Show landing page
- [ ] Upload real syllabus PDF
- [ ] Show loading state
- [ ] Show extracted assessments
- [ ] Edit a flagged date
- [ ] Click "Approve All"
- [ ] Show success message
- [ ] (Optional) Show Cosmos DB data

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
