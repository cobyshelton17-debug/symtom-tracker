import { redirect } from "next/navigation";
import { auth, googleSignInEnabled } from "@/auth";
import LoginForm from "@/components/login-form";

export const instant = false;

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-7 w-7"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12h4l2.5-6 4 12 2.5-6H21"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Symptom Tracker</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track how you feel, one check-in at a time
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <LoginForm googleEnabled={googleSignInEnabled} />
        </div>
      </div>
    </main>
  );
}
