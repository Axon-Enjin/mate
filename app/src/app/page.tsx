"use client";

import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import NavBar from "@/components/NavBar";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const handlePrimaryCta = () => {
    if (session) {
      router.push("/upload");
      return;
    }

    signIn("microsoft-entra-id", { callbackUrl: "/upload" });
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-bg">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-warning/15 blur-3xl animate-[float_10s_ease-in-out_infinite]" />
      </div>

      <NavBar />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-6 animate-[fade-up_700ms_ease-out]">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                Copilot-powered academic flow
              </span>
              <h1 className="text-4xl font-[var(--font-display)] leading-tight text-text sm:text-5xl lg:text-6xl">
                Meet Mate, the zero-setup academic orchestrator.
              </h1>
              <p className="max-w-xl text-lg text-text-muted sm:text-xl">
                Upload your syllabi once and Mate extracts every deadline, flags collision weeks, and
                proposes study blocks around real availability. No templates. No busywork.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handlePrimaryCta}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-150 hover:bg-primary-hover"
                >
                  Upload a syllabus
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-text transition-all duration-150 hover:bg-surface-emphasis"
                >
                  View dashboard
                </button>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Batch approve every deadline
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  Early conflict alerts
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Lateral language requests
                </span>
              </div>
            </div>

            <div className="space-y-4 animate-[fade-up_900ms_ease-out]">
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                  Live flow snapshot
                </p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-border bg-surface-emphasis p-4">
                    <p className="text-sm font-semibold text-text">Upload syllabus</p>
                    <p className="text-xs text-text-muted">
                      Immediate ack + latency mask while extraction runs.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-emphasis p-4">
                    <p className="text-sm font-semibold text-text">Review & approve</p>
                    <p className="text-xs text-text-muted">
                      Consolidated deadline list, needs-review flags, one-click approval.
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-emphasis p-4">
                    <p className="text-sm font-semibold text-text">Plan the week</p>
                    <p className="text-xs text-text-muted">
                      Adaptive study blocks aligned to your actual availability.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <p className="text-sm font-semibold text-text">Conflict reasoning</p>
                  <p className="text-xs text-text-muted">
                    Mate names collision weeks and suggests early intervention steps.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <p className="text-sm font-semibold text-text">Clarifying prompts</p>
                  <p className="text-xs text-text-muted">
                    One targeted question when a request is ambiguous.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="mt-16 grid gap-6 lg:grid-cols-3 animate-[fade-up_1100ms_ease-out]">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                Built for PH students
              </p>
              <h2 className="mt-3 text-lg font-semibold text-text">Zero-setup relief</h2>
              <p className="text-sm text-text-muted">
                Designed for students who drop planners because setup friction kills momentum. Mate
                starts with one upload and never asks for a template.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                Accuracy first
              </p>
              <h2 className="mt-3 text-lg font-semibold text-text">No silent deadlines</h2>
              <p className="text-sm text-text-muted">
                Low-confidence items are flagged for review and nothing is committed without a batch
                approval.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                Integrations
              </p>
              <h2 className="mt-3 text-lg font-semibold text-text">Calendar-ready</h2>
              <p className="text-sm text-text-muted">
                Microsoft 365 sync is enabled in the demo; Google Workspace sync is planned next.
              </p>
            </div>
          </section>

          <section className="mt-16 rounded-3xl border border-border bg-surface p-8 shadow-md animate-[fade-up_1300ms_ease-out]">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <h2 className="text-2xl font-[var(--font-display)] text-text">
                  From upload to approved plan in under a minute.
                </h2>
                <p className="mt-3 text-sm text-text-muted">
                  Mate masks AI latency, keeps the flow focused, and gives you a consolidated view of
                  deadlines, conflicts, and weekly study blocks.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePrimaryCta}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-150 hover:bg-primary-hover"
                >
                  Start with a syllabus
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-text transition-all duration-150 hover:bg-surface-emphasis"
                >
                  See your dashboard
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}