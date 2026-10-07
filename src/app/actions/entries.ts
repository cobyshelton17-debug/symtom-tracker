"use server";

import { revalidatePath } from "next/cache";
import { createEntry, deleteEntry } from "@/lib/entries";
import { currentUserId } from "@/lib/session";
import { entrySchema } from "@/lib/validation";

export type EntryFormState = { error?: string; saved?: boolean };

export async function createEntryAction(
  _prevState: EntryFormState,
  formData: FormData
): Promise<EntryFormState> {
  const userId = await currentUserId();
  if (!userId) return { error: "You are signed out. Please sign in again." };

  const names = formData.getAll("symptomName").map((v) => String(v));
  const severities = formData.getAll("symptomSeverity").map((v) => String(v));
  const symptoms = names
    .map((name, i) => ({ name: name.trim(), severity: Number(severities[i]) }))
    .filter((s) => s.name.length > 0);

  const createdAtRaw = formData.get("createdAt");
  const createdAt = createdAtRaw ? new Date(String(createdAtRaw)) : new Date();

  const noteRaw = formData.get("note");
  const note = typeof noteRaw === "string" && noteRaw.trim() ? noteRaw : undefined;

  const parsed = entrySchema.safeParse({ createdAt, note, symptoms });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createEntry(userId, parsed.data);

  revalidatePath("/dashboard");
  revalidatePath("/history");
  return { saved: true };
}

export async function deleteEntryAction(formData: FormData): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  await deleteEntry(userId, id);
  revalidatePath("/dashboard");
  revalidatePath("/history");
}
