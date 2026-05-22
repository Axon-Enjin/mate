import { signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mate</h1>
          <p className="text-gray-600 mb-8">
            Autonomous Academic Orchestrator
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Sign in with your Microsoft account to sync your calendar and manage your academic schedule
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", {
              redirectTo: resolvedSearchParams.callbackUrl || "/dashboard",
            });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#0078d4] hover:bg-[#106ebe] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0078d4] transition-colors"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 23 23"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11 11H0V0h11v11z" fill="#f25022" />
              <path d="M23 11H12V0h11v11z" fill="#7fba00" />
              <path d="M11 23H0V12h11v11z" fill="#00a4ef" />
              <path d="M23 23H12V12h11v11z" fill="#ffb900" />
            </svg>
            Sign in with Microsoft
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-6">
          By signing in, you agree to sync your Outlook calendar with Mate for scheduling purposes
        </p>
      </div>
    </div>
  );
}
