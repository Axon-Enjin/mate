# Demo Video Production Guide

**Project:** Mate — Autonomous Academic Orchestrator
**Submission:** KPMG Academic Innovation Challenge 2026
**Deadline:** 2026-05-26 12:00 noon (extended)
**Video length:** 5:00 target (organizer-confirmed), 5:00 hard cap
**Owner:** Axon Enjin

---

## 1. Narrative Strategy

The video is structured around four pillars: **Problem, Solution, Value, Technical Prowess.** Per organizer guidance, Technical Prowess gets the most runtime, and integrations must be shown firing live (not merely referenced).

The KPMG judging split is **50% Functionality/User Experience** and **50% Data Accuracy & Relevance of Response**. Both axes are evidenced *during* the demo flow, not as a separate "tech section."

The four judged capabilities (per [KPMG.md](../KPMG.md)) are all demonstrated end-to-end:

1. Syllabus ingestion and parsing
2. Deadline conflict reasoning
3. Adaptive study-block scheduling
4. Lateral language processing

On top of those four, three live Microsoft 365 integrations are shown working in real time:

1. Outlook calendar event sync (two-way via Microsoft Graph)
2. Microsoft Teams reminder notification (with action buttons)
3. Outlook free/busy availability check (feeds the scheduler)

---

## 2. Shot List

Each row is one scene, in recording order. The Visual column tells you exactly what should be on screen; the Voice-over column is what you say while it is there.

| # | Time | Duration | Visual on screen | Voice-over | Judging tag |
|---|---|---|---|---|---|
| 1 | 0:00–0:20 | 20s | Static title card or stock shot of a student with multiple syllabus PDFs scattered on a desk. Mate logo bottom-right. | "If you ask a Filipino university student why they missed a deadline, they won't say they forgot. They'll say nobody told them. Six syllabi, dozens of dates buried inside them, and no tool that actually reads them. That's the problem Mate solves." | Problem framing |
| 2 | 0:20–0:45 | 25s | Mate landing page on screen. At 0:30, overlay appears top-right for 8 seconds: "Microsoft Copilot · Azure AI Foundry · Mistral Document AI · Microsoft Graph · Cosmos DB" | "Mate is an independent SaaS powered by Microsoft Copilot. It runs on Azure, uses Mistral Document AI for extraction, and talks to your real Outlook calendar and Microsoft Teams through Microsoft Graph. In the next four minutes I'll walk you through four core capabilities and three live integrations." | Stack proof |
| 3a | 0:45–1:00 | 15s | Sign in with Microsoft, then upload page, then drag `test/CS-SOCSCI-SocSc12-TANGARA_A-F1-2022-1.pdf` into the dropzone. Latency mask appears immediately. | "Let's start with a real syllabus. This is an actual course document from a Philippine university, the kind students get on day one and never open again. I upload it, and Mate immediately tells me it's reading." | Capability 1 + UX |
| 3b | 1:00–1:15 | 15s | Cut to Extraction Review panel fully loaded. Slowly scroll once so judges see the full deadline list. | "That matters, because the parse takes about fifteen seconds and silence makes users think the app crashed. Here's the result. Every assessment, every due date, pulled into one consolidated view." | Capability 1 |
| 3c | 1:15–1:30 | 15s | Click "View Metrics" toggle. Confidence percentages appear next to each row. Mouse hovers on a flagged "needs review" item. Pause half a second after "That's not a bug." | "If I toggle View Metrics, I can see the raw confidence for each item. Notice this one is flagged for review. That's not a bug. That's Mate refusing to guess when the source is ambiguous." | Data Accuracy |
| 3d | 1:30–1:45 | 15s | Cut to pre-recorded terminal clip of `app/qa/run-accuracy.ts` output. Highlights: "Date error rate: 1.4% · Fabricated dates: 0". Hold the result frame for 3 full seconds. | "And this is the proof. Our accuracy harness runs the extractor against a gold-labeled corpus of real PH syllabi. Date error rate under two percent. Zero fabricated dates. That's the bar we hold ourselves to before any data ever reaches the student." | **Data Accuracy (highest leverage shot)** |
| 4 | 1:45–2:15 | 30s | Back to Mate. Quick upload of `test/Latest_Multimedia_OBEorOBTLP-Format.pdf`. Cut to Conflicts tab. Zoom slightly on the named collision week and the intervention suggestion. | "Now watch what happens when I add a second syllabus. Mate doesn't just dump more rows onto the page. It looks across all my courses, finds the weeks where major requirements collide, and names the week out loud. Here it's flagging that I have three majors due in the same seven days. It even suggests when I should start each one. That's reasoning about workload, not just listing tasks." | Capability 2 |
| 5 | 2:15–2:50 | 35s | Switch to Ask Mate panel. Type "help me plan my week" character by character so it feels real. Clarifying question appears. Type the availability answer. | "Now the Ask Mate panel. I'll type something vague, the kind of thing a real student would actually say. 'Help me plan my week.' Mate doesn't pretend it has enough information. It asks the one thing it needs, which is when I'm unavailable. I tell it I have classes in the morning and a part-time job on Wednesdays. Now it has what it needs." | Capability 4 |
| 6 | 2:50–3:15 | 25s | Cut to Study Schedule tab. Study blocks render in priority order. Scroll once across the week view. | "And here are the study blocks. Sized to my real availability, mapped to the deadlines that matter most, sequenced so the hardest work lands when I have the most time. Nothing is committed yet. I review, then approve." | Capability 3 |
| 7a | 3:15–3:30 | 15s | Click "Sync to Outlook" button. Brief loading state. | "This is the first live integration. One click on Sync to Outlook." | Integration 1 |
| 7b | 3:30–3:55 | 25s | Alt-Tab to Outlook web (already open in second window). Calendar week view loads. The synced study blocks appear as events. Pause half a second after "There they are." | "Now I'll switch to my actual Outlook calendar in another window. There they are. Every study block I just approved, now sitting in my real calendar as events. This is going through Microsoft Graph in real time. If I delete one in Outlook, the next sync reflects it. Two-way, not a screenshot." | Integration 1 (proof) |
| 8 | 3:55–4:30 | 35s | Alt-Tab to Microsoft Teams (already open). Trigger the study-block reminder. Teams notification slides in. Click it to open the message with action buttons. | "Second integration. When a study block is about to start, Mate sends a reminder through Microsoft Teams. Watch the Teams window. There it is. A native Teams notification with the block details, and a button I can click to mark it done or push it back. This is where most planners lose students, in the gap between scheduling something and actually being reminded of it. Mate closes that gap inside the tools students already live in." | Integration 2 |
| 9 | 4:30–4:45 | 15s | Back in Mate. Briefly highlight in the Schedule view where Outlook busy times are shown as greyed-out slots. | "Third integration, and this one runs quietly in the background. When Mate generates a schedule, it pulls my free and busy times from Outlook first. So the blocks it proposes already respect the meetings I forgot to mention." | Integration 3 |
| 10 | 4:45–5:00 | 15s | Final shot: consolidated Mate dashboard with all tabs visible. Hold steady. Mate logo and tagline fade in at 4:55. | "Zero setup. Zero fabricated dates. Four capabilities, three live Microsoft 365 integrations, built on Microsoft Copilot for Filipino students who need their tools to do the reading for them. That's Mate." | Close |

**Total runtime:** 5:00. No slack. Rehearse to time before recording.

---

## 3. Pre-Flight Setup

Complete every item below before you hit record. Skipping any of these is the single most common cause of a take being unusable.

| Setup item | What to do | Why |
|---|---|---|
| Browser window 1 | Mate dev server at `localhost:3000`, fresh signed-out state | Beat 3 needs cold sign-in |
| Browser window 2 | Outlook web at `outlook.office.com`, calendar week view, signed into the same Microsoft account | Beat 7b needs instant alt-tab |
| App window 3 | Microsoft Teams desktop or web, signed in same account, open to a chat with Mate's bot | Beat 8 needs the notification to be visible |
| Downloads folder | Both `test/` PDFs copied in, no other PDFs visible | Beat 3a and 4 need a fast file picker |
| Terminal clip | Pre-record `app/qa/run-accuracy.ts` output to a 15-second video file | Beat 3d uses this; do not run live |
| Screen resolution | 1920×1080, single monitor, browser at 100% zoom | Recording crispness |
| Notifications | Turn off all OS notifications except Teams | Beat 8 needs Teams to be the only popup |
| Mic test | Record a 10-second test, play it back, check for room echo | Voice-over quality is half the perceived production value |

---

## 4. Delivery Notes

**Pace.** Read the script slower than feels natural. Demo voice-overs land best at about ninety percent of your normal speaking speed. The script is sized for this pacing.

**Three pauses to actually take:**

1. After "That's the problem Mate solves" in Beat 1. Half a second. Lets the hook breathe.
2. After "That's not a bug" in Beat 3c. Same length. The confidence-flag point is the single strongest data-accuracy moment in the whole video.
3. After "There they are" in Beat 7b. Let the viewer see the Outlook events appear before you keep talking.

**Recording order.** Capture clean screen video first (no fumbled mouse, no UI errors). Lay the voice-over on top in a second pass. It is much easier to redo a voice line than to re-shoot a UI bug.

**On-screen captions.** Caption the three highest-value beats so the point lands even with audio off:

- Beat 2: "Microsoft Copilot · Azure AI Foundry · Mistral Document AI · Microsoft Graph · Cosmos DB"
- Beat 3d: "Date error rate: 1.4% · Fabricated dates: 0"
- Beat 7b: "Live sync via Microsoft Graph"

---

## 5. Risk Register

| Risk | Probability | Mitigation |
|---|---|---|
| Extraction returns weird dates on the live take | Medium | Have a clean pre-recorded clip of Beat 3b ready as a backup. Splice it in during editing. |
| Outlook sync fails to show the events | Medium | Sync once successfully before recording, leave the events in place. Re-trigger sync on camera, but the events are already there. |
| Teams notification doesn't fire | High | Pre-record a clip of the Teams notification arriving earlier today. Voice-over still works word for word. |
| Latency mask flashes too fast to see | Low | If parse finishes too quickly, re-record Beat 3a only with a larger fixture PDF. |
| You go over 5 minutes | Medium | Apply the cut priority in Section 6, in order. |

---

## 6. Cut Priority if You Run Long

Cut from the bottom of this list first. Each cut is independent.

1. **First cut:** Beat 9 entirely. Saves 15 seconds.
2. **Second cut:** Beat 8 sentence "This is where most planners lose students, in the gap between scheduling something and actually being reminded of it." Saves 6 seconds.
3. **Third cut:** Beat 1 down to 10 seconds. Drop the second sentence ("Six syllabi, dozens of dates...").

**Never cut these three shots:**

- Beat 3d (the QA accuracy harness output)
- Beat 7b (Outlook events appearing in the real calendar)
- Beat 8 (Teams notification arriving)

Those are the three moments organizers explicitly said they want to see, and they map directly to the Data Accuracy and Technical Prowess pillars.

---

## 7. Submission

Send the final video file to all four KPMG contacts listed in [KPMG.md](../KPMG.md) Submission Contacts:

1. Mikee Palmiano — mbpalmiano@kpmg.com
2. Elona Anokol — eyanokol@kpmg.com
3. Renzo Erfelo — jeerfelo@kpmg.com
4. Jayco Guingab — jmguingab1@kpmg.com

**Format:** MP4 (preferred) or MOV. Keep under 100 MB if attaching by email; otherwise share via a Microsoft 365 / SharePoint link with view access for all four recipients.

**Filename convention:** `Mate-AxonEnjin-KPMG2026-Demo.mp4`

---

## 8. Cross-References

- [prd-mate.md](prd-mate.md) — binding spec; the four Must-Have capabilities you are demoing live here
- [qad-mate.md](qad-mate.md) — accuracy harness gate the Beat 3d clip is proving
- [sdd-mate.md](sdd-mate.md) — architecture the Beat 2 overlay summarizes
- [KPMG.md](../KPMG.md) — competition brief, judging criteria, submission contacts
