"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isHome = pathname === "/";
  const isDashboard = pathname === "/dashboard";
  const isUpload = pathname === "/upload";
  const showBack = !isHome;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Left: back + brand */}
        <div className="flex min-w-0 items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.push("/")}
              className="
                inline-flex shrink-0 items-center gap-1.5 text-sm font-medium
                text-text-muted transition-colors duration-150 hover:text-text
              "
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="hidden sm:inline">Back to Home</span>
            </button>
          )}

          {showBack && (
            <span className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
          )}

          <Link
            href="/"
            className="truncate font-[var(--font-display)] text-lg font-semibold text-text"
          >
            Mate
          </Link>
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {status === "loading" ? (
            <div className="flex items-center gap-2 px-2 py-2 text-sm text-text-muted">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
              <span className="hidden sm:inline">Loading...</span>
            </div>
          ) : session ? (
            <>
              {!isUpload && (
                <button
                  onClick={() => router.push("/upload")}
                  className="
                    inline-flex min-h-[36px] items-center gap-2 rounded-lg border border-primary
                    px-3 py-2 text-sm font-medium text-primary transition-all duration-150
                    hover:bg-surface-emphasis sm:px-4
                  "
                >
                  <span className="hidden sm:inline">Upload syllabus</span>
                  <span className="sm:hidden">Upload</span>
                </button>
              )}

              {!isDashboard && (
                <button
                  onClick={() => router.push("/dashboard")}
                  className="
                    inline-flex min-h-[36px] items-center gap-2 rounded-lg border border-primary
                    px-3 py-2 text-sm font-medium text-primary transition-all duration-150
                    hover:bg-surface-emphasis sm:px-4
                  "
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              )}

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="
                  inline-flex min-h-[36px] items-center rounded-lg border border-border
                  px-3 py-2 text-sm font-medium text-text-muted transition-all duration-150
                  hover:bg-surface-emphasis hover:text-text sm:px-4
                "
              >
                Log Out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/upload" })}
              className="
                inline-flex min-h-[36px] items-center rounded-lg bg-primary px-4 py-2
                text-sm font-medium text-white transition-all duration-150 hover:bg-primary-hover
              "
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
