import { db } from "@/lib/db";
import {
  localDateKey,
  pad,
  utcWindowForDay,
  utcWindowForMonth,
  utcWindowForYear,
} from "@/lib/time";
import type { entrySchema } from "@/lib/validation";
import type { z } from "zod";

export type EntryInput = z.infer<typeof entrySchema>;
export type EntryUpdateInput = Partial<EntryInput>;

const symptomsByDate = { orderBy: { name: "asc" } } as const;

export async function createEntry(userId: string, input: EntryInput) {
  return db.entry.create({
    data: {
      userId,
      createdAt: input.createdAt,
      note: input.note ?? null,
      symptoms: { create: input.symptoms },
    },
    include: { symptoms: symptomsByDate },
  });
}

export type EntryFilter = {
  year?: number;
  month?: number;
  day?: number;
};

export async function listEntries(userId: string, filter: EntryFilter = {}) {
  const where: { userId: string; createdAt?: { gte: Date; lte: Date } } = { userId };

  let datePredicate: ((date: Date) => boolean) | null = null;

  if (filter.day !== undefined && filter.year !== undefined && filter.month !== undefined) {
    const { start, end } = utcWindowForDay(filter.year, filter.month, filter.day);
    where.createdAt = { gte: start, lte: end };
    const target = `${filter.year}-${pad(filter.month)}-${pad(filter.day)}`;
    datePredicate = (date) => localDateKey(date) === target;
  } else if (filter.month !== undefined && filter.year !== undefined) {
    const { start, end } = utcWindowForMonth(filter.year, filter.month);
    where.createdAt = { gte: start, lte: end };
    const prefix = `${filter.year}-${pad(filter.month)}`;
    datePredicate = (date) => localDateKey(date).startsWith(prefix);
  } else if (filter.year !== undefined) {
    const { start, end } = utcWindowForYear(filter.year);
    where.createdAt = { gte: start, lte: end };
    const prefix = `${filter.year}`;
    datePredicate = (date) => localDateKey(date).startsWith(prefix);
  }

  const entries = await db.entry.findMany({
    where,
    include: { symptoms: symptomsByDate },
    orderBy: { createdAt: "desc" },
  });

  if (!datePredicate) return entries;
  return entries.filter((entry) => datePredicate!(entry.createdAt));
}

export async function getEntry(userId: string, id: string) {
  return db.entry.findFirst({
    where: { id, userId },
    include: { symptoms: symptomsByDate },
  });
}

export async function updateEntry(userId: string, id: string, input: EntryUpdateInput) {
  return db.$transaction(async (tx) => {
    const data: { note?: string | null; createdAt?: Date } = {};
    if (input.note !== undefined) data.note = input.note ?? null;
    if (input.createdAt !== undefined) data.createdAt = input.createdAt;

    const { count } = await tx.entry.updateMany({
      where: { id, userId },
      data,
    });
    if (count === 0) return null;

    if (input.symptoms !== undefined) {
      await tx.symptom.deleteMany({ where: { entryId: id } });
      await tx.symptom.createMany({
        data: input.symptoms.map((s) => ({ entryId: id, name: s.name, severity: s.severity })),
      });
    }

    return tx.entry.findUnique({
      where: { id },
      include: { symptoms: symptomsByDate },
    });
  });
}

export async function deleteEntry(userId: string, id: string): Promise<boolean> {
  const { count } = await db.entry.deleteMany({ where: { id, userId } });
  return count > 0;
}

export async function getSymptomSuggestions(userId: string, limit = 20): Promise<string[]> {
  const rows = await db.symptom.findMany({
    where: { entry: { userId } },
    select: { name: true },
    distinct: ["name"],
    orderBy: { name: "asc" },
    take: limit,
  });
  return rows.map((r) => r.name);
}

export async function historyYears(userId: string) {
  const rows = await db.entry.findMany({
    where: { userId },
    select: { createdAt: true },
  });

  const counts = new Map<number, number>();
  for (const row of rows) {
    const year = Number(localDateKey(row.createdAt).slice(0, 4));
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year - a.year);
}

export async function historyMonths(userId: string, year: number) {
  const { start, end } = utcWindowForYear(year);
  const rows = await db.entry.findMany({
    where: { userId, createdAt: { gte: start, lte: end } },
    select: { createdAt: true },
  });

  const counts = new Map<number, number>();
  for (const row of rows) {
    const key = localDateKey(row.createdAt);
    if (!key.startsWith(String(year))) continue;
    const month = Number(key.slice(5, 7));
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month - b.month);
}

export async function historyDays(userId: string, year: number, month: number) {
  const { start, end } = utcWindowForMonth(year, month);
  const rows = await db.entry.findMany({
    where: { userId, createdAt: { gte: start, lte: end } },
    select: { createdAt: true },
  });

  const prefix = `${year}-${pad(month)}`;
  const counts = new Map<number, number>();
  for (const row of rows) {
    const key = localDateKey(row.createdAt);
    if (!key.startsWith(prefix)) continue;
    const day = Number(key.slice(8, 10));
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day - b.day);
}

export type TrendSeries = {
  name: string;
  points: { date: string; average: number; count: number }[];
};

export async function trendBySymptom(
  userId: string,
  year: number,
  month: number
): Promise<{ year: number; month: number; series: TrendSeries[] }> {
  const { start, end } = utcWindowForMonth(year, month);
  const entries = await db.entry.findMany({
    where: { userId, createdAt: { gte: start, lte: end } },
    include: { symptoms: true },
  });

  const prefix = `${year}-${pad(month)}`;
  const bySymptom = new Map<string, Map<string, { sum: number; count: number }>>();

  for (const entry of entries) {
    const date = localDateKey(entry.createdAt);
    if (!date.startsWith(prefix)) continue;
    for (const symptom of entry.symptoms) {
      let dates = bySymptom.get(symptom.name);
      if (!dates) {
        dates = new Map();
        bySymptom.set(symptom.name, dates);
      }
      const bucket = dates.get(date) ?? { sum: 0, count: 0 };
      bucket.sum += symptom.severity;
      bucket.count += 1;
      dates.set(date, bucket);
    }
  }

  const series: TrendSeries[] = [...bySymptom.entries()]
    .map(([name, dates]) => ({
      name,
      points: [...dates.entries()]
        .map(([date, bucket]) => ({
          date,
          average: Math.round((bucket.sum / bucket.count) * 10) / 10,
          count: bucket.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { year, month, series };
}
