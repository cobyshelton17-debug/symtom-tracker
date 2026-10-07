"use client";

import { useActionState, useRef, useState } from "react";
import { createEntryAction } from "@/app/actions/entries";
import type { EntryFormState } from "@/app/actions/entries";
import { severityTone } from "@/lib/severity";

type Row = { key: number; severity: number };

const inputClass =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

let nextKey = 1;

export default function CheckInForm({ suggestions }: { suggestions: string[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rows, setRows] = useState<Row[]>([{ key: 0, severity: 5 }]);
  const [savedFlash, setSavedFlash] = useState(false);

  const [state, formAction, pending] = useActionState<EntryFormState, FormData>(
    async (prev, formData) => {
      const local = formData.get("localCreatedAt");
      if (typeof local === "string" && local) {
        formData.set("createdAt", new Date(local).toISOString());
      } else {
        formData.delete("localCreatedAt");
      }
      const result = await createEntryAction(prev, formData);
      if (result.saved) {
        formRef.current?.reset();
        setRows([{ key: nextKey++, severity: 5 }]);
        setSavedFlash(true);
        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setSavedFlash(false), 2500);
      }
      return result;
    },
    {}
  );

  const addRow = () => setRows((r) => [...r, { key: nextKey++, severity: 5 }]);
  const removeRow = (key: number) =>
    setRows((r) => (r.length > 1 ? r.filter((row) => row.key !== key) : r));
  const setSeverity = (key: number, severity: number) =>
    setRows((r) => r.map((row) => (row.key === key ? { ...row, severity } : row)));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">New check-in</h2>
        {savedFlash && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
            Saved
          </span>
        )}
      </div>

      <form ref={formRef} action={formAction} className="space-y-4">
        <datalist id="symptom-suggestions">
          {suggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <div className="space-y-3">
          {rows.map((row, index) => {
            const tone = severityTone(row.severity);
            return (
              <div key={row.key} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <input
                    name="symptomName"
                    list="symptom-suggestions"
                    required
                    maxLength={60}
                    placeholder={index === 0 ? "Symptom (e.g. Headache)" : "Another symptom"}
                    autoComplete="off"
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-base outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(row.key)}
                      aria-label="Remove symptom"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:text-red-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="h-5 w-5"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18 18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="range"
                    name="symptomSeverity"
                    min={1}
                    max={10}
                    step={1}
                    value={row.severity}
                    onChange={(e) => setSeverity(row.key, Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-teal-600"
                    aria-label="Severity"
                  />
                  <span
                    className={`w-16 shrink-0 rounded-lg px-2 py-1 text-center text-sm font-semibold tabular-nums ${tone.chip}`}
                  >
                    {row.severity}/10
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 text-sm font-medium text-slate-500 transition active:scale-[0.98]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-4 w-4"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
          </svg>
          Add symptom
        </button>

        <div>
          <label htmlFor="note" className="mb-1 block text-sm font-medium text-slate-700">
            Note <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="note"
            name="note"
            rows={2}
            maxLength={2000}
            placeholder="Anything else worth remembering?"
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div>
          <label htmlFor="localCreatedAt" className="mb-1 block text-sm font-medium text-slate-700">
            Time <span className="font-normal text-slate-400">(defaults to now)</span>
          </label>
          <input
            id="localCreatedAt"
            name="localCreatedAt"
            type="datetime-local"
            className={inputClass}
          />
          <input type="hidden" name="createdAt" value="" />
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-xl bg-teal-600 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save check-in"}
        </button>
      </form>
    </section>
  );
}
