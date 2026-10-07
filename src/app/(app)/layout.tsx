import { redirect } from "next/navigation";
import { auth } from "@/auth";
import BottomNav from "@/components/bottom-nav";
import SignOutButton from "@/components/sign-out-button";

export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4.5 w-4.5"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l2.5-6 4 12 2.5-6H21" />
              </svg>
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Symptom Tracker</p>
              <p className="max-w-[10rem] truncate text-xs text-slate-500">
                {session.user.email ?? session.user.name ?? "Signed in"}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1 px-4 pb-32 pt-5">{children}</main>

      <BottomNav />
    </div>
  );
}
