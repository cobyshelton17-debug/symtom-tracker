import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import EntryCard from "@/components/entry-card";
import TrendChart from "@/components/trend-chart";
import {
  historyDays,
  historyMonths,
  historyYears,
  listEntries,
  trendBySymptom,
} from "@/lib/entries";
import { localDateKey, pad } from "@/lib/time";
import { dayParam, monthParam, yearParam } from "@/lib/validation";

export const instant = false;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type SearchParams = { year?: string; month?: string; day?: string };

function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 transition active:opacity-70"
    >
      <span aria-hidden>←</span>
      {children}
    </Link>
  );
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const sp = await searchParams;
  const year = sp.year ? yearParam.safeParse(sp.year) : null;
  const month = sp.month ? monthParam.safeParse(sp.month) : null;
  const day = sp.day ? dayParam.safeParse(sp.day) : null;

  if (!year?.success) {
    const years = await historyYears(userId);
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">History</h1>
          <p className="text-sm text-slate-500">Browse by year, month, and day</p>
        </div>

        {years.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <p className="text-sm text-slate-500">
              No entries yet. Your history will appear here once you start checking in.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {years.map((y) => (
              <li key={y.year}>
                <Link
                  href={`/history?year=${y.year}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition active:scale-[0.99]"
                >
                  <span className="text-base font-semibold">{y.year}</span>
                  <span className="flex items-center gap-2 text-sm text-slate-500">
                    {y.count} {y.count === 1 ? "entry" : "entries"}
                    <span aria-hidden className="text-slate-300">
                      ›
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (!month?.success) {
    const months = await historyMonths(userId, year.data);
    const byMonth = new Map(months.map((m) => [m.month, m.count]));

    return (
      <div className="space-y-4">
        <BackLink href="/history">All years</BackLink>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{year.data}</h1>
          <p className="text-sm text-slate-500">Pick a month</p>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {MONTHS.map((name, index) => {
            const m = index + 1;
            const count = byMonth.get(m) ?? 0;
            if (count === 0) {
              return (
                <div
                  key={name}
                  className="rounded-xl border border-slate-200 bg-slate-100 p-3 text-center opacity-60"
                >
                  <p className="text-sm font-medium text-slate-400">{name.slice(0, 3)}</p>
                  <p className="text-xs text-slate-400">—</p>
                </div>
              );
            }
            return (
              <Link
                key={name}
                href={`/history?year=${year.data}&month=${m}`}
                className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm transition active:scale-[0.97]"
              >
                <p className="text-sm font-semibold">{name.slice(0, 3)}</p>
                <p className="text-xs text-slate-500">
                  {count} {count === 1 ? "entry" : "entries"}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  if (!day?.success) {
    const [days, trend] = await Promise.all([
      historyDays(userId, year.data, month.data),
      trendBySymptom(userId, year.data, month.data),
    ]);
    const byDay = new Map(days.map((d) => [d.day, d.count]));

    const daysInMonth = new Date(Date.UTC(year.data, month.data, 0)).getUTCDate();
    const firstWeekday = new Date(Date.UTC(year.data, month.data - 1, 1)).getUTCDay();
    const todayKey = localDateKey(new Date());
    const monthPrefix = `${year.data}-${pad(month.data)}`;

    const cells: (number | null)[] = [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
      <div className="space-y-4">
        <BackLink href={`/history?year=${year.data}`}>All months</BackLink>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {MONTHS[month.data - 1]} {year.data}
          </h1>
          <p className="text-sm text-slate-500">
            {days.reduce((sum, d) => sum + d.count, 0)} entries this month
          </p>
        </div>

        <TrendChart series={trend.series} />

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-1.5 grid grid-cols-7 text-center text-xs font-medium text-slate-400">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w[0]}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={`blank-${i}`} />;
              const count = byDay.get(d) ?? 0;
              const key = `${monthPrefix}-${pad(d)}`;
              const isToday = key === todayKey;

              if (count === 0) {
                return (
                  <div
                    key={key}
                    className={`flex h-10 flex-col items-center justify-center rounded-lg text-sm ${
                      isToday
                        ? "bg-teal-50 font-semibold text-teal-700"
                        : "text-slate-300"
                    }`}
                  >
                    {d}
                  </div>
                );
              }

              return (
                <Link
                  key={key}
                  href={`/history?year=${year.data}&month=${month.data}&day=${d}`}
                  className={`flex h-10 flex-col items-center justify-center rounded-lg text-sm transition active:scale-95 ${
                    isToday
                      ? "bg-teal-600 font-bold text-white"
                      : "bg-teal-50 font-semibold text-teal-700"
                  }`}
                >
                  {d}
                  <span
                    className={`text-[9px] leading-none ${
                      isToday ? "text-teal-100" : "text-teal-500"
                    }`}
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const y = year.data;
  const m = month.data;
  const d = day.data;
  const entries = await listEntries(userId, { year: y, month: m, day: d });
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  const title = `${WEEKDAYS[date.getUTCDay()]}, ${MONTHS[m - 1]} ${d}, ${y}`;

  return (
    <div className="space-y-4">
      <BackLink href={`/history?year=${y}&month=${m}`}>{MONTHS[m - 1]}</BackLink>
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-slate-500">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <p className="text-sm text-slate-500">No entries on this day.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
