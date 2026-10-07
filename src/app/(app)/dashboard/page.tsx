import { redirect } from "next/navigation";
import { auth } from "@/auth";
import CheckInForm from "@/components/check-in-form";
import EntryCard from "@/components/entry-card";
import { getSymptomSuggestions, listEntries } from "@/lib/entries";
import { formatFullDate, localDateKey } from "@/lib/time";

export const instant = false;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const today = new Date();
  const [year, month, day] = localDateKey(today).split("-").map(Number);

  const [entries, suggestions] = await Promise.all([
    listEntries(userId, { year, month, day }),
    getSymptomSuggestions(userId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Today</h1>
        <p className="text-sm text-slate-500">{formatFullDate(today)}</p>
      </div>

      <CheckInForm suggestions={suggestions} />

      <section>
        <h2 className="mb-3 text-base font-semibold">
          Today&apos;s entries
          {entries.length > 0 && (
            <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
              {entries.length}
            </span>
          )}
        </h2>

        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <p className="text-sm text-slate-500">
              No check-ins yet today. Log how you&apos;re feeling above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
