import { z } from "zod";

export const severitySchema = z.number().int().min(1).max(10);

export const symptomSchema = z.object({
  name: z.string().trim().min(1).max(60),
  severity: severitySchema,
});

const createdAtSchema = z
  .coerce.date()
  .refine((d) => d.getTime() >= Date.parse("2000-01-01T00:00:00Z"), {
    message: "Timestamp must be in year 2000 or later",
  })
  .refine((d) => d.getTime() <= Date.now() + 5 * 60 * 1000, {
    message: "Timestamp cannot be in the future",
  });

export const entrySchema = z.object({
  createdAt: createdAtSchema,
  note: z
    .string()
    .trim()
    .max(2000, "Note must be 2000 characters or fewer")
    .optional()
    .transform((v) => (v ? v : undefined)),
  symptoms: z
    .array(symptomSchema)
    .min(1, "Add at least one symptom")
    .max(50, "A check-in can have at most 50 symptoms"),
});

export const entryUpdateSchema = entrySchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const registerSchema = z.object({
  email: z.email("Enter a valid email").max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  name: z
    .string()
    .trim()
    .min(1)
    .max(100, "Name must be 100 characters or fewer")
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email").max(254),
  password: z.string().min(1, "Password is required").max(128),
});

export const yearParam = z.coerce.number().int().min(2000).max(2100);
export const monthParam = z.coerce.number().int().min(1).max(12);
export const dayParam = z.coerce.number().int().min(1).max(31);

export const entriesQuerySchema = z
  .object({
    year: yearParam.optional(),
    month: monthParam.optional(),
    day: dayParam.optional(),
  })
  .refine((v) => !(v.month !== undefined && v.year === undefined), {
    message: "month requires year",
  })
  .refine((v) => !(v.day !== undefined && (v.year === undefined || v.month === undefined)), {
    message: "day requires year and month",
  });
