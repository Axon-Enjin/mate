"use client";

import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

export default function NavBar() {
  const router = useRouter();
  const { data: session, status } = useSession();

  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
      {status === "loading" ? (
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900"></div>
          Loading...
        </div>
      ) : session ? (
        <>
          <button
            onClick={() => router.push("/upload")}
            className="
              inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-medium
              text-primary transition-all duration-150 hover:bg-surface-emphasis
            "
          >
            Upload syllabus
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="
              inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-medium
              text-primary transition-all duration-150 hover:bg-surface-emphasis
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
            Dashboard
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="
              inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium
              text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            "
          >
            Log Out
          </button>
        </>
      ) : (
        <button
          onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/upload" })}
          className="
            inline-flex items-center gap-2 rounded-lg bg-[#0078d4] px-4 py-2 text-sm font-medium
            text-white transition-colors hover:bg-[#106ebe] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0078d4]
          "
        >
          Sign In
        </button>
      )}
    </div>
  );
}
