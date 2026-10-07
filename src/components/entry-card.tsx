import DeleteButton from "@/components/delete-button";
import { severityTone } from "@/lib/severity";
import { formatClockTime } from "@/lib/time";
import type { Entry, Symptom } from "@/generated/prisma/client";

type EntryWithSymptoms = Entry & { symptoms: Symptom[] };

export default function EntryCard({ entry }: { entry: EntryWithSymptoms }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tabular-nums">{formatClockTime(entry.createdAt)}</p>
          {entry.note && <p className="mt-0.5 text-sm text-slate-500">{entry.note}</p>}
        </div>
        <DeleteButton id={entry.id} />
      </div>

      <ul className="space-y-2">
        {entry.symptoms.map((symptom) => {
          const tone = severityTone(symptom.severity);
          return (
            <li key={symptom.id}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="truncate text-sm text-slate-700">{symptom.name}</span>
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${tone.chip}`}
                >
                  {symptom.severity}/10
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${tone.bar}`}
                  style={{ width: `${symptom.severity * 10}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
